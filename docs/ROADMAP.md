# Roadmap

Keep this current. At the end of every session, update **Next up** so the next (cloud) session can start straight away.

## Next up
**Part 4: frontend** (KB draft Part 4, same template as Parts 1–3): approaches (plain HTML, static/SSG, SPA, SSR) as types and the Q5 frameworks (plain HTML, Astro, React, Vue, Svelte, Angular, Next.js, Nuxt, SvelteKit) as products, sourced with the network now open (`npm run sources` shows how primary numbers are read: add State of JS and the SO 2026 frontend shares there). The frontend part also fills `frontend-server`'s `requires` relation. Run `npm run calibrate` and the goldens as usual.

**Waiting for the owner (don't block on them):** Q30 (narrow D9 per sqlite.org; changes G2/G5/G8, so not done; `--variant d9-traffic` shows the effect) and Q31 (stack close calls for beginners, G9).

Session 7 (2026-10-24) finished Part 3: primary numbers for every S number that had a primary source (TechEmpower Round 23, SO 2026 official data, arXiv table, registries), Q29 applied (G8 = stack close call, new engine step 6.7), SQLite page read. Part 3 merged to `main`.

Owner's order (2026-10-24):
1. [x] Set up the project: `package.json`, TypeScript strict, Vitest, ESLint (with the sibling's purity rule), Prettier, `npm run check`. Next.js is added with the UI (Phase 3).
2. [x] KB parts done so far (database, backend) as versioned JSON with Zod validation.
3. [x] Scratch calibration turned into committed tests: golden scenarios, property test 8 (all 15,625 combinations), type-win coverage; `npm run calibrate` reproduces every number in the calibration log.
4. [x] KB test: a score of 5 or 1 needs a non-GK source; unsourced extremes held at 3 and marked `unsourced`.
5. [x] **Part 3 (languages)** with stack assembly, hard rule T6, the tie rule (step 6.6, G12), Q28, and (session 7) primary numbers + stack close calls (step 6.7, G8, Q29). Merged.
- [x] Q28 decided and coded (public domain allowed under "open source only", badge "public domain"). [x] G12 tie rule documented and tested.
- [x] **Claude:** SQLite "Appropriate Uses" read (session 7); D9 narrowing is Q30.
- Q21 facts still open: hosting vendors' free tiers and terms (now reachable: do them with Part 5), State of JS 2025, Thoughtworks Radar vol. 34, a Go module count (for the `ecosystem` registry rubric), Gin `scalability`/`community` (no survey lists Gin).
- Later option (owner): replace D3's −30 with a hard rule "document can't be #1 for highly connected data".

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
- [x] Part 2: **backend** (types, 10 products, rules B0–B3, first calibration: all backend expectations hold within the team's language) (2026-10-24)
- [x] Owner review of part 1 (2026-10-24): D3 document −30 (G10), D9 SQLite rule (unverified), Q26 and Q27 decided
- [x] Part 3: language (incl. team-skill rules T1–T6, stack assembly, close calls); Q29 done 2026-10-24 (session 7)
- [ ] Part 4: frontend
- [ ] Part 5: hosting (needs the Q21 free-tier facts verified)
- [ ] Compatibility relations (`compatibility.json` draft) and bundles/glossary
- [ ] Scoring rubrics finalised (Q20); second sources for flagged comparative scores
- [x] Project set-up, KB as versioned JSON + Zod, validation tests (schema, sources, 5-or-1 evidence, stale facts, type-win coverage) for database and backend (2026-10-24); Next.js scaffold with the UI
- [ ] Fairness lint (vendor-only comparative scores)

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
