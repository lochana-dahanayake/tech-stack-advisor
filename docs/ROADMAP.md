# Roadmap

Keep this current. At the end of every session, update **Next up** so the next (cloud) session can start straight away.

## Next up
- **Waiting on the owner:** answers to the open questions in `OPEN_QUESTIONS.md` (Q2–Q19, Q24, Q25). The most important for Phase 1 are **Q4/Q10** (parts and tools in v1), **Q6** (criteria), **Q11** (team-skill input) and **Q24** (golden scenarios).
- **Not blocked, can start now:** Q21, verify the facts that came only from secondary sources (vendor pages were blocked on 2026-10-23); try GitHub-hosted docs repos where the site is blocked. Then draft `docs/KNOWLEDGE_BASE_DRAFT.md` for the **database** part first (best-sourced: `ddia`, `mpg17`, `sixstep`, Stack Overflow 2026 database numbers), with a calibration log section.
- After Q8 is answered: `docs/TECH_STACK.md` and a fuller `ARCHITECTURE.md` (mostly adapted from the sibling).

## Phase 0: Plan (status: drafts done 2026-10-23, waiting on owner answers)
- [x] Repo, doc skeleton, references folder
- [x] Owner adds references (`references/`: 4 books + 8 links, all indexed)
- [x] Study Architecture Advisor; summary in `SIBLING_PROJECT.md`
- [x] `PROJECT_OVERVIEW.md` rewritten for the kickoff brief (two levels, concrete tools, team skills)
- [x] Open questions answered with recommendations; new questions Q10–Q25 added
- [x] Research log with checked dates (`RESEARCH.md`)
- [x] Draft KB schema (`KNOWLEDGE_BASE_SCHEMA.md`): parts, two levels, options, 16 criteria, compatibility, team-skill, constraint and style rules, fairness rules, stale facts
- [x] Draft scoring approach (`SCORING_ENGINE.md`): types first, then products, then stack assembly
- [x] Draft `TESTING_STRATEGY.md` with 12 golden scenarios
- [ ] Owner answers the open questions (Q2–Q19, Q24, Q25)
- [ ] Verify secondary-source facts (Q21)
- [ ] `TECH_STACK.md` and a fuller `ARCHITECTURE.md` for the app itself (after Q8)

## Phase 1: Knowledge base
- [ ] `KNOWLEDGE_BASE_DRAFT.md`: options, scores with sources and `checked` dates, rules; one part at a time (database → backend → language → frontend → hosting)
- [ ] Scoring rubrics finalised (Q20); calibration log started
- [ ] KB as versioned JSON + Zod; validation tests (schema, every score sourced, fairness lint, stale facts)

## Phase 2: Rule engine
- [ ] Pure scoring: weights, two levels, rules, skills, stack assembly; test-first
- [ ] Golden scenarios G1–G12 passing; property tests

## Phase 3: UI
- [ ] Form (situation, team skills, constraints, locks, priorities), result page (stack, per-part lists, comparison table with "checked on" dates, not-needed parts)
- [ ] `?style=` hand-off; link from Architecture Advisor (Q2)

## Phase 4: AI layer
- [ ] Bounded adjustments (±5, max 3, top 5 per part) + explanation; server re-runs assembly; fallback chain; rules-only mode

## Phase 5: Launch
- [ ] Deploy on a free host, README, about/methodology pages (sources, fairness rules, refresh dates)
- [ ] First KB refresh session scheduled (every 3 months, Q7)
