# Knowledge Base Draft

Status: **draft, all 5 parts: database (2026-10-23, revised 2026-10-24), backend and language (2026-10-24), frontend and hosting (2026-11-08)**. All parts are merged and stored as JSON (`src/modules/knowledge-base/data/`, validated by Zod and `npm test`); where this draft and the JSON differ, the JSON holds unsourced extremes at 3 (§3b) and this draft shows the proposed values. Next: compatibility bonuses, bundles/glossary, rubrics (`ROADMAP.md`). Shape and rules of the game: `KNOWLEDGE_BASE_SCHEMA.md`.

## Source tags
`book:<id> <locator>` (ids from `references/INDEX.md`), `ref:<id>` (published source), `GK` (general knowledge: must be reviewed and, where it's comparative, backed by a second source before release), `DESIGN` (a product decision). **(P)** / **(S)** = primary / secondary evidence (`RESEARCH.md`). Every score below was checked **2026-10-23** unless noted.

`ref:so-survey` = Stack Overflow Developer Survey 2026, databases question (n = 12,061 respondents; usage shares read from the official results page via search, S: the survey site is blocked from cloud sessions). `ref:mdb-docs` = MongoDB manual in the `mongodb/docs` repo (P).

# Part 1: Database

## 1. Database criteria
The 12 criteria from schema §4 that apply to the database part. **Types are scored only on the six "fit" criteria** (marked ✱). Product-only criteria (popularity, cost, lock-in) describe a product, not a category (calibration finding 1, §5).

| Criterion | Fit ✱ | What a 5 means here |
|---|---|---|
| `learning-curve` | ✱ | Usable in an afternoon with little new to learn |
| `performance` | ✱ | Fast reads and writes for the typical access pattern of its type |
| `scalability` | ✱ | Grows past one machine with built-in tools (replication, sharding) |
| `real-time` | ✱ | Built-in way to push changes to listeners |
| `data-integrity` | ✱ | Multi-record transactions, constraints, strong durability |
| `schema-flexibility` | ✱ | Items with different fields need no migrations |
| `ecosystem` | | Drivers, ORMs, hosting options, tools |
| `community` | | Rubric (schema §8): `so-survey` usage ≥ 40% → 5, 20–40% → 4, 10–20% → 3, 4–10% → 2, < 4% → 1 |
| `maturity` | | Years in production use and a published support policy |
| `cost` | | Licence and typical hosting cost at small scale |
| `ops-effort` | | Little to install, tune, back up |
| `portability` | | OSI licence, standard query language, many hosts |

## 2. Types (level 1)
`none` has no scores: it's chosen only by a `not-needed` rule (D8).

| Type | learn | perf | scal | real-time | integrity | flexibility | Main sources |
|---|---|---|---|---|---|---|---|
| relational | 3 | 4 | 3 | 3 | **5** | 3 | `book:ddia ch.2` (joins, many-to-many; schema-on-write; JSON support converging), `ch.7` (transactions), `book:sixstep ch.1` |
| document | 4 | 4 | 4 | 3 | 3 | **5** | `book:ddia ch.2` (locality, closer to app objects, schema-on-read), `ch.6` (built-in sharding, e.g. MongoDB), `ch.7` (single-object atomic updates) |
| key-value | 4 | **5** | 4 | **5** | 2 | 3 | `book:ddia ch.3` (in-memory stores: fast, weaker durability with async disk writes), `ch.7` (atomic operations on data structures); real-time = pub/sub (GK) |
| graph | 2 | 3 | 2 | 2 | 4 | 4 | `book:ddia ch.2` (property graphs and Cypher: most natural for highly connected data; flexible to evolve; a new query language to learn); scalability and real-time GK |

Why these values, briefly:
- **relational flexibility 3, not 2:** PostgreSQL and MySQL store and index JSON, so varying fields are possible without a document database (`ddia` ch.2 "convergence"; `mpg17` JSON chapter). Still more structured than a document store.
- **document integrity 3:** a single document is updated atomically, and MongoDB has multi-document transactions (since 4.0; `ref:mdb-docs`), but constraints like foreign keys aren't part of the model (`ddia` ch.2, ch.7). Category score; MongoDB itself gets 4 (§3).
- **key-value integrity 2:** stores that keep data in memory and write to disk asynchronously can lose recent writes on a crash (`ddia` ch.3).
- **graph learn 2:** needs a new query language such as Cypher (`ddia` ch.2).

## 3. Products (level 2)
Order: learn · perf · scal · real-time · integrity · flexibility · ecosystem · community · maturity · cost · ops · portability.

| Product | Type | Scores | Key facts (checked 2026-10-23) |
|---|---|---|---|
| **PostgreSQL** | relational | 3 · 4 · 3 · 3 · 5 · 4 · 5 · **5** · 5 · 5 · 3 · 5 | v18.6; 18 supported to 2030-11 (`ref:eol`, P). PostgreSQL licence (OSI). `so-survey` 57.9%, also most admired (62.3%). |
| **MySQL** | relational | 3 · 4 · 3 · 2 · 4 · 3 · 5 · 4 · 5 · 5 · 3 · 5 | 9.7 LTS; new year-based releases (26.10.0 tag, P). Community edition GPLv2 (GK, verify). `so-survey` 35.1%. |
| **SQLite** | relational | **5** · 4 · 1 · 1 · 4 · 3 · 4 · 5 · 5 · 5 · **5** · 5 | 3.54.1; public domain (GK). A library, not a server: the database is one file. `so-survey` 42.1%. |
| **MongoDB** | document | 4 · 4 · 5 · 4 · 4 · **5** · 4 · 3 · 4 · 3 · 3 · 2 | 9.0.4; SSPL, **not OSI open source** (P). Multi-document transactions since 4.0 (replica sets) / 4.2 (sharded clusters); `$lookup` joins (`ref:mdb-docs`, P). `so-survey` 19.0%. |
| **Redis** | key-value | 4 · 5 · 4 · 5 · 2 · 3 · 4 · 4 · 4 · 3 · 3 · 3 | 8.10; since Redis 8 your choice of RSALv2, SSPLv1 or **AGPLv3** (P). `so-survey` 28.3%. |
| **Valkey** | key-value | 4 · 5 · 4 · 5 · 2 · 3 · 3 · **1** ⚠ · 3 · 3 · 3 · 4 | 9.1.2; BSD-3 (P). Linux Foundation fork of Redis 7.2, compatible with Redis clients (GK). Not listed in `so-survey` results found so far ⚠. |
| **Neo4j** | graph | 2 · 3 · 2 · 2 · 4 · 4 · 3 · 1 · 4 · 3 · 3 · 2 | Community edition GPLv3 (P). Cypher query language (`ddia` ch.2). `so-survey` 2.8%. |

Score reasons that need a second source before release (comparative GK, `flagged`):
- SQLite `scal` 1 / `real-time` 1 (one writer at a time, one machine: GK; verify with sqlite.org "Appropriate uses", blocked, Q21).
- MySQL `real-time` 2 vs PostgreSQL 3 (PostgreSQL has LISTEN/NOTIFY and logical replication, `mpg17`; MySQL change capture via binlog tools, GK).
- MySQL `integrity` 4: `ddia` ch.7 ("Automatically detecting lost updates") notes MySQL/InnoDB's repeatable read doesn't detect lost updates, while PostgreSQL's does. Second source needed.
- MongoDB `scal` 5 (built-in sharding, `ddia` ch.6; second source needed), `real-time` 4 (change streams, GK, verify in `ref:mdb-docs`).
- Redis/Valkey `real-time` 5 (pub/sub, GK).
- Valkey `community` 1 is a placeholder until a survey lists it ⚠.

### 3b. Scores held at 3 until sourced (owner rule, 2026-10-24)
A score of 5 or 1 is a strong comparative claim, so it needs a `book:` or `ref:` source. These GK-only extremes are stored as `value: 3, unsourced: true, proposed: <draft value>` in `options.json`; the tables above show the **proposed** values. Database: key-value type, Redis, Valkey `real-time` (5); PostgreSQL, MySQL `ecosystem` (5); SQLite `learning-curve` (5), `scalability` (1), `real-time` (1), `ops-effort` (5); Valkey `community` (1, placeholder). The full list (all parts) is a snapshot in `tests/kb/__snapshots__/knowledge-base.test.ts.snap`, so sourcing one is a visible diff. The release gate (`npm run kb:release-gate`) fails while any remain.

Not used: DDIA 1st ed.'s note that MongoDB has no joins, and its remark that MySQL copies a whole table on `ALTER TABLE`. Both described 2017 versions and are out of date (`$lookup` exists today, `ref:mdb-docs`). Re-check against the 2nd edition (2026).

## 4. Database rules
Rule table in schema §7.2; final draft values:
| id | When | Effect | Source |
|---|---|---|---|
| D0 | `data-shape` = Not sure | relational +10; note: "Data tends to become more connected as an app gains features, and relational databases handle that best. If your items really are self-contained, pick 'documents'." | `book:ddia ch.2` (data becoming more interconnected as features are added) |
| D1 | linked records | relational +15, document −10 | `book:ddia ch.2`, `book:sixstep ch.1` |
| D2 | self-contained documents | document +15; note "PostgreSQL's JSONB can store documents too" | `book:ddia ch.2`, `book:mpg17` |
| D3 | highly connected | graph +20, **document −30** (owner 2026-10-24; was −10) | `book:ddia ch.2` ("Which data model leads to simpler application code?": with many-to-many relationships the document model needs denormalising or joins in app code, giving more complex code and worse performance; "Graph-like data models": graphs become more natural as connections grow) |
| D4 | fields vary a lot | `schema-flexibility` floor High | `book:ddia ch.2` (schema-on-read helps when items differ) |
| D5 | money / strict consistency | `data-integrity` floor Critical; document −5 | `book:ddia ch.7` |
| D6 | single user / offline / small | sqlite +15 | GK (verify, Q21) |
| D7 | only simple lookups / cache | key-value +15 · **otherwise** key-value −20, `otherwiseExplanation`: "Key-value stores like Redis are usually added *next to* a main database (for caching or sessions), not used as the only one." | `book:ddia ch.3` + DESIGN |
| D8 | no stored data | database `not-needed` | DESIGN |
| D9 | not "single user / offline" **and** (traffic large or spiky **or** "many people save data at the same moment") | sqlite −15; note: "SQLite lets one writer change the database at a time and runs inside one server. sqlite.org suggests a client/server database for busy sites that need several servers and for many writers at the same moment." | `ref:sqlite-whentouse` (P, checked 2026-10-25). Owner 2026-10-25 (Q30): follows the page, commercial or not; no extra money penalty (it would have no source). The "several servers" case also comes from hosting: relation `C-sqlite-hosting` (Part 5, RESEARCH §4c) |

## 5. Calibration log
**How to reproduce (since 2026-10-24):** every table in this log comes from `npm run calibrate -- --variant <name>` (`scripts/calibrate.ts`; inputs in `tests/scoring/golden.ts`, variants in `tests/scoring/variants.ts`) and is pinned by the snapshot test `tests/scoring/calibration.test.ts`, so a KB change that moves a number fails a test. Variants: `current` (the KB as committed), `draft` (unsourced scores at their proposed values: the KB of PR #5), `session2` (draft + D3 document −10 + no D9), `session2-no-d0` (session2 without D0). Numbers from before the code existed that can't be reproduced were removed, and the entry says so.

### Session 2 (2026-10-23): first database simulation
First run with a scratch script; the tables below are now reproduced by `npm run calibrate -- --variant session2` (v3) and `--variant session2-no-d0` (v2). Database part only.

1. **v0: types scored on all 12 criteria → graph could never win** (its numbers were removed on 2026-10-24: they came from an uncommitted script with a different type model and can't be reproduced). Cause: popularity, ecosystem, cost and portability belong to *products*; at type level they punish any niche category, the same hidden bias the owner warned about (G13 request). **Fix:** types are scored on the six fit criteria only (§1). Schema §4/§5 and `SCORING_ENGINE.md` step 4 updated.
2. **v1: key-value came #2 almost everywhere,** although it's mainly a secondary store. **Fix:** D7 `otherwise` −20 (§4).
3. **v2: with no data-shape answer, document won** (neutral G12: document 70.8 vs relational 62.5; `--variant session2-no-d0`). For "Not sure" the sourced default is DDIA's observation that data gets more connected as features are added. **Fix:** D0 (+10 relational, with the reason shown).
4. **MongoDB data integrity 3 → 4:** its manual documents multi-document transactions since 4.0/4.2 (P). The document *type* stays 3.

**Result (v3)** (`npm run calibrate -- --variant session2`):
| Scenario (database part) | Types | Products in the chosen type |
|---|---|---|
| G2 e-commerce (D1, D5) | relational 92.5; graph 57.5; document 47.5; key-value 32.5 | postgresql 86.1, sqlite 76.4, mysql 75.0 |
| G4 dashboard (D1) | relational 77.5; document 60.8; key-value 50.8; graph 45.8 | postgresql 79.2, sqlite 72.9, mysql 70.8 |
| G5 MVP (D1) | relational 77.5; document 60.8; key-value 50.8; graph 45.8 | postgresql 79.2, sqlite 72.9, mysql 70.8 |
| G9 hobby, learning-curve High (D1, D6) | relational 74.4; document 61.9; key-value 51.9; graph 40.6 | sqlite 91.8, postgresql 75.0, mysql 67.9 |
| G10 social (D3) | **graph 65.8**; relational 62.5 (close call); document 60.8; key-value 50.8 | neo4j 43.8 |
| G10 + scalability High (probe P1) | document 61.9; graph 60.6 (close call); relational 59.4 | mongodb 73.2 |
| G13 catalogue (D2, D4) | **document 93.1**; relational 59.4; graph 53.1; key-value 45.6 | mongodb 73.2 |
| G13 without the D4 floor (probe P2) | document 85.8; relational 62.5 | mongodb 68.8 |
| G3 chat (data shape Not sure: D0; real-time High) | relational 69.4; document 65.6 (close call); key-value 58.1 | postgresql 75.0, mysql 64.3, sqlite 62.5 |
| G12 neutral (D0) | relational 72.5; document 70.8 (close call) | postgresql 82.1, sqlite 76.8, mysql 75.0 |
| Cache-only service, performance High (probe P3; D7 fires) | **key-value 93.1**; document 71.9 | redis 71.4, valkey 64.3 |

**All database expectations in `TESTING_STRATEGY.md` §3 hold.** Every type wins at least one case (type-win coverage, Q27). Open findings (both fixed in session 3, below):
- **G10 sensitivity:** with scalability High, document edges out graph (61.9 vs 60.6, a close call, so both are shown).
- **SQLite #2 for e-commerce (G2):** acceptable as a runner-up for a small shop, but D9 should probably exist. Waits for sqlite.org.
- **Neo4j's product score is weak (43.8)** because of its small community (`so-survey` 2.8%). That's honest: it's picked because the *type* fits, and the result shows "weak fit as a product, strong fit as a type". Worth a UI note in Phase 3.

### Session 3 (2026-10-24): owner review of the database part
First run with a scratch script; the tables are now reproduced by `npm run calibrate -- --variant draft`. Owner decisions applied:

1. **G10 was a real error, not a close call** (owner). `ddia` ch.2 says the document model handles many-to-many relationships poorly: you denormalise or emulate joins in app code, which means more complex code and worse performance. So "highly connected" must penalise the document type directly. **Fix:** D3 document −10 → **−30** (the rules-bucket cap). Graph stays +20; relational gets nothing (raising it would take G10's default win away from graph). **Why −30:** an exhaustive check over every weight combination of the six fit criteria (5⁶ = 15,625 combinations, levels none…critical) showed the penalty must be ≥ 28 points for document never to beat both relational and graph. The worst case is learning-curve and scalability both Critical, schema-flexibility Low and everything else none, where document's 4s beat relational's 3s. With −30, document is never #1 and never even the close-call runner-up (smallest margin 2.7 points). Relational may still win when scalability or integrity weigh a lot; the owner accepts that. This is property test 8 (`tests/scoring/properties.test.ts`), which runs all 15,625 combinations and also checks the numbers in this paragraph (−27 lets document win, −28 doesn't; smallest margin 2.73). **Note (owner, 2026-10-24): the size −30 was picked to pass G10.** It's backed by `ddia` ch.2 in direction, not in size. **Later option:** replace the large number with a hard rule ("document can't be the #1 type for highly connected data"), which says what we mean without distorting the score.
2. **SQLite 2nd for e-commerce was a real problem** (owner): one writer at a time and one server is a poor fit for a commercial multi-user shop. **Fix:** D9 applied (−15), marked **unverified** until the SQLite docs are checked. It replaces the session-2 proposal (traffic-based); the traffic variant is dropped unless the SQLite docs suggest it.
3. **Type-win coverage** stays a check on scenario coverage, but only with scenarios a neutral senior developer would agree with. Key-value has no such scenario as the *main* database in v1 (reason in TESTING_STRATEGY §3), so it is exempt; the "cache-only service" case below is a unit check of rule D7, not a golden scenario.
4. G9 (hobby app) is non-commercial, so D9 doesn't fire and SQLite stays #1 there (D6). G1's database stays not needed (D8).

**Result (v4)**, changed rows only (others as v3) (`--variant draft`):
| Scenario (database part) | Types | Products in the chosen type |
|---|---|---|
| G2 e-commerce (D1, D5, **D9**) | relational 92.5; graph 57.5; document 47.5; key-value 32.5 | postgresql 86.1, mysql 75.0, **sqlite 61.4** (was 76.4, #2) |
| G5 MVP (D1, **D9**) | relational 77.5; document 60.8 | postgresql 79.2, mysql 70.8, **sqlite 57.9** |
| G10 social (D3) | **graph 65.8**; relational 62.5 (close call); key-value 50.8; **document 40.8** | neo4j 43.8 |
| G10 + scalability High | **graph 60.6**; relational 59.4 (close call); key-value 51.9; document 41.9 | neo4j 41.1 |
| G1 portfolio (D8) | not needed | — |

All database expectations still hold, and G10 no longer depends on scalability staying at its default. Open: D9's source; Neo4j's weak product score (unchanged).

### Session 8 (2026-10-25): D9 follows sqlite.org (Q30)
`npm run calibrate` (`current`); `--variant session7` reproduces the tables before this change.
1. **D9 narrowed** to what `sqlite.org/whentouse.html` says: −15 when traffic is large or spiky or many people save data at the same moment (new `data-flags` option `many-writers`), unless single user. Commercial or not; the app-kind list is gone too (the page's criteria don't depend on it). The owner rejected a −5 "money" penalty: no source, it would only be picked to pass G2.
2. **Results:** G2 e-commerce postgresql 83.3, **sqlite 76.4 (#2, was 61.4)**, mysql 72.2. G5 MVP postgresql 75.0, sqlite 72.9 (#2, was 57.9). **G8 API (traffic large) now gets D9**: postgresql 72.2, mysql 66.7, sqlite 55.8 (was 70.8, #2). G9 hobby app (single user) unchanged, sqlite #1.
3. **G2's expectation changed** from "`sqlite` not #2" to "`sqlite` not #1" (owner, 2026-10-25). Why: a small shop with low traffic is inside what sqlite.org calls a good fit, so ranking SQLite second is honest; what must not happen is SQLite as the pick for a commercial shop. The real-world blocker for a shop (no persistent disk on serverless or multi-instance hosting) is a hosting fact, so it belongs in the relation `C-sqlite-hosting` (Part 5, RESEARCH §4c), not in a database score.

### Session 4 (2026-10-24): committed engine, unsourced extremes held at 3
`npm run calibrate -- --variant session4`. Two changes (owner): (1) the engine, KB JSON and scenarios are now code in the repo, and (2) **a score of 5 or 1 needs a book or ref source**; GK-only 5s and 1s are held at the neutral 3 and marked `unsourced` (list in §3b), enforced by `tests/kb`.

Database effects: key-value's `real-time` 5 (type, Redis, Valkey) is unsourced, so key-value drops 4–19 points (most in G3, where real-time is High); SQLite's `learning-curve`, `scalability`, `real-time` and `ops-effort` extremes are unsourced, so it moves towards the middle (G9 still sqlite 84.6 #1; G2 sqlite 61.4 #3). **All database golden expectations hold** (`npm test`). New finding, already in `draft` (it comes from writing G11's input in full, with traffic large → S7): **G11 picks document over relational** (71.9 vs 69.4, close call) because G11 doesn't say what its data looks like (D0 +10 relational) while scalability is High. G11 has no database expectation; not tuned. Whether a microservices answer should ask for data shape is a Phase 3 form question.



# Part 2: Backend
Drafted 2026-10-24. Same template as the database part: types scored on fit criteria only; popularity, ecosystem, maturity and type safety are product-only. Facts and their sources: `RESEARCH.md` §6 (all checked **2026-10-24** unless noted).

Extra source ids (rows in `references/INDEX.md`): `ref:fw-repos` = the frameworks' own GitHub repos and docs (P; own facts only: licence, features, release dates, support policy), `ref:so-survey-2025` = Stack Overflow Developer Survey 2025, web frameworks question (**S**: read from secondary write-ups; the survey site is blocked and the 2026 framework numbers weren't found).

## 6. Backend criteria
Nine criteria from schema §4 apply to the backend part. Fit criteria ✱ (`parts.json` → `typeCriteria`).

| Criterion | Fit ✱ | What a 5 means here |
|---|---|---|
| `learning-curve` | ✱ | A beginner who knows the language builds a first API in an afternoon |
| `productivity` | ✱ | Rubric (below): most common building blocks are built in or first-party |
| `performance` | ✱ | Many requests per second per server (rough signal: TechEmpower bands, flagged until read) |
| `scalability` | ✱ | Handles more load by adding instances and using all cores of each |
| `real-time` | ✱ | Rubric (below): first-party WebSockets with broadcasting to groups |
| `ecosystem` | | Libraries, integrations and tutorials for the framework and its language |
| `community` | | Rubric (below): `so-survey` usage share |
| `maturity` | | Schema §8 rubric: years since 1.0 and a published support policy |
| `type-safety` | | Schema §8 rubric: compiler-enforced types → 5 … none → 1–2 |

`type-safety` is product-only: it depends on the language, not on the kind of framework.

**Rubrics proposed for the backend part (Q20, DESIGN):**
- `productivity`: count the building blocks that are **built in or first-party** (own docs, own GitHub org): data access/ORM, migrations, authentication, validation, admin UI, server-side templates, background jobs, code generators. 7–8 → 5 · 5–6 → 4 · 3–4 → 3 · 1–2 → 2 · 0 → 1. A half point for a thin first-party wrapper around a third-party tool; bands round down. Counts per product are in §8 (Django 8, Laravel 7, ASP.NET Core 7, Spring Boot ~5.5, NestJS ~5, FastAPI ~3, Fastify ~2.5, Express 1, Gin 2). Fair because every count comes from the framework's own docs (own facts) and the list is public.
- `real-time`: built in or first-party with broadcasting to groups/rooms → 5 · first-party, raw WebSocket connections (or broadcasting via a separate first-party server project) → 4 · only third-party libraries → 2.
- `community`: backend frameworks have lower usage shares than databases, so the database bands would put almost everything at 2–3. Backend bands: `so-survey` usage ≥ 15% → 5 · 10–15% → 4 · 5–10% → 3 · 2–5% → 2 · < 2% → 1. Not listed → placeholder ⚠. Since session 7: the **2026** shares from the official survey data (P, `npm run sources`).
- `performance` (session 7, 2026-10-24; schema §8 asks for TechEmpower plus a second source): two bands, then **the mean rounded down**, so a 5 needs both sources at 5.
  1. **TechEmpower Round 23** (2025-02-24, physical hardware), **Fortunes** test (database query, sorting, HTML template: the most "realistic" of its tests): the framework's best result among its `realistic` tests that are not `platform` (raw runtime) and are in a language we rank, as a share of the round's best Fortunes result: ≥ 40% → 5 · 15–40% → 4 · 7.5–15% → 3 · 3–7.5% → 2 · < 3% → 1.
  2. The **language runtime** band of §11 (`ref:energy-langs`).

  | Product | Best Fortunes test | Share | TE band | Language band | Score |
  |---|---|---|---|---|---|
  | ASP.NET Core | `aspnetcore-minimal` | 46.0% | 5 | 5 (C#) | **5** |
  | Spring Boot | `spring-webflux` | 18.5% | 4 | 5 (Java) | 4 |
  | Fastify | `fastify-postgres` | 20.0% | 4 | 4 (JS) | 4 |
  | Gin | `gin` (MySQL) | 8.3% | 3 | 5 (Go) | 4 |
  | Express | `express-postgresjs` | 13.0% | 3 | 4 | 3 |
  | NestJS | `nestjs-fastify` | 12.1% | 3 | 4 | 3 |
  | FastAPI | `fastapi` | 8.2% | 3 | 1 (Python) | 2 |
  | Laravel | `laravel-workerman` | 3.7% | 2 | 2 (PHP) | 2 |
  | Django | `django-postgresql` | 2.5% | 1 | 1 | **1** |

  Reproduce: `npm run sources` (downloads the round's results file and the survey data). Caveats: TechEmpower is a rough signal (tuned benchmark code, one round); Gin's only Fortunes test uses MySQL, which was slower than PostgreSQL for frameworks that have both (e.g. ASP.NET Core); Laravel's best test runs on Workerman (plain Laravel: 1.2%); `frontend-server` has no usable result (TechEmpower's `nextjs` test is a `platform` test with no Fortunes number) and stays GK 3.

## 7. Backend types (level 1)
`none` has no scores (chosen by a `not-needed` rule, B0).

| Type | learn | prod | perf | scal | real-time | Main sources |
|---|---|---|---|---|---|---|
| fullstack (the frontend framework's server) | 4 | 3 | 3 | 3 | 2 | `ref:fw-repos` (Next.js route handlers, SvelteKit endpoints, Nuxt/Nitro server routes); DESIGN (one project, one deploy) |
| minimal | 4 | 2 | 4 | 4 | 3 | `ref:fw-repos` (Express, Fastify, FastAPI, Gin feature lists); GK |
| batteries | 2 | **5** | 3 | 4 | 4 | `ref:fw-repos` (Django, Laravel, Spring Boot, NestJS, ASP.NET Core feature lists); GK |

Why these values, briefly:
- **productivity** follows the rubric applied to the type's products (§8): batteries frameworks have 5–8 building blocks, minimal ones 1–3. **fullstack 3** although its products count only ~1 (templates are the frontend itself): no second project, no API contract to keep in sync with the frontend, shared types (DESIGN, flagged).
- **learning-curve:** batteries 2 because there's more to learn up front (dependency injection, conventions, an ORM). Minimal 4. fullstack 4 if you already know the frontend framework (GK, flagged).
- **performance / scalability:** mostly decided by the language and runtime, not the kind of framework, so the type values stay close (3–4). Minimal frameworks do less work per request (GK, flagged; the TechEmpower numbers in §6 are per product, not per type). fullstack scalability 3: the server logic is deployed and scaled together with the frontend (GK).
- **real-time:** batteries 4 (SignalR, Spring WebSocket, NestJS gateways, Laravel Broadcasting are all first-party); minimal 3 (FastAPI built in, Fastify official plugin, Express and Gin need third-party libraries); fullstack 2 (Next.js and SvelteKit document no WebSocket server; Nuxt's server engine Nitro has one) (`ref:fw-repos`, P).

## 8. Backend products (level 2)
Order: learn · prod · perf · scal · real-time · ecosystem · community · maturity · type-safety.

| Product | Type(s) | Language | Scores | Key facts (P unless marked) |
|---|---|---|---|---|
| **frontend-server** (Next.js / Nuxt / SvelteKit / Astro server) | fullstack | TS/Node | 4 · 3 · 3 · 3 · 2 · 4 · 5 · 4 · 4 | Bridge option (schema §3). Community from Next.js 20.6% (2026). Next.js 1.0 2016-10, SvelteKit 1.0 2022-12, Nuxt 1.0 2018-01 (npm). WebSockets: Nitro yes (`features.websocket`), Next.js/SvelteKit docs: none |
| **Express** | minimal | TS/Node | **5** · 2 · 3 · 4 · 2 · 5 · 5 · 5 · 3 | 5.3.0, MIT. 1.0 2010-12 (npm); v4 and v5 both still get security support (`ref:eol`). Built in: routing, middleware, view rendering only. 15.6% (2026). Fortunes 13.0% |
| **Fastify** | minimal | TS/Node | 4 · 2 · 4 · 4 · 4 · 4 · 2 · 4 · 4 | 5.12.7, MIT. 1.0 2018-03; published LTS policy (each major ≥ 6 months + 6 months security after the next). Built in: JSON-schema validation, logging; official plugins `@fastify/websocket`, `@fastify/view`, `@fastify/jwt`. 3.5% (2026). Fortunes 20.0% |
| **FastAPI** | minimal | Python | 4 · 3 · 2 · 4 · 4 · 4 · 5 · 3 · 4 | 0.162.0 (still 0.x since 2018-12), MIT. Built in: validation (Pydantic), OpenAPI docs, dependency injection, security helpers, background tasks, WebSockets. No ORM, migrations or admin. 18.5% (2026). Fortunes 8.2% |
| **Gin** | minimal | Go | 3 · 2 · 4 · 5 · 2 · 3 · 2 ⚠ · 4 · 5 | 1.12.0 (2026-02-28), MIT. First v1 tag on the Go proxy: 2016. No published support policy. Built in: binding/validation, HTML templates. WebSockets via third-party `gorilla/websocket` (GK). Not an answer option in the 2025 or 2026 survey ⚠. Fortunes 8.3% (MySQL). Gin's own site has benchmarks only against other Go routers (vendor comparison, not used) |
| **NestJS** | batteries | TS/Node | 2 · 4 · 3 · 4 · **5** · 4 · 3 · 4 · 4 | 12.2.0, MIT, `@nestjs/core` since 2017-05. In its repo: `websockets`, `platform-socket.io`, `platform-ws`, `microservices`; first-party `@nestjs/typeorm`, `/passport`, `/schedule`, `/bullmq`, CLI generators. No published support policy found. 5.8% (2026). Fortunes 12.1% (on Fastify) |
| **Django** | batteries | Python | 3 · **5** · **1** · 3 · 4 · 5 · 4 · 5 · 3 | 6.1.2, BSD-3. In `django/contrib`: `admin`, `auth`, `sessions`; plus ORM, migrations, forms, templates and a `tasks` framework (background jobs) in core. LTS releases (5.2 to 2028-04). WebSockets: Channels, a separate project in the `django` org. 11.3% (2026). Fortunes 2.5% |
| **Spring Boot** | batteries | Java/Kotlin | 2 · 4 · 4 · 5 · **5** · 5 · 4 · 5 · 5 | 4.1.2, Apache-2.0. 1.0.0 on Maven Central 2014-04-01. OSS support per minor (4.1 to 2027-07). Starters: `data-jpa`, `flyway`, `security`, `validation`, `thymeleaf`, `websocket`, `actuator`. No admin UI or code generators beyond Initializr. 12.8% (2026). Fortunes 18.5% |
| **Laravel** | batteries | PHP | 3 · **5** · 2 · 3 · **5** · 5 · 3 · 5 · 3 | 13.38, MIT. Support policy: 13 gets security fixes to 2028-03 (`ref:eol`). `Illuminate/*`: Auth, Database (Eloquent, migrations), Validation, Queue, View (Blade), Console (Artisan generators), Broadcasting; first-party WebSocket server Reverb. Admin UI not counted (first-party Nova is paid). 7.6% (2026). Fortunes 3.7% (Workerman) |
| **ASP.NET Core** | minimal, batteries | C# | 3 · **5** · **5** · 5 · **5** · 5 · 5 · 5 · 5 | Ships with .NET 10 (LTS to 2028-11), MIT. 1.0 2016-06. In `dotnet/aspnetcore`: Identity, Mvc/Razor, SignalR, Validation, OpenApi; EF Core (first-party ORM + migrations, separate repo). Minimal APIs give the small style too. 19.9% (2026). Fortunes 46.0% (minimal APIs) |

Language skill effects (T1–T5) are added at product level through each product's language (`requires` relation). `frontend-server` requires a frontend framework with a server (Next.js, Nuxt, SvelteKit, Astro).

Unsourced extremes held at 3 (§3b rule): Express `learning-curve`, `ecosystem`; Gin `scalability`; Django, Laravel `ecosystem`; Spring Boot `scalability`, `ecosystem`; ASP.NET Core `scalability`, `ecosystem`; (since Part 3, `type-safety` of Gin, Spring Boot and ASP.NET Core is sourced through the language docs, and since session 7 every backend `performance` except `frontend-server` through TechEmpower + the runtime band, §6); placeholder Gin `community` (no survey lists Gin). The table above shows proposed values.

Score reasons that need a second source before release (`flagged`):
- ~~Every `performance` score~~ sourced in session 7 (TechEmpower Round 23 + runtime band, §6); only `frontend-server` 3 is still GK. Every `scalability` score above/below the type value (GK: Go, Java and C# use all cores in one process; Python and PHP usually scale by running more processes).
- ~~Every `community` score from secondary 2025 numbers~~: since session 7 the official 2026 data (P); Gin ⚠ is still a placeholder.
- `learning-curve` differences (GK): Express 5, NestJS and Spring Boot 2.
- `ecosystem` (GK): Gin 3 vs the rest 4–5.
- fullstack `productivity` 3 (DESIGN reason, above).

## 9. Backend rules
| id | When | Effect | Source |
|---|---|---|---|
| B0 | app kind ∈ {content site, portfolio} **and** data shape = no stored data | backend `not-needed` ("Pages can be built ahead of time; nothing has to run on a server") → language not needed too (S9) | DESIGN; replaces "backend none +15" in S1 (a `none` type has no score, so it can only win through `not-needed`) |
| B1 | app kind ∈ {API only, backend for a mobile app} | exclude type `fullstack` ("There's no web frontend whose server could host the API") | DESIGN |
| B2 | deadline = very tight **and** team ≤ 5 **and** TS/JS skill some or strong **and** app kind ∈ {interactive web app, e-commerce, internal tool} | `fullstack` +20; `minimal` and `batteries` −15 ("One project and one deploy: the frontend framework's server handles forms and API routes, so there's no second app to set up and keep in sync") | **DESIGN** (calibration finding 2, §10). Owner 2026-10-24: keep it, stays DESIGN, **don't raise its weight** |
| B3 (not in `rules.json` yet: needs stack assembly) | real-time = yes **and** `frontend-server` in the stack | note: "Next.js and SvelteKit have no built-in WebSocket server; use a hosted real-time service, Nuxt (Nitro has WebSockets) or a separate server" | `ref:fw-repos` (P) |
| A1 | style ∈ microservices family | `frontend-server` −10 | schema §7.5 |
| A3 | style ∈ {layered, modular monolith} | `batteries` +5 | schema §7.5 |

## 10. Backend calibration log
### Session 3 (2026-10-24): first backend simulation
First run with a scratch script; the table is now reproduced by `npm run calibrate -- --variant draft` (when the inputs were written in full, G8 got traffic "large" for its steady heavy load and G9 got learning-curve High for a beginner; those two rows changed and are shown as regenerated). Method: types then products, as in `SCORING_ENGINE.md` steps 4–5, with floors S5 (real-time), S6 (deadline), S7 (traffic), S8 (lifespan) and skill bucket T1/T2 at product level. **The language part doesn't exist yet**, so stack assembly is stood in for by keeping only products in the team's strongest language. Weights: as in the golden descriptions, every other criterion Low.

1. **Without language, ASP.NET Core and Spring Boot top every list** (base 83–96). Their scores are mostly 5s, so a weighted average favours them, the "decent at everything" effect the sibling warned about (its Q30). In the real engine the language part and stack assembly decide (a TS team gets "ASP.NET Core — needs: C#"). Not tuned now: many of those 5s are flagged (performance, community). **Re-check when the language part is calibrated**, especially G12 (neutral input), where nothing stops C# or Java from winning by default.
2. **G5 (MVP in 4 weeks) picked batteries** (75.0 vs fullstack 50.0), because batteries frameworks really do have more built in. The fair reason fullstack wins for a 2-person TS team on a tight deadline is not features but *one project instead of two*. **Fix:** rule B2. G5 now: fullstack 70.0, batteries 60.0; `frontend-server` 66.4 vs NestJS 63.2.
3. **S1 gave backend `none` +15**, but `none` types have no scores. **Fix:** B0 (`not-needed`); schema S1 updated.

**Result (v1)** (types; then the best products in the team's language, by candidate score):
| Scenario (backend part) | Types | Products in the team's language |
|---|---|---|
| G1 portfolio (B0) | not needed | — |
| G2 e-commerce, Java strong | batteries 70.8; minimal 54.2; fullstack 50.0 | spring-boot 95.4 |
| G3 chat, TS strong, real-time | batteries 67.9; minimal 57.1; fullstack 42.9 | nestjs 82.7, fastify 65.2, express 60.6 |
| G4 dashboard, Python strong | batteries 65.0; minimal 60.0 | django 79.4, fastapi 71.7 |
| G5 MVP, TS some (B2) | **fullstack 70.0**; batteries 60.0; minimal 35.0 | frontend-server 66.4, nestjs 63.2 |
| G6 .NET, C# strong | batteries 65.0; minimal 60.0 | aspnet-core 100.0 |
| G7 agency, PHP strong | batteries 65.0; minimal 60.0 | laravel 79.4 |
| G8 API, performance Critical, traffic large, Go some (B1) | **minimal 68.2**; batteries 61.4 | gin 81.7 |
| G9 hobby, Python some, learning-curve High | **minimal 64.3**; fullstack 57.1; batteries 53.6 | fastapi 73.2 |
| G11 microservices, Java strong (A1, S7) | batteries 67.9; minimal 64.3 (close call) | spring-boot 96.4 |
| G12 neutral | batteries 65.0; minimal 60.0 | (no skills) aspnet-core 95.5, spring-boot 86.4 — finding 1 |

**All backend expectations in `TESTING_STRATEGY.md` §3 hold** once the team's language is applied (the stand-in is `teamLanguagePick` in `tests/scoring/golden.ts`). Type-win coverage: `none` G1, `fullstack` G5, `minimal` G8, G9, `batteries` G2, G3, G4, G6, G7, G11 (checked by `tests/scoring/golden.test.ts`). Open: finding 1; G5's margin between `frontend-server` and NestJS is small (3.2 points), re-check after the language part.

### Session 4 (2026-10-24): unsourced extremes held at 3
`npm run calibrate -- --variant session4`. The owner read finding 1 (ASP.NET Core and Spring Boot on top of everything) as the same warning sign as Architecture Advisor's microservices bias, and asked to fix it **through sourcing, not tuning**: GK-only 5s go to 3.

Unsourced backend extremes (now 3): Express `learning-curve`, `ecosystem`; Gin `performance`, `scalability`, `type-safety`; Django, Laravel `ecosystem`; Spring Boot `scalability`, `ecosystem`, `type-safety`; ASP.NET Core `performance`, `scalability`, `ecosystem`, `type-safety`. Survey placeholders (Fastify, Gin, NestJS `community`) are also held at 3.

| Scenario (backend) | Unfiltered top 3 (cand) | Team language |
|---|---|---|
| G2 Java | spring-boot 82.9, aspnet-core 79.2, django 72.9 | spring-boot 82.9 |
| G3 TS, real-time | nestjs 82.7, aspnet-core 77.3, spring-boot 72.7 | nestjs 82.7 |
| G4 Python | django 73.9, aspnet-core 72.2, fastapi 71.7 | django 73.9 |
| G5 TS some, deadline (B2) | aspnet-core 67.3, frontend-server 66.4, nestjs 63.2 | frontend-server 66.4 |
| G6 C# | aspnet-core 87.3, spring-boot 72.7, django 70.5 | aspnet-core 87.3 |
| G7 PHP | laravel 73.9, aspnet-core 72.2, nestjs 66.7 | laravel 73.9 |
| G8 Go some, performance Critical | fastify 70.0, fastapi 63.3, aspnet-core 63.3 | gin 53.3 |
| G9 Python some, learning-curve High | fastapi 73.2, fastify 68.2, aspnet-core 68.2 | fastapi 73.2 |
| G11 Java, microservices | spring-boot 73.6, nestjs 68.2, aspnet-core 68.2 | spring-boot 73.6 |
| G12 neutral | aspnet-core 77.3, spring-boot 72.7, django 70.5 | (no skills) aspnet-core |

**What's left:** ASP.NET Core leads unfiltered lists only in G5 (by 0.9 over frontend-server) and G12 (by 4.6 over Spring Boot), instead of 83–96 everywhere. Its remaining 5s are sourced: `productivity` and `real-time` by the rubrics (own repo), `maturity` by the support policy, `community` by the 2025 survey (19.7%, **S**). So the remaining lead is evidence-based but rests partly on a secondary survey number. **Gin** lost its speed lead (`performance` and `scalability` unsourced: TechEmpower is blocked), so in G8 it's last among minimal frameworks; the team-language stand-in still picks it because it's the only Go option. Expectations still hold; G8 needs the language part and a performance source before it means much. Next: Part 3 (languages) sources `type-safety` and replaces the stand-in.

# Part 3: Language
Drafted 2026-10-24. One level (no types): the six languages of Q5/Q22 are scored directly. Facts: `RESEARCH.md` §7.

## 11. Language criteria and scores
Seven criteria apply: `learning-curve`, `productivity`, `performance`, `ecosystem`, `community`, `maturity`, `type-safety`. Rubrics (DESIGN, Q20):
- `performance`: normalised run time vs C in Pereira et al. 2021 (`ref:energy-langs`, CPU-bound benchmarks measured on 2017 versions; numbers from Table I of arXiv 2410.05460, **read directly in session 7**, P. That paper also warns that the benchmark programs differ a lot between languages, so this is a rough band): < 4× → 5 · 4–10× → 4 · 10–25× → 3 · 25–50× → 2 · > 50× → 1.
- `learning-curve`: the language learners use most (`so-survey`) **and** the most common introductory teaching language (`guo-2014`, `siegfried-2021`) → 5; a top introductory teaching language → 4; otherwise GK 2–4. Proxy for "easy to learn", chosen by the owner's source list (survey, teaching sources); all sources **S**.
- `community`: the database bands (≥ 40% → 5 …) with Stack Overflow 2026 language shares (official data, P since session 7; same numbers as the S values used before).
- `type-safety`: schema §8 rubric, from each language's own spec or docs (`ref:lang-docs`, P).
- `maturity`: schema §8 rubric, support windows from `ref:eol` (P).

Order: learn · prod · perf · ecosystem · community · maturity · type-safety.

| Language | Scores | Key evidence |
|---|---|---|
| **TypeScript / JavaScript on Node.js** | 4 · 4 · 4 · 5u · 5 · 5 · 4 | JS 6.52× C (the paper's TS figure, 46×, is an outlier of its benchmark code; TS compiles to JS). SO 2026 JS 62.0%, TS 43.8%. TS handbook: a static type checker, types optional. Node 26 to 2029-04. MIT |
| **Python** | **5** · 4 · **1** · 5u · 5 · 5 · 3 | Learners' #1 (SO 2025 blog) and the most common intro language at top US universities (Guo 2014). 71.90× C (CPU-bound; web apps mostly wait on the database). SO 2026 58.0%. PEP 484: no type checking at runtime. PSF-2.0 |
| **Java / Kotlin** | 4 · 3 · 5 · 4 · 4 · 5 · 5 | A top CS1 language (UK 2016, US 2021). 1.89× C. SO 2026 Java 27.6%, Kotlin 10.8%. Kotlin FAQ: statically typed (Java's own spec is blocked: GK). Java 25 LTS to 2030-09. GPL-2.0 + Classpath exception |
| **C# (.NET)** | 3 · 4 · 5 · 4 · 4 · 5 · 5 | 3.14× C. SO 2026 27.1%. C# docs: "strongly typed … the compiler enforces type safety". .NET 10 LTS to 2028-11. MIT |
| **Go** | 4 · 3 · 5 · 3 · 3 · 5 · 5 | 2.83× C. SO 2026 16.5%. Go spec: "strongly typed", compiled. BSD-3 |
| **PHP** | 4 · 4 · 2 · 4 · 3 · 5 · 3 | 27.64× C (measured on PHP 7; PHP 8 added a JIT). SO 2026 17.7%. Packagist 475,503 packages. Manual: type declarations are checked at run time (TypeError). BSD-3 on `php-src` master |

`5u` = unsourced, held at 3 (§3b rule): **Python and TypeScript/Node `ecosystem`**. Session 7 read five registry counts (P, `npm run sources`, 2026-10-24): npm 4,527,497 · PyPI 922,204 · Maven Central 661,801 (group:artifact, search.maven.org) · NuGet 501,532 · Packagist 475,503. **Go publishes no total module count**, so the six-registry comparison is still incomplete, and the counts measure different things (npm counts many tiny packages). No rubric yet; stays unsourced.

## 12. Language rules
| id | When | Effect | Source |
|---|---|---|---|
| S9 | the backend part is not needed | language `not-needed` ("The frontend uses HTML, CSS and JavaScript; no server language is needed") | DESIGN (rule reads `part.backend`, pass 2) |
| T1 / T2 | skill strong / some | language +20 / +10; products running on it +10 / +5 | `book:fosa ch.19` + DESIGN (starting values, **not tuned**: owner 2026-10-24) |
| T3 | framework known | that product +10 | same |
| T4 | deadline tight or very tight, the team knows a language at some/strong | languages nobody knows −10 | same |
| T5 | goal = learn | every skill effect × 0.5; `learning-curve` floor medium | DESIGN (Q11) |
| **T6** | goal = "Use what we know" (default) and the team knows a language at **strong** | **hard rule:** that language never ranks below, and the stack never picks, a language nobody on the team knows, unless a rule excludes the strong language. "Some" stays a points bonus | `book:fosa ch.19` (team factors) + DESIGN (owner 2026-10-24) |
| T7 | goal = "Use what we know" (default) and the team knows a language (some or strong) | a stack close call (SCORING_ENGINE step 6.7) is shown only if its stack keeps a language the team knows; with goal "Learn something new" any close call is shown | DESIGN (owner Q31, 2026-10-25) |

Stack assembly (`SCORING_ENGINE.md` step 6) is implemented: the best combination of each needed part's top 5 that satisfies every `requires` relation (backend product → language), score = mean candidate score. It replaces the "team language" stand-in of sessions 3–4.

## 13. Calibration log (language and stack)
### Session 5 (2026-10-24): language part, backend re-run with assembly
`npm run calibrate` (variant `current`; the `## language` and `## stack` tables). Golden expectations: `npm test`.

1. **First run (before sourcing):** the stack picked **C# + ASP.NET Core** over the team's own language in G4 (Python strong), G7 (PHP strong), G8 (Go some) and G9 (Python some). Owner's diagnosis: uneven sourcing. C#'s 5s were sourced, while Python's unsourced 5s had just been reset to 3, so they lost on paperwork, not merit. **Owner: don't tune T1/T2; source first.**
2. **Sourcing (owner step 1):** Python `learning-curve` 5 (learner and teaching sources, rubric §11), Java `learning-curve` 4 (same rubric, applied evenly), 2026 survey shares for every language. Gin and ASP.NET Core `performance` 5 through their runtime's benchmark, applied to both. Python and TypeScript `ecosystem` stay unsourced (no comparable registry counts). PHP and Go languages had no reset 5s. **Result:** the language part now ranks the team's language #1 in every golden scenario, and G9 (Python some) passes. But the stack still picked C# + ASP.NET Core in G4, G7 and G8, because ASP.NET Core's backend base (83.3 in G4) is far above Django's, Laravel's and Gin's.
3. **Hard rule T6 (owner step 3)** for "strong" only. **G4 and G7 now pass** (Django + Python, Laravel + PHP).
4. **G8 still fails (owner step 4): draft branch, not merged.** Numbers (`npm run calibrate`, G8 rows): language Go 94.1 (base 84.1 + T2 10), Java 88.6, C# 88.6. Backend: ASP.NET Core 83.3 (base, no skill), Gin 73.3 (base 68.3 + T2 5), Fastify 70.0. Stack: ASP.NET Core + PostgreSQL + C# 81.4 vs Gin + PostgreSQL + Go, about 79.9 (sums 171.9 vs 167.4 for backend + language). Why Gin is low: `scalability` is still unsourced (3, proposed 5); `community` is a placeholder (3); `productivity` 2 and `real-time` 2 by the rubrics (little built in, WebSockets via a third-party library); `ecosystem` 3 (GK). G8's expectation is "lang `go` #1 (Java or C# in top 3); BE `gin` or `aspnet-core`". ASP.NET Core is allowed as the backend, but with C#, not Go, so the language expectation fails. **Decision for the owner: Q29.**

Other results: G2 Spring Boot + Java, G3 NestJS + TS, G5 frontend-server + TS, G6 ASP.NET Core + C#, G9 FastAPI + SQLite + Python, G11 Spring Boot + Java (database: MongoDB, the G11 finding of session 4), **G12 neutral: ASP.NET Core + C#** (Java and C# tie at 86.1 in the language part; settled by the tie rule, see session 6). Earlier tables still reproduce: `--variant session4`, `draft`, `session2`.

### Session 6 (2026-10-24): owner answers to Q28, Q29, G12
1. **Q29 (a) is blocked on the network.** The owner switched the environment to full network access, but the session still ran behind the old allowlist (RESEARCH §6, "Session 6 retry"). No S number could be replaced with a primary one, so the re-run gives the same G8 rows as session 5: language Go 94.1, Java 88.6, C# 88.6; stack ASP.NET Core + PostgreSQL + C# beats Gin + PostgreSQL + Go by 1.5 points. That is under the close-call threshold (5), but the owner's condition applies **after** the primary numbers, so G8 isn't rewritten yet and the branch stays off `main`.
2. **G12 tie rule (owner: make it a documented rule).** SCORING_ENGINE step 6.6: options tied with a part's #1 (same `cand` and `final`) are a tie, and the stack settles it by stack score → sum of final → KB order, reported in `ties[]` with the reason. Before, the language list put Java first by KB order and the stack then reported C# as an "adjusted" pick, as if Java had won the language part. Now the `## stack` table has a "Ties" column: G12 `language: java = csharp → csharp (stack score)`; the probe P3 shows the same tie. **No pick or score changed** in any variant (only the new column). Also fixed: the KB-order fallback compared option positions as joined strings (`"10,2" < "9,1"`), now compared number by number.
3. **Q28:** `isOpenSourceAllowed` (OSI or public domain) and `licenceBadge` ("public domain" for SQLite) in the KB module, tested. K6 itself comes with Part 5.
4. **D9:** sqlite.org still blocked; search snippets suggest the page may be more permissive for small websites than a flat −15 (Q21). Unchanged and still `reviewed: false`.

### Session 7 (2026-10-24): primary numbers (Q29 finished), stack close calls
Network open. Every source below was read directly; `npm run sources` re-reads them (RESEARCH §6–7, "Session 7").
1. **Replaced S numbers with primary ones.** Stack Overflow 2026 from the official data files (`StackExchange/Survey`, 2026 `technology.json`): language shares are the same as the S values; web-framework shares are new (Express 15.6, FastAPI 18.5, Spring Boot 12.8, Django 11.3, Laravel 7.6, NestJS 5.8, Fastify 3.5; Gin is not an answer option). TechEmpower Round 23 Fortunes for backend `performance` (rubric §6, mean of the TechEmpower band and the runtime band, rounded down). arXiv 2410.05460 Table I read directly (same numbers, now P). **Score changes:** Gin `performance` 5 → 4 (Fortunes 8.3%, MySQL), FastAPI `performance` 3 → 2 and `community` 4 → 5, Django `performance` 2 → 1, Fastify `community` unsourced 3 → 2 (sourced), NestJS `community` now sourced (3). Every other value stayed the same with a better source. `--variant session6` reproduces the session-6 tables.
2. **G8 re-run** (`npm run calibrate`): language part unchanged (Go 94.1, Java 88.6, C# 88.6). Backend: ASP.NET Core 83.3, Fastify 68.3, Gin 65.0 (was 73.3). Stack: **ASP.NET Core + PostgreSQL + C# 81.4** vs the best stack with Go, **Gin + PostgreSQL + Go 77.1: C# ahead by 4.3 points**, under the 5-point threshold. So the owner's rule (Q29) applies: **G8 now expects a close call that shows both stacks**: picked C# + ASP.NET Core, alternative Go + Gin. T6 stays "strong" only. Why this is the honest answer: with primary numbers ASP.NET Core is the fastest framework we rank (46% of the best Fortunes result, Gin 8.3%), and Go "some" is a +10 bonus, not a hard rule; the gap is small, so the user should see both.
3. **New engine output: stack close calls** (SCORING_ENGINE step 6.7). G8 needed a way to "show both", which the engine didn't have. When a part's pick isn't its own #1 (an adjusted pick) and the best stack that keeps the #1 is less than `closeCallPoints` behind, the result lists that stack in `stack.closeCalls`. Test first (`tests/scoring/engine.test.ts`); the `## stack` table has a new "Close call" column (no number in any older table changed).
4. **Side effects to review (owner, Q31):** close calls also appear in **G5** (frontend-server + TS 76.4; alternative ASP.NET Core + C# 74.0, −2.4) and **G9** (FastAPI + SQLite + Python 80.9; alternative ASP.NET Core + SQLite + C# 79.0, −2.0). Both follow from the general 5-point rule; no golden scenario forbids them, but a beginner (G9) being shown a C# stack may not be what we want. **G4** (Python team) now gets FastAPI instead of Django (FastAPI 71.7 now ranks above Django, after Django `performance` 1 and FastAPI `community` 5); G4 allows both.
5. **D9 read against sqlite.org** (`whentouse.html`, last updated 2025-05-31): see Q30. The page doesn't support a flat penalty for "commercial": it says SQLite works for most low-to-medium traffic websites (under 100K hits/day is a conservative guide) and points to client/server databases for write-intensive sites, sites busy enough to need several servers, and many concurrent writers. The narrower rule changes G2 and G5, so it waits for the owner (bigger change). D9 now cites the page for its reason (one writer at a time); the rule itself is unchanged.

### Session 8 (2026-10-25): T7, D9 narrowed, C# audit
`--variant session7` reproduces every session-7 table (old D9, no T7).
1. **T7 (owner Q31, DESIGN):** with goal "Use what we know" and a known language, a stack close call must keep a known language. G5 (TS strong) and G9 (Python some) lose their ASP.NET Core + C# close calls; G8's Go + Gin close call stays (Go is known). With goal "learn" any close call is shown (e.g. G3 + learn: ASP.NET Core + C#, 0.1 behind). Tested in `tests/scoring/engine.test.ts`.
2. **D9 narrowed** (database log §5, session 8): stack picks unchanged in every golden scenario.
3. **Audit (owner asked: is C# sourced to Python's standard? Report, don't tune).** Per criterion, languages:
   - Sourced the same way for all six (P): `community` (SO 2026), `performance` (arXiv table), `maturity` (`ref:eol`), `type-safety` (`ref:lang-docs`). C#'s 5s for performance, maturity and type-safety are all from these.
   - `learning-curve`: Python 5 and Java 4 have (S) teaching/learner sources; C# 3, TS 4, Go 4, PHP 4 are GK. C#'s GK value is **lower** than the others, so it doesn't favour C#.
   - `productivity`: GK for every language (C# 4 = Python 4 = TS 4 = PHP 4; Java 3, Go 3). Even, but unsourced.
   - **`ecosystem` is uneven:** C# 4 and Java 4 are GK, while Python and TS (proposed 5, GK) are **held at 3** by the 5-or-1 rule, and PHP 4 is the only sourced one (Packagist). So the rule that held Python's and TypeScript's 5s at 3 leaves C#'s and Java's GK 4s untouched. Probe `--variant lang-ecosystem-even` (every GK-only language `ecosystem` at 3): C# and Java lose 1.4–3.5 points (less where weights differ); where they were ahead of TypeScript they now tie with it (G2, G4, G6, G7, G11, G12) or fall behind it (G9, where C# drops to 5th), and the G8 close-call gap shrinks from 4.3 to 3.5. **No stack pick changes.** Not tuned: a decision for the owner (Q32).
   - Backend (ASP.NET Core vs Django/FastAPI/NestJS): `performance`, `community`, `maturity`, `productivity`, `real-time` are sourced for all (P); `learning-curve`, `scalability` and `ecosystem` are GK for all, with ASP.NET Core's and Django's GK 5s held at 3 alike. Even.

# Part 4: Frontend
Drafted and merged 2026-11-08 (session 9). Two levels: the **approach** (type) and the **framework** (product). Facts: `RESEARCH.md` §8, all checked **2026-11-08**, all P and reproducible with `npm run sources` unless marked GK.

New source ids (rows in `references/INDEX.md`): `ref:fe-repos` (frameworks' own repos, docs and npm entries: own facts only), `ref:cwv-tech` (HTTP Archive Core Web Vitals technology report), `ref:mdn-learn` (MDN curriculum), `ref:whatwg-html` (HTML Living Standard), `ref:cloudflare-blog` (Astro ownership). `ref:web-rendering` (web.dev, "Rendering on the Web", Osmani and Miller, updated 2026-01-05) was read directly this session.

## 14. Frontend criteria and rubrics
Ten criteria apply. **Approaches** are scored on five fit criteria (`parts.json` → `typeCriteria`): `learning-curve`, `performance`, `seo`, `interactivity`, `cost`. **Frameworks** are scored on seven: `learning-curve`, `productivity`, `performance`, `ecosystem`, `community`, `maturity`, `type-safety`.

`seo`, `interactivity` and `cost` are **approach-only** (`criteria.json` → `typeOnlyFor: ["frontend"]`, new in the schema). Reason (calibration finding 1, §18): they describe how pages are rendered, and a framework that offers several approaches (Next.js: server, static and single-page) would otherwise collect the best `seo` *and* the best `interactivity` at once and win every scenario. The approach decision handles them; a framework is listed under every approach it supports.

Rubrics (DESIGN, Q20):
- `community`: Stack Overflow 2026 web-framework usage with the **backend framework bands** (≥ 15% → 5, 10–15 → 4, 5–10 → 3, 2–5 → 2, < 2 → 1), since both come from the same survey question. Plain HTML uses the language question (HTML/CSS 58.2%) with the language bands.
- `performance` (frameworks): two bands, **mean rounded down** (same method as the backend's TechEmpower rubric, §6), so a 5 needs both at 5:
  1. **Core Web Vitals band** (`ref:cwv-tech`, 2026-09 crawl, mobile): share of real sites using the framework that pass all three Core Web Vitals: ≥ 60% → 5 · 45–60 → 4 · 35–45 → 3 · 25–35 → 2 · < 25 → 1.
  2. **Rendering band** (`ref:web-rendering`): static pages or islands → 5 · server rendering without hydration → 4 · server rendering with hydration → 3 · client-side rendering → 2.

  | Framework | CWV pass (mobile) | CWV band | Rendering | Band | Score |
  |---|---|---|---|---|---|
  | Astro | 71.1% | 5 | static + islands | 5 | **5** |
  | Svelte | 53.6% | 4 | client-side | 2 | 3 |
  | SvelteKit | 48.3% | 4 | SSR + hydration | 3 | 3 |
  | React | 43.9% | 3 | client-side | 2 | 2 |
  | Vue | 36.2% | 3 | client-side | 2 | 2 |
  | Next.js | 35.7% | 3 | SSR + hydration | 3 | 3 |
  | Nuxt | 28.8% | 2 | SSR + hydration | 3 | 2 |
  | Angular | 16.5% | 1 | client-side | 2 | **1** |

  Plain HTML 5 and the backend's templates 4 have no CWV category, so they use the rendering band alone (flagged). Caveat: CWV pass rates are a correlation over millions of real sites, not a controlled benchmark; site quality, hosting and audience devices matter too. That is why it is never used alone.
- `maturity`: schema §8 rubric, applied as for the backend: ≥ 10 years since the first stable major **and** published support windows → 5; ≥ 10 years without published windows, or 5–10 years → 4; 2–5 years → 3. First stable majors from npm (P), windows from `ref:eol` and own docs.
- `type-safety`: TypeScript required and templates type-checked → 5 (Angular); TypeScript first-class but optional → 4; nothing type-checked by default → 2 (plain HTML, most template languages; GK).
- `learning-curve` (plain HTML only, `ref:mdn-learn`): HTML and CSS are the first core modules of MDN's curriculum and frameworks a later extension → 5. Framework-to-framework differences are GK.

## 15. Frontend approaches (level 1)
`frontend-none` ("No web frontend") has no scores; chosen by S2.

| Approach | learn | perf | seo | interactivity | cost | Main sources |
|---|---|---|---|---|---|---|
| static (pre-built pages) | 4 | **5** | **5** | 2 | **5** | `ref:web-rendering` (fast TTFB/FCP, low TBT; cheap CDN serving; interactivity by adding JS); `ref:github-docs` (free static hosting) |
| spa (single-page app) | 3 | 2 | 2 | **5** | **5** | `ref:web-rendering` (hard to keep fast on phones; SEO "can work" with extra testing; suits app-like experiences); builds to static files |
| ssr (meta-framework) | 2 | 3 | **5** | 4 | 2 | `ref:web-rendering` (fast FCP, but hydration is "one app for the price of two"; crawlers get complete HTML; "significant compute overhead") |
| server-templates (pages from the backend) | 4 | 4 | **5** | 2 | 4 | `ref:web-rendering` (SSR without hydration; suits content and links); cost: runs on the backend you already have (GK) |

`learning-curve` of every approach and `cost` of server-templates are GK (flagged).

## 16. Frontend frameworks (level 2)
Order: learn · prod · perf · ecosystem · community · maturity · type-safety. `u` = unsourced, held at 3.

| Framework | Approaches | Scores | Key facts (P, 2026-11-08) |
|---|---|---|---|
| **Plain HTML, CSS and JS** | static | **5** · 2 · **5** · 3 · **5** · **5** · 2 | No package (no licence of its own: allowed under "open source only", no badge). MDN teaches HTML/CSS first. HTML/CSS 58.2% (SO 2026). WHATWG living standard |
| **Astro** | static, ssr | 4 · 4 · **5** · 3 · 3 · 3 · 4 | 7.4.7, MIT. 1.0 2022-08. Islands: zero JS by default. 6.2%. CWV 71.1%. The Astro company joined Cloudflare 2026-01-16; stays MIT (`ownership` fact) |
| **React** | spa | 3 · 3 · 2 · 5u · **5** · 4 · 4 | 19.3.1, MIT. 15.0 2016-04 (versions before were 0.x); no end-of-life dates published. 41.5%. CWV 43.9%. React's docs point to frameworks for server rendering |
| **Vue** | spa | 4 · 4 · 2 · 4 · **5** · 4 · 4 | 3.5.45, MIT. 1.0 2015-10; only the latest minor supported. Official router, Pinia, Vite. 17.2%. CWV 36.2% |
| **Svelte** | spa | 4 · 4 · 3 · 3 · 3 · 4 · 4 | 5.57.3, MIT. 1.0 2016-11 (just under 10 years). 7.8%. CWV 53.6% |
| **Angular** | spa, ssr | 2 · 4 · **1** · 4 · **5** · **5** · **5** | 22.2.5, MIT. 2.0 2016-09; each major 6 months active + 12 months LTS (22 to 2028-06). Router, forms, HTTP client, SSR, CLI first-party; TypeScript required, strict template checks. 16.0%. CWV 16.5% |
| **Next.js** | ssr, static (spa until Q33, 2026-11-09) | 3 · 4 · 3 · 4 · **5** · **5** · 4 | 16.4.5, MIT. 1.0 2016-10; LTS (15 to 2027-01). 20.6%. CWV 35.7% |
| **Nuxt** | ssr, static | 3 · 4 · 2 · 4 · 2 · 4 · 4 | 4.6.4, MIT. 1.0 2018-01; end-of-life dates per major. 4.4%. CWV 28.8% |
| **SvelteKit** | ssr, static, spa | 3 · 4 · 3 · 3 · 3 · 3 · 4 | 3.1.1, MIT. 1.0 2022-12. 5.6%. CWV 48.3% |
| **The backend's templates** (bridge) | server-templates | 4 · 4 · 4 · 4 · **5** · 4 · 2 | Blade, Django templates, Thymeleaf, Razor, Jinja2. Community: the most used template-rendering backend, ASP.NET Core 19.9% (same method as `frontend-server`, which takes Next.js's share). Licence: the backend's |

Unsourced extreme held at 3: React `ecosystem` (proposed 5: the largest component ecosystem; no comparable registry metric yet, the same gap as language `ecosystem`, Q32).

Flagged (GK, need a second source before release): every framework `learning-curve` except plain HTML; `productivity` (no frontend rubric yet: a first-party building-block count like the backend's §6 is the obvious candidate); `ecosystem`; `type-safety` 2s; the bridge's `ecosystem`, `maturity`, `learning-curve`.

**Not readable: State of JS 2025** (2025.stateofjs.com, 13,002 respondents): usage and satisfaction numbers are drawn by charts and not in the page text. Text only: front-end happiness 92% (average 3.7/5), meta-framework happiness 88%; Astro has the top meta-framework satisfaction and Next.js keeps gaining usage while losing satisfaction. Not used for scores (schema §8 rule 4: satisfaction only with another source). Q21.

## 17. Frontend rules and relations
| id | When | Effect | Source |
|---|---|---|---|
| S1 | app kind ∈ {content site, portfolio} | `static` +20; `seo` floor high | `ref:web-rendering` (static rendering when pages are known ahead and not personalised) |
| S2 | app kind ∈ {API only, mobile backend} | frontend `not-needed` | DESIGN (Q19) |
| S3 | app kind = web app **and** SEO not "yes" | `spa` +10 | `ref:web-rendering` |
| S4 | SEO = yes **and** app kind ∈ {web app, e-commerce} | `ssr` +15, `spa` −10 | `ref:web-rendering` (SSR for dynamic pages; CSR SEO needs extra work) |
| S10 | content site or portfolio **with** stored data | `server-templates` +10, `ssr` +10, `static` −10 | `ref:web-rendering` (every URL generated in advance vs live data) |
| S11 | TS/JS skill none **and** another language at some/strong | `server-templates` +10 | `book:fosa ch.19` + DESIGN (one language, one project) |
| S12 | backend not needed | exclude `server-templates`, `ssr` | DESIGN (follows B0) |
| S13 | SEO = yes | `seo` floor high | DESIGN (the user's own answer) |
| S14 | app kind ∈ {web app, internal tool, e-commerce} | `interactivity` floor high | `ref:web-rendering` + DESIGN |
| S15 | same condition as B2 (very tight deadline, small TS/JS team, an app) | `ssr` +20, `spa` −10 | DESIGN, follows B2; **flagged for the owner (Q33)** |
| S16 | app kind ∈ {content site, portfolio} | `nextjs`, `nuxt`, `sveltekit` −10 | `ref:web-rendering` ("fine to mostly ship HTML with minimal JavaScript"; full hydration "rarely the best option"; prerendering ≠ static rendering) |

Relations (`compatibility.json`): `C-frontend-server-frontend` (the frontend framework's server needs Next.js, Nuxt, SvelteKit or Astro) and `C-backend-templates-backend` (pages from the backend need a backend framework that renders templates: all nine server frameworks, not `frontend-server`). **Engine change:** a `requires` relation now fails when the required part isn't in the stack (before, a missing part counted as satisfied; no earlier relation was affected: the `session8` variant reproduces the old tables exactly).

## 18. Calibration log (frontend)
### Session 9 (2026-11-08): first frontend run
`npm run calibrate` (`## frontend` table and the frontend column of `## stack`). `--variant session8` is the KB without the frontend part and reproduces every earlier table byte for byte (checked against the old `current` snapshot).

1. **First run: Next.js won every scenario and `static` won every app.** Two causes. (a) Frameworks were scored on `seo` and `interactivity` too, so Next.js (server, static and single-page) collected 5s on both; with `community` 5 and `maturity` 5 it led every list, and as a static-capable product it never paid a type gap. **Fix:** `seo`, `interactivity` (and `cost`) score approaches only (§14). (b) Nothing raised `interactivity` for an app or `seo` when the user asked for search engines, so with every weight Low the static approach (5s on performance, seo, cost) won everything. **Fix:** S14 and S13.
2. **`performance` was GK.** Found a primary, public metric: the HTTP Archive Core Web Vitals technology report. With the rubric of §14, Astro gets 5 and Angular 1 from evidence instead of opinion.
3. **G1 (portfolio) still picked Next.js** over Astro and plain HTML, on `community` and `maturity`. web.dev's guidance is direct: content pages should ship HTML with little JavaScript, and full hydration is rarely the best option. **S16** (−10 for the meta-frameworks that hydrate every page, on content sites only) and plain HTML's sourced `learning-curve` 5 (MDN) give plain HTML 71.4, Astro 67.9, Next.js 65.0.
4. **G5 (MVP) chose `spa`**, although the stack's backend is the frontend framework's own server (B2). **S15** mirrors B2 on the frontend side. Flagged: the owner said not to raise B2's weight; S15 is a separate frontend rule (Q33).
5. **The bridge "the backend's templates" lost on placeholder 3s** for `ecosystem`/`community`. `community` now follows the `frontend-server` precedent (the most used framework of its kind: ASP.NET Core 19.9%).

**Result:**
| Scenario | Approaches | Frameworks (cand) | Stack (frontend · backend · database · language) |
|---|---|---|---|
| G1 portfolio | **static** 100.0; spa 50.0 | plain-html 71.4, astro 67.9, nextjs 65.0 | plain-html · — · — · — |
| G2 e-commerce, Java | **ssr** 84.4; server-templates 76.7; static 72.2 | nextjs 80.0, angular 75.0 | nextjs · spring-boot · postgresql · java |
| G3 chat, TS | **spa** 81.4; static 64.3 | nextjs 75.0, vue 71.4, angular 67.9 | nextjs · nestjs · postgresql · typescript-node |
| G4 dashboard, Python | **spa** 71.4; server-templates 67.1 (close call) | nextjs 75.0, vue 71.4 | nextjs · fastapi · postgresql · python |
| G5 MVP | **ssr** 80.7; spa 71.4 | nextjs 75.0 | nextjs · frontend-server · postgresql · typescript-node |
| G6 .NET | **spa** 71.4; server-templates 67.1 (close call) | nextjs 80.6, angular 75.0 | nextjs · aspnet-core · postgresql · csharp |
| G7 agency, PHP | **server-templates** 98.6; static 95.7 (close call) | backend-templates 71.4, plain-html 68.6 | backend-templates · laravel · postgresql · php |
| G8 API | not needed (S2) | — | — · aspnet-core · postgresql · csharp (close call gin · go −4.3, unchanged) |
| G9 beginner, Python | **spa** 76.7; server-templates 71.1 | vue 72.2, nextjs 69.4 | vue · fastapi · sqlite · python |

**Every frontend expectation holds** (TESTING_STRATEGY §3), and **no backend, database or language pick changed** in any golden scenario. Type-win coverage: `static` G1 (and G12), `spa` G3, G4, G6, G9–G11, G13, `ssr` G2, G5, `server-templates` G7, `none` G8.

**Open findings for the owner (Q33):**
- **Next.js is the framework pick in most app scenarios**, also where the approach is `spa` (G3, G4, G6, G10–G13), because it is listed under all three approaches and has sourced `community` 5 and `maturity` 5 (published LTS). React, the SPA most people would name, scores lower on `performance` (CWV 43.9% but client-side band 2), `productivity` (GK 3) and its unsourced `ecosystem` (held at 3). Fair by the evidence we have, but the UI would say "Single-page app: Next.js". Options: keep; list Next.js under `ssr` and `static` only (its SPA mode is a static export without server features); or source React's `ecosystem`/`productivity` first (the sourcing-first approach the owner chose for C# in session 5).
- **S15** (above).

# Part 5: Hosting
Drafted and merged 2026-11-08 (session 10). Two levels: the **hosting type** and the **provider**. Facts: `RESEARCH.md` §4 (re-checked 2026-11-08 from each vendor's own pages, P) and §4c. New source id: `ref:host-pricing` (vendors' own pricing, plan and terms pages: own facts only). Every free-tier fact is a `pricing` fact with a **90-day stale window**; the K9 beta status is a `release-status` fact (90 days).

## 19. Hosting criteria
Eight criteria apply: `learning-curve`, `performance`, `scalability`, `maturity`, `cost`, `real-time`, `ops-effort`, `portability`. Types are scored on six fit criteria (`parts.json` → `typeCriteria`): `learning-curve`, `scalability`, `real-time`, `ops-effort`, `cost`, `portability`.

`cost` rubric (DESIGN, Q20; the schema §8 draft: "free tier fit for a small app and price of the first paid step"): a lasting free tier allowed in production with no sleep → 5 · a free tier with caps, pauses or a non-commercial clause, paid from about $20 → 4 · a free tier explicitly not for production, or a monthly credit too small to keep a server running, paid from about $5 → 3 · trial only, then paid → 2. Applied: GitHub Pages 5, Cloudflare 5, Netlify 4, Vercel 4, the three clouds 4 (lasting free amounts of some services; credits expire), Render 3, Railway 3, Fly.io 2, a VPS 2 (no free tier, from $4 a month).

Every other hosting score is GK except where a vendor fact decides it (`real-time` of GitHub Pages 1, Netlify 1, Render 4; scalability of the frontend platforms). Flagged for a second source before release.

## 20. Hosting types (level 1)
| Type | learn | scal | real-time | ops | cost | portability | Main sources |
|---|---|---|---|---|---|---|---|
| static-hosting | 4 | 3 | **1** | 4 | **5** | 4 | `ref:github-docs` (static only, 100 GB soft limit, free); `ref:cloudflare-docs` (static assets free and unlimited) |
| frontend-platform | 4 | 4 | 3 | 4 | 4 | 3 | `ref:host-docs` (auto-scaling functions); RESEARCH §4b (WebSockets: Vercel yes, Netlify no) |
| paas | 4 | 3 | 4 | 4 | 3 | 4 | `ref:host-docs` (Render WebSockets, no max duration); `ref:host-pricing` (free instances single, sleep) |
| cloud | 2 | 4 | 4 | 2 | 3 | 2 | `ref:host-pricing` (free amounts; credits expire; uncapped billing); GK |
| vps | 2 | 2 | 4 | 2 | 3 | 4 | `ref:host-pricing` (no free tier, flat $4–€6 a month); GK |

No `none` type: every stack is hosted somewhere.

## 21. Hosting providers (level 2)
Order: learn · perf · scal · maturity · cost · real-time · ops · portability. `freeTier.commercialUse`: yes / no / unknown (vendor page silent).

| Provider | Type | Scores | Free tier (P, 2026-11-08) | Commercial on free |
|---|---|---|---|---|
| **GitHub Pages** | static-hosting | 4 · 4 · 3 · 4 · **5** · **1** · 4 · 4 | Free; ≤ 1 GB; 100 GB/month soft limit | no (not for an online business, shop or SaaS) |
| **Netlify** | frontend-platform | 4 · 4 · 4 · 4 · 4 · **1** · 4 · 3 | 300 credits a month; sites pause at the limit; Pro $20 | unknown |
| **Vercel** | frontend-platform | 4 · 4 · 4 · 4 · 4 · 3 · 4 · 3 | Hobby: 100 GB transfer, 1M invocations, 4 CPU-hours; wait 30 days or upgrade; Pro $20/seat | **no** (non-commercial personal use only) |
| **Cloudflare Workers** | frontend-platform | 3 · 4 · 4 · 4 · **5** · 4 · 4 · 3 | 100,000 requests/day, 10 ms CPU each; static assets unlimited; Durable Objects (WebSockets) on Free | yes (no clause found) |
| **Render** | paas | 4 · 3 · 3 · 3 · 3 · 4 · 4 · 4 | Sleeps after 15 min idle; 750 h/month; no disk; free Postgres 1 GB expires after 30 days; "not for production" | unknown |
| **Railway** | paas | 4 · 4 · 4 · 3 · 3 · 4 · 4 · 4 | **New since the 2026-10-23 notes:** a Free plan with $1 of usage a month (0.5 GB RAM per service); trial $5 for 30 days; Hobby $5 | unknown |
| **Fly.io** | paas | 3 · 4 · 4 · 3 · 2 · 4 · 3 · 4 | No free tier for new organisations: $1 trial for 7 days; from $2.19/month | — |
| **AWS** | cloud | 2 · 4 · 4 · 4 · 4 · 4 · 2 · 2 | Free plan: up to $200 credits, ends after 6 months; 30+ always-free services | yes |
| **Azure** | cloud | same | $200 for 30 days; 12 months of free amounts; 65+ always-free services | yes |
| **Google Cloud** | cloud | same | $300 for 90 days; Free Tier with no end date (Cloud Run 2M requests/month, an e2-micro VM) | yes |
| **A VPS** (`vps-server`) | vps | 2 · 3 · 2 · 4 · 2 · 4 · 2 · 4 | None; DigitalOcean $4/month, Hetzner from €5.99 | — |

Runtimes (decide the relations below): Netlify Functions run JavaScript/TypeScript and Go; Vercel runs Node.js, Python, Go, Ruby and Rust natively, anything else in its **container runtime (beta on all plans, changelog 2026-10-27)**; Cloudflare Workers run JavaScript/TypeScript, Python and Rust (other languages only as WebAssembly); Render runs Node.js, Python, Ruby, Go, Rust and Elixir natively and Docker for PHP, .NET and the JVM; Railway and Fly.io build Docker images.

## 22. Hosting rules and relations
| id | When | Effect | Source |
|---|---|---|---|
| K1 | commercial **and** free only | exclude `vercel` | `ref:host-pricing` (Hobby non-commercial) |
| K1b | commercial **and** app kind ∈ {e-commerce, web app} | exclude `github-pages` | `ref:github-docs` |
| K1c | commercial, another app kind | note on GitHub Pages' terms | `ref:github-docs` |
| K2 | commercial **and** budget not free only | note "Vercel needs Pro" | `ref:host-pricing` |
| K3 | must self-host | exclude every type but `vps` and every provider but `vps-server` | DESIGN |
| K4, K4b, K4c | must use AWS / Azure / Google Cloud | exclude every other provider and type (works like a lock) | DESIGN |
| K5 | free only | exclude `railway`, `fly-io`, `vps-server`. Railway's new Free plan doesn't change this: $1 a month buys about 3 days of a 0.5 GB server (RAM alone costs $10/GB-month) | `ref:host-pricing` |
| K6 | open source only | exclude every product whose licence isn't OSI-approved, public domain or "not a package" (today: `mongodb`); note on Redis/Valkey/JSONB. A unit test keeps the list complete | `ref:db-repos` + owner Q16, Q28 |
| K7 | real-time | `netlify` −15 (Vercel: note only, relation `C-vercel-realtime`) | RESEARCH §4b + owner Q24 |
| K8 | backend needed | exclude type `static-hosting` | `ref:github-docs` |
| S17 | backend not needed | `static-hosting` +15 | `ref:github-docs` + DESIGN |
| S18 | backend needed, **not** the B2 situation | `paas` +10 (a server process runs as it is on a PaaS; frontend platforms run short-lived functions with time limits) | `ref:host-docs` + DESIGN |
| S19 | traffic large or spiky, or team 16+ | `cloud` +10 | DESIGN |
| S20 | traffic large **and** `cost` weight ≥ high | `paas`, `frontend-platform` −10, `vps` +10 (per-use billing costs several times more per CPU and GB at steady load: Railway $20/vCPU + $10/GB a month vs a $6 DigitalOcean server with 1 vCPU and 1 GB) | `ref:host-pricing` |
| S21 | the B2 situation | `frontend-platform` +10 | DESIGN (follows B2, S15) |
| A1 | microservices family | now also `paas`, `cloud` +5 (schema §7.5) | `book:fosa ch.18` |
| A2 | style = serverless | `frontend-platform`, `cloud` +10 | `book:fosa` |

Relations (`compatibility.json`; **new kinds** `conflicts`, `note`, `penalty`, and an optional `when` condition, KB schema §6):
| id | Kind | Pair | Why |
|---|---|---|---|
| `C-github-pages-backend` | conflicts | GitHub Pages + any backend | static files only |
| `C-netlify-language` | conflicts | Netlify + Python, Java, C#, PHP | functions: JS/TS and Go |
| `C-cloudflare-language` | conflicts | Cloudflare + Java, C#, PHP, Go | Workers: JS/TS, Python, Rust |
| `C-vercel-container` | penalty (**K9**) | Vercel + Java, C#, PHP | container runtime in beta: −5, or −10 when `maturity` ≥ high; reads the `release-status` fact, so it switches off when the fact says GA |
| `C-sqlite-hosting` (**K10**) | conflicts | SQLite + Netlify, Vercel, Cloudflare | no lasting local disk |
| `C-sqlite-render-free` | conflicts, when free only | SQLite + Render | free web services can't attach a disk |
| `C-sqlite-single-server` | note | SQLite + Render, Railway, Fly.io, a cloud | one instance with a persistent disk |
| `C-vercel-realtime` | note, when real-time | Vercel + any backend | pub/sub needed to broadcast |
| `C-frontend-server-realtime` (**B3**) | note, when real-time | `frontend-server` + Next.js or SvelteKit | no built-in WebSocket server |

Not done (next): `worksBestWith` pair bonuses (schema §6; e.g. Next.js + Vercel), and the database-hosting notes of Q18.

## 23. Calibration log (hosting)
### Session 10 (2026-11-08): first hosting run
`npm run calibrate` (`## hosting` table, hosting column and a Notes column in `## stack`). `--variant session9` is the KB without hosting and reproduces the previous `current` tables byte for byte; every older variant is unchanged too (they replay the old G8 input without `cost`, `variants.ts` `inputs`).

1. **First run: the hosting type was a near-tie everywhere** (frontend platform and PaaS at 66.7), and Cloudflare won most stacks on its sourced `cost` 5, also where its runtimes can't run the backend (the stack moved to the next provider through `C-cloudflare-language`). As with the database and frontend parts, the situation has to choose the type. **Fix:** S17 (no backend → static hosting), S18 (a server backend → PaaS), S19 (large scale → cloud).
2. **G5 (MVP on the frontend framework's server)**: frontend platform and PaaS tied exactly. **S21** mirrors B2 (the one-project deploy). G5 now: frontend platform 76.7, Cloudflare.
3. **G8 (steady heavy load, cost High)**: the PaaS won. Its golden input now has `cost: high`, as the scenario always said ("cost High is a hosting criterion, not in the KB yet"). **S20** applies the sourced price gap of per-use billing at steady load. G8's **type** is now `cloud` (62.5; frontend platform and PaaS 60.0), but the **stack still picks Railway**: the type gap is only 2.5 points, and the cloud providers score low on `learning-curve`, `ops-effort` and `portability` (GK). Not tuned further: owner question **Q34**.
4. **Performance:** five parts make stack assembly enumerate up to 5⁵ combinations. The assembler now checks each relation as soon as both of its parts are picked and copies a combination only when it wins somewhere (same results, every table unchanged). One `score()` call takes about 0.6 ms (well under the 200 ms target); the two database sweep tests now score the database part alone (its types don't depend on assembly), 150 s → 4 s.

**Result:**
| Scenario | Hosting types | Providers (cand) | Stack (frontend · backend · database · hosting · language) |
|---|---|---|---|
| G1 portfolio | **static-hosting** 77.5; frontend-platform 66.7 | github-pages 65.6, cloudflare 61.0 | plain-html · — · — · github-pages · — |
| G2 e-commerce, Java | **paas** 76.7; frontend-platform 66.7 | railway 65.0 | nextjs · spring-boot · postgresql · railway · java |
| G3 chat, TS | **paas** 78.8 | railway 70.0, render 65.0 | nextjs · nestjs · postgresql · railway · typescript-node |
| G4 dashboard, Python | **paas** 76.7 | railway 68.8, render 62.5 | nextjs · fastapi · postgresql · railway · python |
| G5 MVP | **frontend-platform** 76.7; paas 66.7 | cloudflare 71.9, vercel 68.8 | nextjs · frontend-server · postgresql · cloudflare · typescript-node |
| G6 .NET, must use Azure | **cloud** (K4b) | azure 60.0 | nextjs · aspnet-core · postgresql · azure · csharp |
| G7 agency, PHP | **paas** 76.7 | railway 68.8 | backend-templates · laravel · postgresql · railway · php |
| G8 API, heavy load | **cloud** 62.5; frontend-platform 60.0; paas 60.0 (close call) | — | — · aspnet-core · postgresql · **railway** · csharp (close call: gin · postgresql · vercel · go, −2.4) |
| G9 beginner, free | **paas** 78.8 | render 65.0 | vue · fastapi · **postgresql** · render · python (SQLite moved: Render Free has no disk) |
| G11 microservices | **paas** 77.5; frontend-platform 68.8; cloud 68.1 | railway 70.0 | nextjs · spring-boot · mongodb · railway · java |

**Every hosting expectation holds** (G8 at type level, Q34). Changes in other parts: **G9's database is now PostgreSQL** (allowed by G9; SQLite can't keep its file on Render Free) and G8's language close-call gap is 2.4 (was 4.3; the hosting part is now in the stack mean). Type-win coverage: `static-hosting` G1, `frontend-platform` G5, `paas` G2–G4, G7, G9–G13, `cloud` G6, G8, `vps` **exempt for now** (wins only with "must self-host", K3 unit test; Q34).

**Open for the owner (Q34):** G8's stack pick (Railway with a cloud type), the `vps` coverage exemption (add a "must self-host" golden scenario?), and Railway the most common PaaS pick (it ties Render on most scores and wins on `performance`/`scalability` GK 4 vs Render's sourced free-tier 3s).

## 24. Owner decisions applied (session 14, 2026-11-09)
The owner asked to settle the open questions with the recommendations given ("fix them and finish it"). Each change has its own variant, so the tables before it still reproduce: `npm run calibrate -- --variant session13` is the KB just before session 14, and every older variant (`session9` … `session4`, `d9-traffic`, `lang-ecosystem-even`) now starts from it, so their tables are unchanged.

### Q32: language `ecosystem` held evenly
Java's and C#'s GK-only `ecosystem` 4s are now held at 3 (`unsourced`, `proposed: 4`), like Python's and TypeScript's GK 5s, until a registry-size rubric covers every language (KB schema §8). Go stays at its GK 3; PHP keeps its sourced 4 (Packagist). The session-8 probe predicted the result exactly:
- C# and Java lose 1.4–3.5 points on the language list; where they led TypeScript they now tie with it (G2, G4, G6, G7, G11, G12) or fall behind it (G9: C# 5th).
- **No stack pick changes.** G8's close-call gap shrinks from 2.4 to 1.9 (stack 77.7 vs Go + Gin + Vercel 75.9). G12's language tie is now three-way (TypeScript, Java, C# at 83.3); the stack still picks C# (stack score).
- Every golden expectation holds (`tests/scoring/golden.test.ts`); `--variant current` shows the new tables.

### Q34: hosting scores sourced, G14 added
**Scalability rubric for hosting** (DESIGN, from each vendor's own docs, checked 2026-11-09; sources: `ref:host-docs` with the page in the note): 5 automatic horizontal scaling by load on a self-serve plan · 4 more instances by setting a count, with some automatic help · 3 one instance or soft limits · 2 one server you resize by hand. Applied:
| Option | Before | Now | Why (vendor docs) |
|---|---|---|---|
| `gcp` · `azure` · `aws` | 4 (GK) | **5** | Cloud Run autoscales on CPU and concurrency; App Service autoscale (Standard and up); ECS Service Auto Scaling on Fargate (App Runner is closed to new customers) |
| `vercel` · `netlify` · `cloudflare` | 4 | **5** | functions/Workers scale out with traffic |
| `render` | 3 (free tier) | **4** | up to 100 instances on paid plans; autoscaling needs a Pro workspace |
| `railway` | 4 (GK) | 4 | replicas by hand; vertical scaling automatic within plan limits |
| `fly-io` | 4 (GK) | 4 | more Machines by hand or a fly-autoscaler you run; Fly Proxy starts/stops existing Machines |
| `vps-server` | 2 (GK) | 2 | a single Droplet doesn't autoscale (DigitalOcean docs) |
| types `cloud` / `frontend-platform` / `paas` / `vps` | 4 / 4 / 3 / 2 | **5 / 5 / 4** / 2 | as their providers |

**Render `performance` 3 → 4**: the 3 came from the free tier's sleep; Render's docs say a paid plan removes the Free-instance limits, so paid Render scores like Railway (always on). The sleep is now rule **K12** (budget free only: Render −5, sourced to render.com/docs/free; the −5 stands in for the lost performance step, DESIGN). Railway is excluded on a free-only budget anyway (K5).

**Results** (`--variant current`; `--variant session13` is the KB before Q32 and Q34):
- **G8 now picks AWS** (stack 78.8; close call Go + Gin + Vercel 77.0), so its stack matches its cloud type, as the scenario expected (Q34 call 1).
- **Railway and Render tie exactly** wherever a PaaS wins (G2–G4, G7, G10–G13), and the tie rule (step 6.6) picks Render by KB order; the result says "Render = Railway → Render (KB order)" (Q34 call 3: no unsourced lead for Railway any more).
- **G1 picks Cloudflare Workers** over GitHub Pages (68.3 vs 65.6; G1 allows either). G2, G11, G12: Cloudflare is the hosting #1 but can't run their language (C-cloudflare-language), so the stack moves to Render.
- **G14 added** (must self-host, Q34 call 2): `vps` 45.8 is the only type K3 leaves, `vps-server` the pick; Java + Spring Boot + PostgreSQL + VPS (Next.js frontend; see Q33). The `vps` coverage exemption is gone; only `key-value` keeps one.
- Every golden expectation holds. The historic variants now also print a G14 row; their other rows are unchanged. The e2e expectations moved with the engine (chat, shop → Render; portfolio → Cloudflare Workers; api → AWS).

### Q33: frontend ecosystem and productivity sourced; Next.js no longer listed as an SPA
**(c) first.** `ecosystem` rubric for frontend frameworks (DESIGN; data: the npm registry's own search API, `keywords:<name>`, 2026-11-09): ≥ 100k packages → 5 · 25k–100k → 4 · 5k–25k → 3 · 1k–5k → 2; a meta-framework counts its base library's packages (React components work in Next.js). Counts: react 195,685 · vue 57,436 · angular 32,284 · nextjs 17,034 · svelte 10,160 · nuxt 4,177 · astro 3,730 · sveltekit 2,196. Applied: React **5** (was held at 3, proposed 5), Next.js **5** (was 4), Vue 4, Nuxt 4, Angular 4, Svelte 3, SvelteKit 3 (unchanged values, now sourced). Astro keeps its GK 3 (it uses React, Vue and Svelte components through official integrations, so neither its own count nor a base library's describes it); plain HTML and the backend's templates are outside the rubric.
`productivity` (Q33's "frontend productivity rubric"): 4 routing, data loading and more built in or official (already sourced for Vue, Angular, Next.js, Nuxt, SvelteKit, Astro) · 3 a UI library whose own docs point to a separate framework. React **3** (react.dev: "we recommend starting with a framework"; otherwise you choose your own tools for routing and data fetching), Svelte **3, was GK 4** (svelte.dev: "We recommend using SvelteKit").
Result of (c): **Next.js still led every SPA list, by more** (G3 78.6 vs Vue 71.4, React 67.9). So, as recommended:
**(b) Next.js is listed under `ssr` and `static` only.** Its single-page mode is a static export, and Next.js's docs list what that drops: "Features that require a Node.js server, or dynamic logic that cannot be computed during the build process, are not supported" (dynamic routes without `generateStaticParams`, route handlers that read the request, cookies, rewrites, redirects; nextjs.org/docs/app/guides/static-exports, read 2026-11-09).
**Results:** where the approach is SPA and Next.js's other approaches are far behind, **Vue is now the pick** (G3, G10, G11, G13, P1, P2). Where `static` is within reach (G4, G6, G14: SPA 71.4 vs static 64.3), Next.js still wins on its rank score as a static site (step 5: final − 7.1 gap), and the result shows it under "Static site". G2, G5, G12 (server-rendered or static) keep Next.js. Every golden holds; e2e: the chat example is now Vue + NestJS + PostgreSQL + Render.
**S15 kept** (Q33 part 2, as recommended).

### worksBestWith pairings (2026-11-09)
Two sourced pairings (KB schema §6): **Next.js + Vercel +2** (github.com/vercel/next.js: the Next.js repository is Vercel's) and **Django + PostgreSQL +1** (docs.djangoproject.com, `django.contrib.postgres`: "PostgreSQL has a number of features which are not shared by the other databases"). Points are DESIGN, kept small on purpose. Engine: added to the stack's sum and spread over its parts (like K9), capped at +6 per stack.
**Result:** one pick moves. **G4** (Python data dashboard) now gets **Django** instead of FastAPI: the two were 0.1 apart as stacks (74.9 vs 75.0 with the +1; G4 allows either). No golden changes otherwise; Next.js + Vercel never forms in a golden stack (Cloudflare or Render win the hosting), so its +2 only matters near a tie. `--variant session13` drops the pairings, so the historic tables are unchanged.
Candidates not added, for want of a clear first-party source: Laravel + MySQL (Laravel's installation docs, 12.x, read 2026-11-09: a new app's `.env` uses SQLite by default), ASP.NET Core + Azure, SvelteKit + Vercel.

## 25. Rubrics finished in session 15 (Q20, 2026-11-09)
### Language `ecosystem`: registry size (Q32 option b)
Q32 held every GK-only language `ecosystem` at 3 "until a registry-size rubric covers all six languages". The missing piece was Go, which publishes no total module count. **Libraries.io** indexes all six registries (Go through proxy.golang.org) and counts them the same way (`libraries.io/api/platforms`, P, 2026-11-09), so one method covers every language. The registries' own counts are the cross-check (`npm run sources` prints both).

**Rubric (DESIGN, KB schema §8):** ≥ 2M packages → 5 · 500k–2M → 4 · 100k–500k → 3 · 20k–100k → 2 · < 20k → 1. Each band is four times the one below, so only large differences change a score: the counts measure slightly different things (npm has many tiny packages; Maven counts group:artifact pairs).

| Language | libraries.io | Registry's own count (2026-11-09) | Before | Now |
|---|---|---|---|---|
| TypeScript / Node.js | npm 6,222,398 | 4,585,439 | 3 (held, proposed 5) | **5** |
| Python | PyPI 971,457 | 935,594 | 3 (held, proposed 5) | **4** |
| Go | Go 858,082 | none published | 3 (GK) | **4** |
| Java | Maven 821,711 | 661,801 | 3 (held, proposed 4) | **4** |
| C# | NuGet 717,369 | 507,461 | 3 (held, proposed 4) | **4** |
| PHP | Packagist 525,236 | 479,556 | 4 (Packagist) | 4 |

PHP is the boundary case: its own count is just under 500k, libraries.io's just over. The rubric names one source for every registry, so libraries.io decides (4, as before). Python's GK proposal (5) was higher than the rubric gives; Go's GK 3 was lower.

**Results** (`npm run calibrate -- --variant current`; `--variant session13` undoes this with the session-14 changes, so every older table is unchanged):
- Every language except PHP gains 2.3–5.5 points; TypeScript gains most (ecosystem 3 → 5; capped at 100 where it already led, e.g. G3 98.6 → 100).
- **No stack pick changes**, and every golden expectation holds. Stack scores rise by up to 1.1 (G5), not at all where PHP is the language (G7).
- **G12** (neutral input): the three-way language tie is gone; TypeScript is the language #1 (88.9, Java and C# 86.1) and the stack still picks C# + ASP.NET Core on stack score (79.9; close call Next.js + NestJS + Cloudflare + TypeScript 76.8).
- **G7** (PHP team): TypeScript's language score (85.7) is now above PHP's (84.3), but the rule that lists a language the team knows strongly before unknown ones (`strongBeforeUnknown`) keeps PHP first, and the stack is still Laravel + PHP.
- **P3**: TypeScript and Go now tie at 83.3, behind the Java = C# tie.
- **Engine fix found here:** in G12, keeping the language #1 and keeping the hosting #1 led to the same alternative stack, which was listed twice. Step 6.7 now lists an identical close-call stack once (SCORING_ENGINE step 7, `tests/scoring/engine.test.ts`). No historic table changed.
