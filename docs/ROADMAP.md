# Roadmap

Keep this current. At the end of every session, update **Next up** so the next (cloud) session can start straight away.

## Next up
**Phase 3: UI** (owner, 2026-11-08: make it look like a real product from day one), in four steps, one branch + PR each, reusing Architecture Advisor v1.4's design system with Tech Stack Advisor's own name and logo (Q35):
1. [x] **Scaffold + landing** (session 11, 2026-11-09): Next.js 16.4.5 + Tailwind 4, teal design tokens, "layers" logo and favicon, sticky header and full footer, landing page with a live preview of a real `score()` result (example "Real-time chat app" = golden G3, computed at build time), six examples (each a golden scenario; `tests/ui/presets.test.ts` keeps them identical), `fitFor` (strong/good/possible/weak). `/advisor` is a placeholder page.
2. [x] **The form** (session 11, 2026-11-09): `/advisor` in four steps (Project, Team, Budget and rules, Priorities) with a live "Your stack so far" panel (the engine re-runs on every change), "Implied: at least High (from …)" badges read from the engine's fired floor rules, team skills, known frameworks and the goal toggle, `?new` and `?example=<id>`, answers kept per tab. Answer labels, hints and help now live in `questions.json` (KB schema §7.0). `checkInput` in the engine. Submitting shows the stack card until step 3. **Not yet:** locks (Q12; the engine has none yet).
3. [x] **The result page** (session 11, 2026-11-09): verdict card (stack summary, score ring, one tile per part incl. not-needed reasons), "Things to know" (stack close calls, picks moved by a relation or the stack score, ties, raised priorities, notes), per-part sections (best approach + type close call, ranked list by candidate score with "In your stack / Also fits / Needs X / Doesn't fit with Y", expandable why: per-criterion points that add up to the base score, rule and skill points, licence, dated facts), "Compare the top 3" table with "checked" dates and free tiers, ruled-out options with reasons, "How this was worked out". New pure module `src/modules/recommendation/` (`buildRecommendation(input, result, kb, today)`). The result survives a refresh (recomputed from the saved answers). Examples: "Data dashboard" (G4) swapped for "High-throughput REST API" (G8) to show a stack close call.
4. [ ] **/changelog and Markdown export** (sibling's `changelog/page.tsx` and `result/markdown.ts`).
Rules-only (no AI) is the whole app until Phase 4.

**Remaining Phase 1 items (not blocking the UI):** `worksBestWith` pair bonuses, bundles and glossary JSON, rubrics (Q20), fairness lint.

**Waiting for the owner (don't block on it):** Q32 (language `ecosystem`), Q33 (Next.js as the SPA pick; S15), Q34 (G8's hosting pick, a self-hosting scenario for `vps`, Railway vs Render).

Session 11 (2026-11-09, local): Phase 3 steps 1 (scaffold + landing), 2 (form) and 3 (result page). Session 10 (2026-11-08, local): **Part 5 (hosting)** merged: 5 types, 11 providers with free tiers read from the vendors' own pages, K1–K10, S17–S21, new relation kinds (conflicts, note, penalty with a dated beta fact), faster assembly (KB draft §19–23). Session 9: Part 4 (frontend).

Owner's order (2026-10-24):
1. [x] Set up the project: `package.json`, TypeScript strict, Vitest, ESLint (with the sibling's purity rule), Prettier, `npm run check`. Next.js is added with the UI (Phase 3).
2. [x] KB parts done so far (database, backend) as versioned JSON with Zod validation.
3. [x] Scratch calibration turned into committed tests: golden scenarios, property test 8 (all 15,625 combinations), type-win coverage; `npm run calibrate` reproduces every number in the calibration log.
4. [x] KB test: a score of 5 or 1 needs a non-GK source; unsourced extremes held at 3 and marked `unsourced`.
5. [x] **Part 3 (languages)** with stack assembly, hard rule T6, the tie rule (step 6.6, G12), Q28, and (session 7) primary numbers + stack close calls (step 6.7, G8, Q29). Merged.
6. [x] **Part 4 (frontend)** (session 9, 2026-11-08): KB draft §14–18. Merged.
7. [x] **Part 5 (hosting)** (session 10, 2026-11-08): KB draft §19–23. Merged.
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
- [x] Part 4: frontend (2026-11-08, session 9; open: Q33)
- [x] Part 5: hosting (2026-11-08, session 10; free tiers from vendor pages; open: Q34)
- [ ] Compatibility relations (`compatibility.json` draft) and bundles/glossary
- [ ] Scoring rubrics finalised (Q20); second sources for flagged comparative scores
- [x] Project set-up, KB as versioned JSON + Zod, validation tests (schema, sources, 5-or-1 evidence, stale facts, type-win coverage) for database and backend (2026-10-24); Next.js scaffold with the UI
- [ ] Fairness lint (vendor-only comparative scores)

## Phase 2: Rule engine
- [x] Pure scoring: weights, two levels, rules, skills, stack assembly; test-first (all five parts, 2026-11-08; pair bonuses and user locks still to do)
- [x] Golden scenarios G1–G13 passing for all five parts; property tests (2026-11-08)

## Phase 3: UI
- [x] Next.js scaffold, design tokens, header/footer, landing page with a live result preview (2026-11-09)
- [x] Form: situation, team skills, constraints, priorities (2026-11-09); locks wait for the engine
- [x] Result page (2026-11-09) (stack, per-part lists, comparison table with "checked on" dates, not-needed parts)
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
