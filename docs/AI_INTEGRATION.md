# AI Integration

The AI layer is an **optional enhancement**. It never builds the comparison table, never picks the stack, never decides the ranking structure, and is never required for a result. Adapted from Architecture Advisor's `docs/AI_INTEGRATION.md` (sibling ADR-002, ADR-005); this file says where we differ and why.

## 1. Providers and fallback chain
```
Gemini Flash-Lite ──fail──▶ Groq (gpt-oss-120b) ──fail──▶ rules-only
```
| Order | Provider / model (env, configurable) | Free limit | Timeout |
|---|---|---|---|
| 1 | Google Gemini `gemini-3.5-flash-lite` (`GEMINI_MODEL`) | Not published: the rate-limit page says free-tier limits "can be viewed in Google AI Studio"; RPD resets at midnight Pacific (checked 2026-11-09, RESEARCH §9) | 10 s |
| 2 | Groq `openai/gpt-oss-120b` (`GROQ_MODEL`) | 30 RPM / 1K RPD / 8K TPM / 200K TPD on the rate-limit page (checked 2026-11-09; the models page says 250K TPM, so the page and the account's Limits page may differ) | 8 s |
| — | Rules-only | ∞ | — |

- **Same providers as the sibling** (re-checked 2026-11-09 from the vendors' pages): `gemini-3.5-flash-lite` is "Stable" (Gemini 2.5 Flash routes to it from 2026-12-01); `openai/gpt-oss-120b` is a Groq production model with no deprecation notice. Two providers give far more explanations a day than expected traffic, and the rules-only result is always there.
- **Model IDs live in env, not code.** Providers retire models often; upgrading is a config change.
- **Overall AI budget:** 20 s. The user already sees the rule result, so nobody waits on a blank screen.
- **Implementation:** Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/groq`) behind our own `LlmProvider` port (`src/modules/ai/providers/types.ts`); `generateText` + `Output.object` with our JSON schema, `maxRetries: 0`, no temperature or penalties (Gemini 3.5 Flash-Lite rejects them), Groq with `strictJsonSchema: false` and `reasoningEffort: "low"`. Same adapters as the sibling.

## 2. When to try the next provider
As the sibling: timeout, network error, 5xx, empty reply → next provider; 429 per minute → next, the provider rests 60 s (or `Retry-After`); 429 daily (`per day`, `RPD`, `TPD`, `PerDay` in the error) → next, the provider rests until its reset (Gemini midnight Pacific, Groq midnight UTC); invalid reply (not JSON, fails the schema or the checks of §6) → **one repair retry** on the same provider with the reason, then the next provider. The rest state is a tiny circuit breaker in the store (§8).

## 3. What the AI receives (small prompt)
Built by `buildPrompt` (`src/modules/ai/prompt.ts`), pure. Only:
1. The project answers (question text + option labels), effective importance levels above Low, team skills, known frameworks, goal, must-use picks, the Architecture Advisor style.
2. The **recommended stack** from the server-side rule result, with its stack score.
3. Per part in the stack: the chosen approach and the next two; the **top 5 products** with final, base, rule and skill points (and the rank score when the approach gap lowers it). The top 3 and the stack's pick also get their three biggest criterion scores, every rule/skill adjustment with the rule's own words, and the KB summary line. Not-needed parts say why.
4. Why a pick isn't its part's #1, stack close calls, raised importance levels, rule and relation notes, lock warnings.
5. The list of **adjustable** ids and the free-text notes (≤ 1,000 characters, redacted), wrapped in delimiters and declared data.

Size: about 1,300–2,100 tokens of prompt plus ~470 of JSON schema for the 13 golden scenarios (pinned by `tests/ai/prompt.test.ts`: under 2,300 and 2,800). That is more than the sibling's ~1,200 because five parts are shown, and fits Groq's 8K TPM at about 2–3 requests a minute; Gemini is first, and identical requests are cached.

### System prompt (v1, `PROMPT_VERSION = "1"`)
Starts from the sibling's v2 writing rules (short summary tied to the user's answers, no lists of definitions, jargon explained in the same sentence, no markdown). Changes for stacks: `explanation.stack` has one entry per part, in order, naming the option **in the stack after the AI's adjustments**; the AI is told it cannot pick the stack, the engine re-assembles it with its compatibility rules.

### v2 and v3
- **v2** (2026-11-09, PR #11): `mentions` for items the notes name (glossary, option aliases).
- **v3** (2026-11-09, after the first live replies, §12): cautions must rest on the facts in the prompt, not general knowledge; a **money rule** (the prompt carries no prices, free tiers or plan limits, so no field may talk about free tiers, plan limits, cold starts, dollar amounts or whether the stack fits the budget; the engine already weighed the budget answer); mentions in the AI's own words, tied to the stack, not a copy of the given text. A rule against adjusting an option that is already #1 and in the stack was tried and dropped: Gemini kept doing it, and such an adjustment is allowed by §5 (the note is information the engine couldn't see) and shown openly as "AI: +5".

## 4. Response schema (`src/modules/ai/schema.ts`)
```ts
{
  adjustments: Array<{ optionId: enum(ADJUSTABLE), delta: int −5…+5, ≠ 0, reason: 10–240 chars, basis: "notes" | "inputs" }>, // max 3, unique ids
  explanation: {
    summary: string ≤ 700,
    stack: Array<{ partId: enum(parts in the stack), optionId: enum(ranked products of those parts), why: string ≤ 400 }>,
    cautions: string[] ≤ 3 (each ≤ 240),
    notesUsed: string[] ≤ 3 (each ≤ 160),
  }
}
```
`mentions` (since 2026-11-09, prompt v2): `explanation.mentions: Array<{ id: enum(matched ids), answer: string ≤ 300 }>`, ids `option:<id>` or `glossary:<id>` from `matchMentions` on the notes (KB schema §10); the prompt lists them under MENTIONED IN NOTES with the KB's answer, and validation requires each matched item answered exactly once (none when nothing matched). The result page also shows the KB's own answers ("You mentioned"), so the user gets an answer with AI off. The sibling's `reuse` (cache tier T2) is left out: T2 is not built (§7).

## 5. Adjustment limits
| Limit | Value | Where enforced |
|---|---|---|
| Per option | −5 … +5 points, integer, not 0 (`meta.caps.ai`) | Schema, server clamp, and the engine (`validateAiDeltas` throws) |
| Max adjusted options | 3 | Schema and engine |
| Which options | **Products in the top 5 of their part**, parts in the stack only, **locked parts never** (a lock is the user's choice and the part's only candidate) | Schema enum built per request; validation re-checks |
| Types (approaches) | Not adjustable: the approach decision stays with the rules | Schema (only products are listed) |
| Hard rules | T6 (a strong language before one nobody knows) and locks still apply after the deltas | Engine |

**The server re-runs the engine with the deltas** (`score(input, kb, aiDeltas)`, SCORING_ENGINE step 5): a delta is added to the product's final (clamped 0–100) and so to its rank score; ranking, T6 and the whole stack assembly (relations, penalties, ties, close calls) run again. The AI can lift a close #2 into the stack only when the compatibility rules allow it. The engine stays pure; with no deltas the result is identical to the rules-only one (tested for every golden scenario).

## 6. Validation and consistency checks (`src/modules/ai/validate.ts`, after Zod)
1. Parse (objects, fenced JSON, JSON inside prose), schema, then strip tags and markdown links from every string (the UI renders AI text as plain text).
2. Clamp deltas; re-check each id is adjustable.
3. `basis: "notes"` needs notes, and any phrase quoted in the reason (8+ characters) must appear in the notes.
4. Re-run the engine with the deltas. `explanation.stack` must list exactly the parts of the stack, in display order, each with the option the engine now picks. Otherwise the reply is invalid and the repair message names the right stack.

## 7. Caching
**Only tier T1 (identical requests)** is built: the key is a SHA-256 of the KB version, prompt version, every structured answer (keys sorted) and the normalised redacted notes. A hit is re-validated against the freshly computed rule result (§6) and returned as `cached` without an AI call, and without counting against the daily budget. `CACHE_IDENTICAL_REUSE=false` sends identical requests to the AI again. Entries keep the validated response for 30 days; no notes are stored.

**Why no T2 ("similar" requests reuse a draft):** the sibling notes T2 still makes one AI request, so it saves no quota; it buys consistent wording at the cost of a similarity test, a diff list and a second schema. With five parts, "similar" is harder to define (the stack, not one ranking). Decided by Claude under the delegated AI design (OPEN_QUESTIONS); can be added later without changing the API.

## 8. Abuse and quota protection
As the sibling: per-client limit on `/api/explain` of 10 requests per 10 minutes and 30 a day (hashed IP), a global daily AI budget (`AI_DAILY_BUDGET`, default 1,300), notes ≤ 1,000 characters, a request body limit. The cache, limits, budget and breaker run on an in-memory `KvStore` per server instance (`src/modules/platform/store.ts`, Redis-shaped, so an Upstash adapter is one file later).

## 9. Security and privacy
- Keys only in server env (`GEMINI_API_KEY`, `GROQ_API_KEY`), never `NEXT_PUBLIC_`; `scripts/check-env-names.mjs` (in `npm run fitness`) fails on any secret-looking `NEXT_PUBLIC_` name. `src/modules/ai/index.ts`, the providers and `platform/` import `server-only`; dependency-cruiser forbids components and pages from importing `ai/` or `platform/`.
- The server **recomputes** the rule result; it never trusts scores from the browser.
- **Prompt injection:** notes are delimited and declared data; the output is schema-locked to known ids and bounded deltas, and the stack is assembled by the engine, so the worst case is an odd explanation, not a manipulated stack.
- **Redaction** before sending (emails, phone numbers, URLs with query strings, key-like strings) — cheap and tested, not a guarantee.
- **No logging** of notes or AI text: one JSON line per request with provider, latency, status and attempt outcomes.
- **Privacy notice, opt-out and `/privacy` page:** come with the UI (Phase 4 step 3). Facts for the page (checked 2026-11-09): Google's Gemini API terms say content sent to **unpaid** services is used to improve Google's products and may be read by human reviewers, and ask not to send sensitive or personal information; Groq does not retain inference inputs and outputs by default, but may log them for up to 30 days to troubleshoot or investigate abuse.

## 10. What the user sees (`AiBlock.status`)
`ok` / `cached` (explanation, adjustments, provider in small print), `unavailable` (all providers failed or the budget is spent: "the ranking below is complete"), `rate_limited`, `disabled` (`AI_MODE=off`), `skipped` (the user opted out; no request). The type lives in `src/modules/recommendation/types.ts`, so the UI never imports the AI module. The block carries `stack`, the stack the server assembled with the adjustments; the browser can recompute it with the same pure engine (`score(input, kb, deltas)`).

## 11. Testing hooks
`AI_MODE=off|mock|live` (default off). With `mock`, `AI_MOCK` picks a fixture: `ok` (explains the rule stack), `reorder` (+5 for the #2 of the first part whose #2 is within 5 points of an in-stack #1, naming the stack that would follow; valid only when the engine agrees, e.g. golden G3; otherwise the chain falls back to rules-only), `invalid`, `slow`, `429`, `fail`. Tests: `tests/ai/` and `tests/scoring/ai-deltas.test.ts` (TESTING_STRATEGY §4).

## 12. As built
Phase 4 step 1 (2026-11-09): `src/modules/ai/` (`context.ts`, `prompt.ts`, `schema.ts`, `validate.ts`, `redact.ts`, `chain.ts`, `cache.ts`, `explain.ts`, `index.ts`, `providers/{types,sdk,gemini,groq,mock}.ts`) and `src/modules/platform/` (`env.ts`, `store.ts`, `rate-limit.ts`). Chain, providers, redaction and platform are the sibling's code unchanged; context, prompt, schema, validation, cache and the mock are rewritten for parts and stacks.

| Setting (server-only env) | Default | Meaning |
|---|---|---|
| `AI_MODE` | `off` | `off` / `mock` / `live` (the live site runs `live` since 2026-11-09) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | –, `gemini-3.5-flash-lite` | Provider 1; skipped when the key is empty |
| `GROQ_API_KEY`, `GROQ_MODEL` | –, `openai/gpt-oss-120b` | Provider 2; skipped when the key is empty |
| `CACHE_IDENTICAL_REUSE` | `true` | `false` sends identical requests to the AI again |
| `AI_DAILY_BUDGET` | `1300` | AI requests per UTC day across all users |
| `AI_MOCK` | `ok` | Fixture for `AI_MODE=mock` |

Step 2 (2026-11-09): **`POST /api/explain`** (`src/app/api/explain/route.ts`): body `{ input }` → `{ ai: AiBlock }`. 413 over 16 KB; 400 for a body that isn't JSON or an input that fails `parseInput` (`src/modules/ai/input.ts`: a strict Zod shape incl. notes ≤ 1,000 characters, then `validateInput` and `checkInput`, as the form does), with readable issues and no internals; `disabled` with `AI_MODE=off` (before any rate limiting or AI call); `rate_limited` over the per-client limit; otherwise `explain()`'s block, and `unavailable` if anything in the AI step throws. Anything else in the body (scores, a stack) is ignored: the server recomputes.


Step 3 (2026-11-09, app v0.4.0): the UI.
- **Notes box** on step 4 (`src/components/form/notes-field.tsx`): optional, 1,000 characters with a counter, the privacy notice from §9 (it changes to "nothing is sent" when AI is off), a link to `/privacy`, and the **"Don't use AI for this request"** checkbox. `FormState` gained `notes` and `useAi` (saved in the tab like other answers). **Share links carry neither** (links get pasted into chats; same as the sibling); a shared link opens with AI on and no notes.
- **Fetch** (`src/components/advisor/advisor.tsx`): the result shows the rules-only result at once; with AI on it POSTs `{ input }` to `/api/explain` (keyed by the input and a retry counter, aborted when the answers change). Any network or HTTP error reads as `unavailable`. With `ok`/`cached` adjustments the browser re-runs the same pure engine with the deltas and uses that result **only if its stack equals `ai.stack`** (the server's); otherwise (a version skew) it drops the AI part and keeps the rules-only result. Adjusted options list the AI's points as an adjustment "AI: <reason>" next to rule and skill points, so rule score, AI delta and final stay apart; the Markdown export includes them the same way.
- **"In plain words (AI)" panel** (`src/components/result/ai-panel.tsx`), right under the result header: loading skeleton; neutral info boxes for `disabled`, `skipped`, `unavailable` (with Retry) and `rate_limited`; otherwise an **"AI changed the stack"** box (what the rule engine picked and what the stack uses now), the summary, one line per part, cautions, the adjustments with reasons, the notes used, and "Explanation by <provider>" with "AI text can be wrong". AI text is plain text only. The header adds one sentence when the AI changed the stack.
- **`/privacy`** (`src/app/privacy/page.tsx`, footer link; About and Methodology link to it): what stays in the browser, what the AI request sends and to whom, the providers' data use (RESEARCH §9, checked 2026-11-09), the opt-out, the bounds on what the AI can change, what our server keeps (log fields, 30-day hashed cache, hashed-IP counters) and links to the providers' terms.

### Live check (2026-11-09, Q39)
Keys from the owner: Vercel Production (`AI_MODE=live`, `GEMINI_API_KEY`, `GROQ_API_KEY`) and a local `.env.local`. Input: golden G3 (real-time chat app, strong TypeScript) with the note "We already use PostgreSQL at work and would like to stay on it. Mobile app maybe later." (two mentions: `option:postgresql`, `glossary:mobile-apps`). Rules-only stack: TypeScript/Node + Vue + NestJS + PostgreSQL + Render.

| Call | Prompt | Result |
|---|---|---|
| Gemini `gemini-3.5-flash-lite`, live site `POST /api/explain` | v2 | `ok`, 2.4 s model time (3.2 s round trip). One adjustment: PostgreSQL +5 (basis notes); stack unchanged. Both mentions answered. One caution invented a price ("under a twenty-five dollar monthly budget", from the budget label); the result page (checked in Chrome) also said the stack "fits comfortably within your budget" and warned about free-tier spin-down, neither of which the prompt states. |
| Groq `openai/gpt-oss-120b`, Gemini left out (local, the app's `explain()` with only the Groq provider) | v2 | `ok`, 2.4 s. No adjustments, same stack. Cautions and the hosting `why` claimed Render's free tier and the $25 budget fit; mentions copied the glossary text word for word. |
| Gemini, local | v3 | `ok`, 2.7–2.9 s, two runs. No money or free-tier text; mentions in its own words. One of two runs again gave PostgreSQL +5 (allowed, see §3). |
| Groq, local | v3 | `ok`, 1.7–2.0 s, three runs. Mentions in its own words. One of three runs still said "Render's free tier limits may require careful monitoring". |

Every reply passed schema and consistency validation on the first try (no repair turn), and every final stack equalled the server's re-assembly. Remaining gap: Groq (the fallback, low reasoning effort) sometimes ignores the money rule. If that shows up often, the next step is a deterministic filter in `validate.ts` that drops a caution naming a free tier or a dollar amount, rather than more prompt wording. The "AI text can be wrong" line stays.
