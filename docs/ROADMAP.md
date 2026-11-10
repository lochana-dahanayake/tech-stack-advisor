# Roadmap

Keep this current. At the end of every session, update **Next up** so the next (cloud) session can start straight away.

## Next up
**Session 14 (2026-11-09, local): owner questions settled, Phase 1 finished, app v0.6.0 live** at https://tech-stack-advisor-one.vercel.app (public repo; the old history is the private `tech-stack-advisor-archive`). The owner asked to apply the recommendations to the open questions: Q32 (PR #3), Q36 (#4), Q34 (#5), Q33 (#6) decided and in the KB; fairness lint + written rubrics (#7); release 0.5 (#8); bundles (#9); worksBestWith pairings (#10); glossary, option aliases and AI mentions, v0.6.0 (#11). The main e2e suite passes 44/44 against the live site. Details: KB draft §24, OPEN_QUESTIONS "Decided". Next, in this order (one branch + PR each):
1. ~~Bundles~~ **done** (PR #9): `bundles.json`, "This is the well-known T3 stack" under Things to know (schema §10).
2. ~~`worksBestWith` pair bonuses~~ **done** (PR #10): Next.js + Vercel +2, Django + PostgreSQL +1 (G4 now Django); KB draft §24.
3. ~~Glossary~~ **done** (PR #11): `glossary.json` (18 entries), option aliases, "You mentioned" on the result, AI `mentions` (prompt v2).
4. ~~Live AI~~ **done** (session 15, PR #13): keys in Vercel, `AI_MODE=live`; one call per provider passed; prompt v3; v0.7.0 (AI_INTEGRATION §12, Q39 decided).
5. Remaining rubrics (Q20): ~~language `ecosystem`~~ **done** (session 15, PR #14: registry size from libraries.io, which counts Go too; KB draft §25); ~~hosting `ops-effort`/`portability`/`learning-curve`, language `productivity`~~ **done** (session 16, 2026-11-10: three hosting rubrics, values unchanged; language productivity held at 3 for all, no stack pick changes; KB draft §26). Left as GK and listed in Q20: language `learning-curve` (partly), hosting `maturity`, backend `learning-curve`/`scalability`/`ecosystem`, some database criteria; not blocking.
6. First KB refresh session in about 3 months (Q7).

Done in session 12 (details under Phase 3, steps 5–8): e2e + axe tests and dependency-cruiser (PR #15), share links and "Share & save" (PR #16), locks + `?style=` (PR #17), methodology + about pages and v0.3.0 (PR #18).

Done in session 11 (details below under Phase 3): 1. scaffold + landing (PR #11), 2. the form (PR #12), 3. the result page + pure `recommendation/` module (PR #13), 4. `/changelog` + Markdown export (PR #14).

**Remaining Phase 1 items (not blocking the UI):** the rest of the rubrics (Q20). Bundles, pair bonuses and the glossary done 2026-11-09. Fairness lint done 2026-11-09.

**Waiting for the owner:** nothing. All owner questions are decided (Q39 on 2026-11-09).

Session 13 (2026-11-09, local): Phase 4 (PRs #19–#21): AI module + platform with mocked providers, engine `aiDeltas`, `/api/explain`, notes box + opt-out + AI panel + `/privacy`, app v0.4.0. Session 12 (2026-11-09, local): Phase 3 steps 5–8 (e2e + axe + dependency-cruiser, share links, locks + `?style=`, methodology/about), app v0.3.0. Session 11 (2026-11-09, local): Phase 3 steps 1–4 (scaffold + landing, form, result page, changelog + Markdown export), app v0.2.0. Session 10 (2026-11-08, local): **Part 5 (hosting)** merged: 5 types, 11 providers with free tiers read from the vendors' own pages, K1–K10, S17–S21, new relation kinds (conflicts, note, penalty with a dated beta fact), faster assembly (KB draft §19–23). Session 9: Part 4 (frontend).

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
Session 11 steps (2026-11-09):
1. [x] **Scaffold + landing** (session 11, 2026-11-09): Next.js 16.4.5 + Tailwind 4, teal design tokens, "layers" logo and favicon, sticky header and full footer, landing page with a live preview of a real `score()` result (example "Real-time chat app" = golden G3, computed at build time), six examples (each a golden scenario; `tests/ui/presets.test.ts` keeps them identical), `fitFor` (strong/good/possible/weak). `/advisor` is a placeholder page.
2. [x] **The form** (session 11, 2026-11-09): `/advisor` in four steps (Project, Team, Budget and rules, Priorities) with a live "Your stack so far" panel (the engine re-runs on every change), "Implied: at least High (from …)" badges read from the engine's fired floor rules, team skills, known frameworks and the goal toggle, `?new` and `?example=<id>`, answers kept per tab. Answer labels, hints and help now live in `questions.json` (KB schema §7.0). `checkInput` in the engine. Submitting shows the stack card until step 3. **Not yet:** locks (Q12; the engine has none yet).
3. [x] **The result page** (session 11, 2026-11-09): verdict card (stack summary, score ring, one tile per part incl. not-needed reasons), "Things to know" (stack close calls, picks moved by a relation or the stack score, ties, raised priorities, notes), per-part sections (best approach + type close call, ranked list by candidate score with "In your stack / Also fits / Needs X / Doesn't fit with Y", expandable why: per-criterion points that add up to the base score, rule and skill points, licence, dated facts), "Compare the top 3" table with "checked" dates and free tiers, ruled-out options with reasons, "How this was worked out". New pure module `src/modules/recommendation/` (`buildRecommendation(input, result, kb, today)`). The result survives a refresh (recomputed from the saved answers). Examples: "Data dashboard" (G4) swapped for "High-throughput REST API" (G8) to show a stack close call.
4. [x] **/changelog and Markdown export** (session 11, 2026-11-09): `/changelog` with v0.2 and v0.1 notes, linked from the footer and the version line; "Download Markdown" and "Print" on the result (`components/result/markdown.ts`, pure, tested; shares "Things to know" with the page via `things.ts`). App version 0.2.0. Options now carry their own best approach (`OptionView.type`), shown in the tiles and the export.
5. [x] **E2E + accessibility tests and module boundaries** (session 12, 2026-11-09): Playwright suite in `tests/e2e/` (32 runs: 16 tests × desktop and mobile; `npm run build && PW_CHANNEL=msedge npm run test:e2e`), axe on every page incl. dark mode; dependency-cruiser (`npm run fitness`, in `npm run check`). Fixed what axe found: stack card list markup, primary button hover contrast (`--primary-hover`).
6. [x] **Share link + "Share & save" menu** (session 12, 2026-11-09): `components/form/share-link.ts` puts the answers in `#a=<base64url JSON>` (version 1; short keys a/w/s/f/g, defaults left out, ids not positions). Decoding cleans with `sanitiseForm` and checks with the engine's `checkInput`: all valid → the result; something dropped or nothing to rank on → the form with a notice; unreadable → a blank form with "We couldn't open that link". The hash is removed once read and a pasted link is picked up on `hashchange`. The result header's "Share & save" toggle holds Copy link (with a copy-by-hand fallback), Download Markdown (now with an "Open this result" link) and Print. 11 unit tests + 2 e2e tests.
7. [x] **`?style=` hand-off and locks** (session 12, 2026-11-09): engine first and test-first (`tests/scoring/locks.test.ts`, SCORING_ENGINE step 1 notes): `input.locked`, `result.locks`, conflict messages, lock beats T6; style ids in `meta.architectureStyles` (KB schema §7.5). UI: "Must use" select per part and an "Architecture style" select on step 3, `?style=` notice, "Things to know" items (must-use pick, overridden rule, clash, style and what it changed), "Must use (your choice)" label, share link keys `l`/`st`, Markdown lines. Golden and calibration results unchanged.
8. [x] **Methodology + About pages, v0.3.0** (session 12, 2026-11-09): `/methodology` ("How it works") is generated from the KB: steps, formula and caps, fairness rules (KB schema §8 in plain words), every source grouped by kind with citation counts, refresh windows and the checked-date range, every rule grouped by part plus team skills. Citations come from the new `data/references.json` (short forms of `references/INDEX.md` rows, public URLs only); an integrity test requires every `book:`/`ref:` id to have an entry of the right kind and every entry to be cited. `/about` (what it is, your answers, limits, open source). Header/footer "How it works" now go to `/methodology`; footer adds About. Changelog v0.3.
- [x] Next.js scaffold, design tokens, header/footer, landing page with a live result preview (2026-11-09)
- [x] Form: situation, team skills, constraints, priorities (2026-11-09); locks wait for the engine
- [x] Result page (2026-11-09) (stack, per-part lists, comparison table with "checked on" dates, not-needed parts)
- [x] `?style=` hand-off (2026-11-09); [ ] the link from Architecture Advisor's result page (sibling repo, Q2)

## Phase 4: AI layer
- [x] Step 1 (session 13, 2026-11-09): `src/modules/ai/` and `platform/` with mocked providers (AI_MODE=off|mock|live): prompt, schema, validation, clamping, fallback chain, T1 cache, budget, rate limit; bounded adjustments (±5, max 3, products in the top 5 of a part in the stack, never a locked part); the engine takes `aiDeltas` so the server re-runs assembly; dependency-cruiser `ai-boundary`/`platform-is-a-leaf` + `check-env-names.mjs` in `npm run fitness`. Providers re-checked (RESEARCH §9); design choices in Q38.
- [x] Step 2 (session 13): `POST /api/explain` + `parseInput` + route tests (TESTING_STRATEGY §5)
- [x] Step 3 (session 13, v0.4.0): notes box + notice + opt-out, "In plain words (AI)" panel, e2e with mock servers, `/privacy`
- [ ] One live call per provider (needs keys)

## Phase 5: Launch
- [x] README (screenshots, how it works, run, deploy), Open Graph image + metadata, `scripts/screenshots.mjs`, `docs/DEPLOY.md` (session 13, 2026-11-09)
- [x] Deploy on Vercel Hobby (https://tech-stack-advisor-one.vercel.app, 2026-11-09) + smoke test (DEPLOY §3); [x] about/methodology pages (sources, fairness rules, refresh dates; 2026-11-09)
- [ ] First KB refresh session scheduled (every 3 months, Q7)

## v1.1 (decided order)
1. **Backend-as-a-service: Supabase and Firebase** ranked as a backend type (Q13; popular with students)
2. Database hosting ranked under hosting (Q18); reconsider SQL Server (Q17)
3. ORM → authentication → caching/queues → mobile (Q4)
