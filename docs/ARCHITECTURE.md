# Architecture (of the app itself, sketch)

Status: **sketch**. Default is to mirror Architecture Advisor (modular monolith on Next.js; see its `docs/ARCHITECTURE.md` and ADR 001) unless the owner decides otherwise (Q8).

Proposed modules under `src/modules/`:
- `knowledge-base/`: loads and validates the KB JSON.
- `scoring/`: pure rule engine (no network, clock, randomness or React).
- `recommendation/`: turns scores into the result shown to the user.
- `ai/`: optional bounded adjustments and explanation, server-only.
- `platform/`: cache, rate limits, env access.

Record real decisions as ADRs in `docs/adr/` (`NNN-short-title.md`: context, decision, consequences).
