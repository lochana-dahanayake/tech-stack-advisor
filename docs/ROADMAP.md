# Roadmap

Keep this current. At the end of every session, update **Next up** so the next (cloud) session can start straight away.

## Next up
- **Owner:** answer Q26 (how to treat beta features such as Vercel's container runtime). Not blocking: the draft uses "allowed, −5, note".
- **Claude, next session:** draft the **backend** part in `KNOWLEDGE_BASE_DRAFT.md` (types and products, scores with sources, rules), then run the same scratch calibration for the backend parts of the golden scenarios and log it in §5. Use the database part as the template: types scored on fit criteria only, product-only criteria for popularity/cost/lock-in.
- Keep retrying the still-unverified facts in Q21 at the start of each session (vendor sites may become reachable).

## Phase 0: Plan (status: done 2026-10-23)
- [x] Repo, doc skeleton, references folder; owner added 4 books + 8 links, all indexed
- [x] Study Architecture Advisor; summary in `SIBLING_PROJECT.md`
- [x] `PROJECT_OVERVIEW.md` for the kickoff brief
- [x] Open questions answered by the owner (2026-10-23): Q2–Q19, Q24, Q25 decided
- [x] Research log with checked dates (`RESEARCH.md`); session 2 verified WebSockets, runtimes, free-tier terms from vendor repos
- [x] KB schema, scoring engine, testing strategy (13 golden scenarios, owner-approved with G3 fix and G13 added)
- [x] `TECH_STACK.md` and `ARCHITECTURE.md` for the app itself (Q8)

## Phase 1: Knowledge base (status: started 2026-10-23)
- [x] `KNOWLEDGE_BASE_DRAFT.md` part 1: **database** (types, 7 products, rules D0–D9, first calibration: all database expectations hold)
- [ ] Part 2: backend
- [ ] Part 3: language (incl. team-skill rules T1–T5)
- [ ] Part 4: frontend
- [ ] Part 5: hosting (needs the Q21 free-tier facts verified)
- [ ] Compatibility relations (`compatibility.json` draft) and bundles/glossary
- [ ] Scoring rubrics finalised (Q20); second sources for flagged comparative scores
- [ ] Scaffold the Next.js app (`TECH_STACK.md`), KB as versioned JSON + Zod; validation tests (schema, sources, fairness lint, stale facts, type-win coverage)

## Phase 2: Rule engine
- [ ] Pure scoring: weights, two levels, rules, skills, stack assembly; test-first
- [ ] Golden scenarios G1–G13 passing; property tests

## Phase 3: UI
- [ ] Form (situation, team skills, constraints, locks, priorities), result page (stack, per-part lists, comparison table with "checked on" dates, not-needed parts)
- [ ] `?style=` hand-off; link from Architecture Advisor (Q2)

## Phase 4: AI layer
- [ ] Bounded adjustments (±5, max 3, top 5 per part) + explanation; server re-runs assembly; fallback chain; rules-only mode

## Phase 5: Launch
- [ ] Deploy on Vercel Hobby, README, about/methodology pages (sources, fairness rules, refresh dates)
- [ ] First KB refresh session scheduled (every 3 months, Q7)

## v1.1 (decided order)
1. **Backend-as-a-service: Supabase and Firebase** ranked as a backend type (Q13; popular with students)
2. Database hosting ranked under hosting (Q18); reconsider SQL Server (Q17)
3. ORM → authentication → caching/queues → mobile (Q4)
