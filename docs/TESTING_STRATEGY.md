# Testing Strategy

Status: **draft (2026-10-23)**, Phase 0. Adapted from Architecture Advisor's `docs/TESTING_STRATEGY.md`.

Test pyramid: many fast unit tests on the KB and the engine, focused tests on the AI layer with mocked providers, a few end-to-end tests. No test calls a real AI provider or the network. Proposed: everything runs locally with `npm run check`, no CI server (as the sibling decided in its Q23; Q25 here).

## 1. Knowledge base tests (`tests/kb/`)
- Every JSON file passes its Zod schema.
- Every option scores every criterion that applies to its part; values are integers 1–5; each score has a source and a `checked` date.
- Every product has ≥ 1 type in its own part; `none` types have no products; bridge options have a matching `requires` relation.
- Every id referenced in rules, compatibility, skills, bundles and glossary exists.
- Every rule and relation has a user-facing explanation and a source.
- **Licence and free-tier fields** are set for every product / hosting product.
- **Fairness lint:** a comparative score whose only source is the vendor itself fails (§8 of the schema: vendor sources only for their own facts). Comparative = differs from the type's median by ≥ 2.
- **Stale facts:** `kb:stale` lists facts past their window (warning); the release gate fails at 2× the window or when a `support.until` date has passed (schema §9). The test gets "today" from the test runner, never from the engine.
- **Release gate:** fails in production mode if any source has `reviewed: false`.
- **Snapshot of the score matrix,** so any KB change is a visible diff.

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

## 3. Golden scenarios (`tests/scoring/golden.ts`)
Realistic projects with the stack we'd expect. They encode judgement, so **the owner reviews and approves them** (Q24). Expectations are written as "#1" or "in top N" so small KB changes don't break them for no reason. Before writing expectations we asked: would a neutral senior developer pick this, or are we following a trend? Where two answers are equally fair, both are allowed.

Abbreviations: lang = language, FE = frontend (approach / framework), BE = backend, DB = database (type / product), host = hosting.

