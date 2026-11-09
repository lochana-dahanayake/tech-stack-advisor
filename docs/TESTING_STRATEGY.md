# Testing Strategy

Status: **draft (2026-10-23)**, Phase 0. **In the repo since 2026-10-24:** KB tests (`tests/kb/`), engine unit and property tests, golden scenarios and the calibration snapshot (`tests/scoring/`), all run by `npm run check`. Adapted from Architecture Advisor's `docs/TESTING_STRATEGY.md`.

Test pyramid: many fast unit tests on the KB and the engine, focused tests on the AI layer with mocked providers, a few end-to-end tests. No test calls a real AI provider or the network. Everything runs locally with `npm run check`; no CI server (decided Q25, same as the sibling's Q23).

## 1. Knowledge base tests (`tests/kb/`)
- Every JSON file passes its Zod schema.
- Every product scores every criterion that applies to its part; every type scores its part's `typeCriteria` only (no popularity criteria at type level); values are integers 1–5; each score has a source and a `checked` date.
- Every product has ≥ 1 type in its own part; `none` types have no products; bridge options have a matching `requires` relation.
- Every id referenced in rules, compatibility, skills, bundles and glossary exists.
- Every rule and relation has a user-facing explanation and a source.
- **Licence and free-tier fields** are set for every product / hosting product.
- **Fairness lint:** a comparative score whose only source is the vendor itself fails (§8 of the schema: vendor sources only for their own facts). Comparative = differs from the type's median by ≥ 2.
- **Stale facts:** `kb:stale` lists facts past their window (warning); the release gate fails at 2× the window or when a `support.until` date has passed (schema §9). The test gets "today" from the test runner, never from the engine.
- **Release gate:** fails in production mode if any source has `reviewed: false`.
- **Snapshot of the score matrix,** so any KB change is a visible diff.
- **5 or 1 needs evidence** (owner, 2026-10-24): every score of 5 or 1 has a `book:` or `ref:` source; unsourced scores are 3, GK-only, and listed in a snapshot.
- Every `book:`/`ref:` id appears in `references/INDEX.md`.
- Negative tests: broken copies of the KB must be caught by the integrity checks.

## 2. Engine unit tests (`tests/scoring/`)
| Area | Examples |
|---|---|
| Weights | levels map correctly; unset = low; floors use max; conflicts only for explicitly set levels |
| Base score | hand-calculated cases; all-1 option → 0, all-5 → 100; only applicable criteria counted |
| Levels | type chosen first; products of other types folded; close call within 5 points shows both |
| Rules | each rule fires only on its condition; `otherwise` branches; exclude; `not-needed`; cap ±30 |
| Skills | T1–T5 values; skill bucket capped −10…+25 separately from rules; `goal: learn` halves effects |
| Compatibility | `requires`/`conflicts` filter combinations; pair bonus capped +6; "needs: X" labels |
| Assembly | locked option always in the stack; type-gap penalty in `cand`; tie-break chain; conflicting locks → explicit conflict, no crash |
| Validation | rejects unknown ids; nothing to rank on → error; > 3 Critical → warning |

### Property-based tests (fast-check: hundreds of random valid inputs)
1. Determinism: `score(x)` deep-equals `score(x)`.
2. Bounds: `|rules| ≤ 30`, `−10 ≤ skill ≤ 25`, all scores in 0–100.
3. Every chosen stack satisfies all `requires`/`conflicts`, or carries an explicit conflict.
4. Excluded options never appear in a stack or ranked list.
5. Locked options are always picked.
6. Monotonicity (sibling property 4).
7. Changing only `notes` never changes the result.
8. **Highly connected data never picks document** (owner 2026-10-24): with data shape "highly connected", for any weights, the `document` type is never the #1 database type and never the close-call runner-up. Relational may win (e.g. scalability or integrity weighted heavily). The KB draft §5 (session 3) checked all 15,625 weight combinations by hand-script; the test does the same over random inputs.

## 3. Golden scenarios (`tests/scoring/golden.ts`)
Realistic projects with the stack we'd expect. They encode judgement, so **the owner reviews and approves them** (Q24). Expectations are written as "#1" or "in top N" so small KB changes don't break them for no reason. Before writing expectations we asked: would a neutral senior developer pick this, or are we following a trend? Where two answers are equally fair, both are allowed.

Abbreviations: lang = language, FE = frontend (approach / framework), BE = backend, DB = database (type / product), host = hosting.

| # | Scenario (inputs in short) | Expected | Must not happen | Tests |
|---|---|---|---|---|
| G1 | **Student portfolio site.** Solo, beginner, content site, no stored data, free only, non-commercial, SEO High | FE `static`; framework `astro` or `plain-html` #1. BE, DB and lang **not needed**. Host type `static-hosting` or `frontend-platform`; `github-pages`, `netlify`, `cloudflare` or `vercel` | Any database or backend picked; `spa` approach #1 | S1, D8, not-needed parts |
| G2 | **E-commerce store, small team that knows Java.** 4 devs, Java strong, linked records, money, commercial, small paid budget, SEO High, lifespan 5+ | lang `java`; BE `spring-boot`; DB `relational`, `postgresql` or `mysql` (`sqlite` not #1; owner Q30, 2026-10-25: D9 follows sqlite.org, so SQLite may be #2 for a small shop); Vercel, if listed, carries K9 −10 (beta + lifespan 5+); FE `ssr` or `server-templates`; host `paas` or `cloud` | `github-pages` or `netlify` in the stack (no Java runtime / K1b); `document` DB type #1 | T1, D1, D5, K9, compatibility |
| G3 | **Real-time chat app.** 3 devs, TypeScript strong, real-time yes, moderate growth, small budget | lang `typescript-node`; BE `fastify`, `nestjs` or `express`; FE `spa`; host type `paas`, `cloud` or `frontend-platform` with `vercel` (WebSockets supported since 2026); note about a pub/sub store (Redis/Valkey) to broadcast messages, shown whenever Vercel is picked | `netlify` in the stack (K7); Vercel excluded or penalised *only* for real-time (owner Q24) | S5, K7, T1 |
| G4 | **Data dashboard for a Python team.** Internal tool, 2 devs, Python strong, ~50 users, data in SQL, small budget | lang `python`; BE `fastapi` or `django`; DB `postgresql`; FE `spa` or `server-templates`; host `paas` | Java or C# picked | T1, D1 |
| G5 | **Startup MVP that must ship in 4 weeks.** 2 devs, TypeScript some, deadline very tight, budget small paid, commercial, linked records | lang `typescript-node`; FE `ssr` with `nextjs`, `nuxt` or `sveltekit`; BE `fullstack` (`frontend-server`); DB `postgresql`; host `frontend-platform` (Vercel shown with the "needs Pro" note) | A separate BE framework #1; `vps` hosting | S6, T2, T4, bridge options, K2 |
| G6 | **Internal business app at a .NET company.** 12 devs, C# strong, must use Azure, lifespan 5+, linked records | lang `csharp`; BE `aspnet-core`; host `azure` (K4 lock); DB `relational` | Any other cloud in the stack | K4, T1 |
| G7 | **Content site for an agency client, PHP team.** 3 devs, PHP strong, content-heavy pages, small budget, commercial | lang `php`; BE `laravel`; FE `server-templates`; DB `mysql` or `postgresql`; host `paas` or `vps`; glossary note if notes mention WordPress | `spa` approach #1 | T1, S1 vs. backend need |
| G8 | **High-throughput REST API.** 6 experienced devs, Go some, API only, steady heavy load, performance Critical, cost High | FE **not needed**; lang `go` #1 in the language list (Java or C# in top 3); **stack: a close call that shows both** C# + `aspnet-core` (picked) and Go + `gin` (step 6.7; owner Q29, 2026-10-24: with primary numbers C# wins by 4.3 < 5); DB `postgresql`; host `cloud` or `vps` | `frontend-server` backend | S2, performance weighting, stack close call |
| G9 | **Beginner's hobby app (habit tracker).** Solo, beginner, Python some, free only, non-commercial, small linked data | lang `python`; BE `django` (built-in admin, auth, templates) or `fastapi`; FE `server-templates` or `spa`; DB `sqlite` or `postgresql`; host `render` or another free option | `railway`, `fly-io` or `vps` in the stack (K5) | T2, K5, D6 |
| G10 | **Social app with "friends of friends" suggestions.** 4 devs, TypeScript strong, highly connected data, moderate growth | DB type `graph` in top 2 (relational allowed #1, e.g. when scalability is weighted High); product `neo4j` or `postgresql` | `document` DB type #1, under any weights (property 8) | D3, close call |
| G11 | **Microservices from Architecture Advisor.** 20 devs, Java strong, Go some, `style=microservices`, rapid growth, comfortable budget | host type `cloud` or `paas`; BE `spring-boot`; note "one database per service"; `frontend-server` not picked | `github-pages` or `netlify` in the stack; `frontend-platform` as the #1 hosting type | A1, S7, T1, K9 |
| G13 | **Product catalogue with very different items.** 3 devs, TypeScript strong; items (books, laptops, clothes) each have their own set of fields that change often; each item is read and shown as a whole; few relationships (no orders or payments in this part); moderate growth, small budget | DB type `document` #1, product `mongodb` #1; `postgresql` (JSONB) allowed as #2 with the "PostgreSQL can store documents too" note | `relational` DB type #1 | D2, D4, fairness: a fair NoSQL win (owner Q24, `ddia` ch.2: document model for tree-shaped data loaded as a whole; schema-on-read helps when items don't share one structure) |
| G12 | **Neutral input.** Only `maturity` High, every question "Not sure", no skills | No fixed picks; a complete stack is returned; no part marked not needed; result stable under re-run; a tie at the top of a part is reported with the step 6.6 rule that settled it (Java = C# → C# by stack score; `tests/scoring/engine.test.ts`) | Crash or empty result; a tie settled silently | defaults, warnings, ties |

**Type-win coverage (Q27, owner 2026-10-24).** A check on **scenario coverage**: every ranked type should be the #1 type of its part in at least one golden scenario, so a type that can never win shows up as a possible hidden bias. A test fails if a type loses everywhere. **Only scenarios a neutral senior developer would agree with count.** Never invent a scenario just to make a type win; if a type has no honest scenario, record an exception and why.

Exception: **`key-value` (Redis, Valkey) as the main database.** None of the v1 app kinds (content site, portfolio, web app, API, e-commerce, internal tool, mobile backend) is one where a neutral senior developer would keep *all* the app's data in a key-value store: by default these stores keep data in memory and write to disk asynchronously, so recent writes can be lost on a crash (`ddia` ch.3), and they have no queries beyond lookups by key. Their honest uses (cache, sessions, rate limits, queues, leaderboards, pub/sub for chat) sit *next to* a main database, which is the "caching/queues" part planned after v1 (Q4). Rule D7 still lets key-value win when the user says the data is only simple lookups; that is checked by a unit test, not a golden scenario.

| Part | Type → scenario(s) where it should win |
|---|---|
| frontend | `static` G1 · `spa` G3, G4 (and G6, G9–G11, G13) · `ssr` G2, G5 · `server-templates` G7 (G4 and G9 allow it; spa wins there since S14, KB draft §18) · `none` G8 |
| backend | `none` G1 · `fullstack` G5 · `minimal` G8 · `batteries` G2, G4, G6, G7, G9 (G3 and G4 allow either `minimal` or `batteries`) |
| database | `none` G1 · `relational` G2, G4, G5 · `document` **G13** · `graph` G10 (close call allowed) · `key-value` exempt (above) |
| hosting | `static-hosting` G1 · `frontend-platform` G5 · `paas` G2–G4, G7, G9–G13 · `cloud` G6, G8 · `vps` **exempt for now** (wins only when the user must self-host, K3, checked by a unit test; G8 allows vps or cloud and cloud wins; owner Q34, 2026-11-08) |

G10's graph win is allowed to be a close call. Database calibration (`KNOWLEDGE_BASE_DRAFT.md` §5): every database type except the exempt `key-value` wins a scenario. After the owner's D3 fix (2026-10-24) G10 holds with default weights (graph 65.8, relational 62.5, document 40.8) **and** with scalability High (graph 60.6, relational 59.4, document 41.9). G13: document 93.1 vs relational 59.4. Backend calibration (§10 of the draft, 2026-10-24): every backend type wins a scenario; G5 needs rule B2.

Extra rule checks that don't need their own scenario (unit tests): K1 (commercial + free only → Vercel excluded), K1b (commercial e-commerce → GitHub Pages excluded), K7 (real-time → Netlify −15, Vercel note only), K9 (beta feature → −5 + note; −10 with lifespan 5+ or maturity High; off once the fact says GA), D9 (traffic large/spiky or many writers → `sqlite` −15, single user exempt; G8 gets it, G2 and G9 don't), T7 (close calls keep a known language unless goal = learn), B1 (API only → no `fullstack`), D7 ("only simple lookups" → `key-value` #1), K3 (self-host → only `vps`), K6 (open-source only → `mongodb` excluded, PostgreSQL JSONB note shown), T5 (`goal: learn` with Java strong → Java's lead shrinks).

**Status:** approved by the owner 2026-10-23 (Q24) with two changes: G3/K7 re-checked (Vercel WebSockets), G13 added. **Inputs are written in full** in `tests/scoring/golden.ts` (2026-10-24); all five parts' expectations run now (frontend and hosting since 2026-11-08). G8's input gained `cost: high` (the scenario always said so; the criterion arrived with hosting); historic calibration variants replay the old input. G8's hosting expectation is checked at type level (cloud); its stack pick is Q34. Backend and language expectations use the **assembled stack** (`result.stack.picks`, since 2026-10-24); the earlier stand-in `teamLanguagePick` is kept only so old calibration tables reproduce. `npm run calibrate` prints every part's ranking; `tests/scoring/calibration.test.ts` pins those tables, so every number in the calibration log is reproducible from a command. A calibration log in the KB draft records every run and any change made to pass a scenario, with sources. When a KB change breaks a golden test: stop and decide whether the change or the expectation is wrong, and record why.

## 4. AI layer tests (`tests/ai/`, mocked providers)
As in the sibling: schema (delta 0, 6, −7, 2.5; > 3 adjustments; unknown or excluded ids), JSON parsing (fences, prose, truncation), consistency (the explanation's stack must equal the stack **after** adjustments and re-assembly), clamping, sanitising, fallback chain with fake timers, prompt snapshot and token budget, cache, rate limit. New: an adjustment may target only options in the top 5 of their part; after adjustments the server re-runs stack assembly (the AI can't pick the stack directly).

## 5. API route tests
`/api/explain` with mocked AI: 400 on invalid body, recomputes the result itself (ignores client scores), never returns stack traces or keys, correct status per AI outcome, `AI_MODE=off` → `disabled`.

## 6. UI / end-to-end (Playwright)
**In the repo since 2026-11-09** (`tests/e2e/`, `playwright.config.ts`): `npm run build`, then `npm run test:e2e` (locally `PW_CHANNEL=msedge npm run test:e2e`; the config starts `next start` on port 3100). Runs on a desktop and a mobile (Pixel 7) profile. Not part of `npm run check` (it needs a production build and a browser); run it before merging UI changes. Covered now: each example opens its result from the home page with the expected stack (the stacks come from golden scenarios, so the engine tests fail first when the KB moves them); filling the form step by step; the last step's "what's missing" alert; a reload on the result; editing keeps answers; a new tab starts blank and Start over clears; Download Markdown (file name and content); a not-needed part says why; axe (WCAG 2.2 A/AA) on `/`, every form step, the result (with details open), `/changelog`, and the same pages in dark mode with a hovered primary button. The first run found two real issues, both fixed: the stack card's `<dl>` had wrapped rows (now a list), and the primary button's hover colour fell to 4.41:1 contrast (now its own darker `--primary-hover` token). Items 3–4 below come with the locks and the AI work.

1. Example → result → recommended stack, ranked lists and comparison table visible with `AI_MODE=off`.
2. A not-needed part shows its reason.
3. "Needs: Python" label on an incompatible option.
4. Locking a part keeps it in the stack.
5. Keyboard-only run through the form; axe accessibility check.

## Coverage targets
Engine ≥ 95% lines, AI validation/chain ≥ 90%, overall ≥ 80%.
