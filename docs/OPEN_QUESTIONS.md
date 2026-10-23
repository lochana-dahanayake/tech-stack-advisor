# Open Questions

Product decisions belong to the owner. Claude: add new questions here instead of guessing, and keep working on what isn't blocked. Move answered ones to "Decided" with the date.

## Open

| # | Question | Notes / proposed default |
|---|---|---|
| Q2 | How does it connect to Architecture Advisor? Separate app with a link / shared URL params, or a new section inside the same app? | Proposed: separate app; Architecture Advisor's result page gets a "Pick a stack for this" link passing the style id in the URL. |
| Q3 | Rank each layer separately, rank whole-stack bundles (e.g. "Next.js + Postgres + Vercel"), or both? | Proposed: per-layer ranking + compatibility rules, plus a few curated bundles shown as info (like patterns in Architecture Advisor). |
| Q4 | Which layers are in v1? | Proposed: language, frontend framework, backend framework, database, hosting. Later: mobile, messaging, auth, CI/CD. |
| Q5 | Which options are in v1 (how many per layer)? | Proposed: 6 to 10 mainstream options per layer, chosen from the references. |
| Q6 | Which criteria? Reuse Architecture Advisor's quality attributes or a stack-specific list (learning curve, ecosystem maturity, hiring pool, licence, hosting cost)? | Claude to draft a list in `KNOWLEDGE_BASE_SCHEMA.md` from the references. |
| Q7 | How often is the KB refreshed, and what happens to old entries? | Proposed: show a "checked on" date; tests flag entries older than 12 months. |
| Q8 | Same tech stack as Architecture Advisor (Next.js, TypeScript, Vercel, free-tier LLMs)? | Proposed: yes, to reuse code and patterns. |
| Q9 | Repo visibility: keep private while `references/` holds copyrighted files, or go public and keep references elsewhere? | Created private. |

## Decided

| # | Decision | Date |
|---|---|---|
| D1 | Separate repo; built mainly in Claude Code cloud sessions. | 2026-10-24 |
| D2 | Claude owns the PR flow (opens and merges), same as Architecture Advisor. | 2026-10-24 |
| D3 | Name: **Tech Stack Advisor** (repo `tech-stack-advisor`). "Framework Advisor" was too narrow: it also covers databases and hosting. | 2026-10-24 |
