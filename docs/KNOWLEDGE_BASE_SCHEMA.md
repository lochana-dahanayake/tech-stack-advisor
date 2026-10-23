# Knowledge Base Schema (sketch)

Status: **sketch**. Design it in Phase 0, starting from Architecture Advisor's `docs/KNOWLEDGE_BASE_SCHEMA.md` (see `SIBLING_PROJECT.md`) and the material in `references/`.

## Proposed shape (to be confirmed)

- **Layers:** `language`, `frontend`, `backend`, `database`, `hosting` (v1 candidates, Q4).
- **Options:** one entry per tool, e.g. `{ id, layer, name, summary, version, checked, links }`.
- **Criteria:** what options are scored on (Q6). Candidates: performance, scalability, developer productivity, learning curve, ecosystem maturity, hiring pool, long-term support, licence, running cost, type safety, real-time support.
- **Scores:** option × criterion, 1 to 5, each with a `source` tag and a one-line reason.
- **Compatibility rules:** `requires` / `conflicts` between options across layers (e.g. Django requires Python).
- **Constraint rules:** user constraints that boost, penalise or exclude options (e.g. "must self-host" excludes managed-only services).
- **Style links:** how each Architecture Advisor style id changes weights (e.g. microservices raises scalability and independent deployment).
- **Bundles (maybe):** curated whole-stack combinations shown as info (Q3).

## Source tags
Same as Architecture Advisor: `book:<short-id> <chapter/page>`, `ref:<id from references/INDEX.md>`, `GK` (general knowledge, owner must review), `DESIGN` (a product decision, not a fact). Version-dependent facts also carry `checked: YYYY-MM-DD`.