| # | Scenario (inputs in short) | Expected | Must not happen | Tests |
|---|---|---|---|---|
| G1 | **Student portfolio site.** Solo, beginner, content site, no stored data, free only, non-commercial, SEO High | FE `static`; framework `astro` or `plain-html` #1. BE, DB and lang **not needed**. Host type `static-hosting` or `frontend-platform`; `github-pages`, `netlify`, `cloudflare` or `vercel` | Any database or backend picked; `spa` approach #1 | S1, D8, not-needed parts |
| G2 | **E-commerce store, small team that knows Java.** 4 devs, Java strong, linked records, money, commercial, small paid budget, SEO High, lifespan 5+ | lang `java`; BE `spring-boot`; DB `relational`, `postgresql` or `mysql`; FE `ssr` or `server-templates`; host `paas` or `cloud` | `vercel` in the stack (Java conflict); `document` DB type #1 | T1, D1, D5, compatibility |
| G3 | **Real-time chat app.** 3 devs, TypeScript strong, real-time yes, moderate growth, small budget | lang `typescript-node`; BE `fastify`, `nestjs` or `express`; FE `spa`; host type `paas` or `cloud`; note about a key-value store for presence/pub-sub | `vercel` or `netlify` in the stack (K7) | S5, K7, T1 |
| G4 | **Data dashboard for a Python team.** Internal tool, 2 devs, Python strong, ~50 users, data in SQL, small budget | lang `python`; BE `fastapi` or `django`; DB `postgresql`; FE `spa` or `server-templates`; host `paas` | Java or C# picked | T1, D1 |
| G5 | **Startup MVP that must ship in 4 weeks.** 2 devs, TypeScript some, deadline very tight, budget small paid, commercial, linked records | lang `typescript-node`; FE `ssr` with `nextjs`, `nuxt` or `sveltekit`; BE `fullstack` (`frontend-server`); DB `postgresql`; host `frontend-platform` (Vercel shown with the "needs Pro" note) | A separate BE framework #1; `vps` hosting | S6, T2, T4, bridge options, K2 |
| G6 | **Internal business app at a .NET company.** 12 devs, C# strong, must use Azure, lifespan 5+, linked records | lang `csharp`; BE `aspnet-core`; host `azure` (K4 lock); DB `relational` | Any other cloud in the stack | K4, T1 |
| G7 | **Content site for an agency client, PHP team.** 3 devs, PHP strong, content-heavy pages, small budget, commercial | lang `php`; BE `laravel`; FE `server-templates`; DB `mysql` or `postgresql`; host `paas` or `vps`; glossary note if notes mention WordPress | `spa` approach #1 | T1, S1 vs. backend need |
| G8 | **High-throughput REST API.** 6 experienced devs, Go some, API only, steady heavy load, performance Critical, cost High | FE **not needed**; lang `go` #1 (Java or C# in top 3); BE `gin` or `aspnet-core`; DB `postgresql`; host `cloud` or `vps` | `frontend-server` backend | S2, performance weighting |
| G9 | **Beginner's hobby app (habit tracker).** Solo, beginner, Python some, free only, non-commercial, small linked data | lang `python`; BE `django` (built-in admin, auth, templates) or `fastapi`; FE `server-templates` or `spa`; DB `sqlite` or `postgresql`; host `render` or another free option | `railway`, `fly-io` or `vps` in the stack (K5) | T2, K5, D6 |
| G10 | **Social app with "friends of friends" suggestions.** 4 devs, TypeScript strong, highly connected data, moderate growth | DB type `graph` in top 2 (relational allowed #1 with a close call); product `neo4j` or `postgresql` | `document` DB type #1 | D3, close call |
| G11 | **Microservices from Architecture Advisor.** 20 devs, Java strong, Go some, `style=microservices`, rapid growth, comfortable budget | host type `cloud` or `paas`; BE `spring-boot`; note "one database per service"; `frontend-server` not picked | `vercel` or `github-pages` in the stack | A1, S7, T1 |
| G12 | **Neutral input.** Only `maturity` High, every question "Not sure", no skills | No fixed picks; a complete stack is returned; no part marked not needed; result stable under re-run | Crash or empty result | defaults, warnings |

Extra rule checks that don't need their own scenario (unit tests): K1 (commercial + free only → Vercel excluded), K3 (self-host → only `vps`), K6 (open-source only → `mongodb` excluded, PostgreSQL JSONB note shown), T5 (`goal: learn` with Java strong → Java's lead shrinks).

**Status:** planned. Inputs are written in full in Phase 2 (`tests/scoring/golden.ts`, with `npm run golden:print` for the top 5 per part). A calibration log in the KB draft records every run and any change made to pass a scenario, with sources. When a KB change breaks a golden test: stop and decide whether the change or the expectation is wrong, and record why.

## 4. AI layer tests (`tests/ai/`, mocked providers)
As in the sibling: schema (delta 0, 6, −7, 2.5; > 3 adjustments; unknown or excluded ids), JSON parsing (fences, prose, truncation), consistency (the explanation's stack must equal the stack **after** adjustments and re-assembly), clamping, sanitising, fallback chain with fake timers, prompt snapshot and token budget, cache, rate limit. New: an adjustment may target only options in the top 5 of their part; after adjustments the server re-runs stack assembly (the AI can't pick the stack directly).

## 5. API route tests
`/api/explain` with mocked AI: 400 on invalid body, recomputes the result itself (ignores client scores), never returns stack traces or keys, correct status per AI outcome, `AI_MODE=off` → `disabled`.

## 6. UI / end-to-end (Playwright, optional as in the sibling)
1. Example → result → recommended stack, ranked lists and comparison table visible with `AI_MODE=off`.
2. A not-needed part shows its reason.
3. "Needs: Python" label on an incompatible option.
4. Locking a part keeps it in the stack.
5. Keyboard-only run through the form; axe accessibility check.

## Coverage targets
Engine ≥ 95% lines, AI validation/chain ≥ 90%, overall ≥ 80%.
