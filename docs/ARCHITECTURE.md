# Architecture (of the app itself)

Status: **decided outline (2026-10-23, Q8)**: mirror Architecture Advisor, a **modular monolith on Next.js**, deployed once to Vercel Hobby (sibling ADR-001). Details below are what differs or is new; for everything else the sibling's `docs/ARCHITECTURE.md` applies.

## 1. Our own drivers
Same as the sibling: one part-time developer, zero budget, several years of life, small but possibly spiky traffic. Testability, graceful degradation (works without AI) and low cost matter most. That points to one deployable app with clean internal modules, not separate services.

As a sanity check, here is the stack this app would recommend for itself (once the engine exists, this becomes a test): TypeScript on Node.js (team skill), frontend `ssr` with Next.js, backend `fullstack` (Next.js route handlers), database `none`, hosting `frontend-platform` (Vercel). That matches `TECH_STACK.md`.

## 2. Modules (`src/modules/`)
| Module | Responsibility | May depend on |
|---|---|---|
| `knowledge-base/` | Load and validate the KB JSON (Zod schema + integrity checks); staleness report for tests/build | – |
| `scoring/` | **Pure** engine: weights → types → products → skills → stack assembly (`SCORING_ENGINE.md`) | `knowledge-base` (types and data only) |
| `recommendation/` | Turn `StackResult` into what the page shows: plain reasons, comparison table rows, "needs: X" labels, "checked on" dates (the date is passed in by the caller, so this stays pure too) | `scoring`, `knowledge-base` |
| `ai/` | Server-only: prompt, provider chain, response validation, applying ±5 adjustments, then **re-running stack assembly** on the server | `scoring`, `recommendation`, `platform` |
| `platform/` | Env access, cache, rate limits | – |

Boundaries are enforced by dependency-cruiser in `npm run check`: `scoring` and `recommendation` may not import React, Next, `platform`, `ai`, or use `Date`, `fetch`, `Math.random` (sibling ADR-004).

**Status (2026-11-09):** `knowledge-base/`, `scoring/` and `recommendation/` exist; `ai/` and `platform/` come with Phase 4. Purity is enforced by the ESLint rule in `eslint.config.js` for all three, and module boundaries by dependency-cruiser (`.dependency-cruiser.cjs`, `npm run fitness`, part of `npm run check` since 2026-11-09): the KB is a leaf, `scoring` imports only the KB, `recommendation` only scoring and the KB, no module imports `app`/`components`/`lib`, client code never imports server-only modules, no cycles.

## 3. Request flow
1. The browser runs `score(input, kb)` and shows the full rule result at once.
2. Unless the user opted out, it POSTs the input to `/api/explain`.
3. The server validates the input, recomputes the result itself (never trusts browser scores), asks the AI for at most 3 adjustments (±5, options in the top 5 of their part) and an explanation, clamps and validates them, re-runs stack assembly with the adjusted scores, and checks the explanation names the same stack.
4. If anything fails, the browser keeps the rule result and shows a clear message.

## 4. Decisions to record as ADRs (Phase 1, when code starts)
Reused from the sibling with the same reasoning: 001 modular monolith on Next.js/Vercel, 002 rules + bounded AI, 003 KB as versioned JSON, 004 one pure engine in browser and server, 005 AI fallback chain. New for this project:
- **Types before products** (sibling's Q30 lesson; `SCORING_ENGINE.md` step 4).
- **Stack assembly by enumeration** over the top 5 per part (Q3).
- **Team skills in their own capped bucket** (Q11).
- **Dated facts with stale windows** enforced by tests, never by the engine (Q7).
