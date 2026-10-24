# Knowledge Base Draft

Status: **draft, parts 1–3 of 5: database (2026-10-23, revised 2026-10-24), backend and language (2026-10-24)**. Part 3 is on a **draft branch, not merged**: golden G8 fails and waits on the owner (§13, `OPEN_QUESTIONS.md` Q29). Real KB content in reviewable form. **Since 2026-10-24 the database and backend parts are also JSON** (`src/modules/knowledge-base/data/`, validated by Zod and `npm test`); where this draft and the JSON differ, the JSON holds unsourced extremes at 3 (§3b) and this draft shows the proposed values. Other parts follow in this order: language → frontend → hosting (`ROADMAP.md`). Shape and rules of the game: `KNOWLEDGE_BASE_SCHEMA.md`.

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
| D9 | commercial = yes **and** app kind ∈ {e-commerce, interactive web app, backend for a mobile app, API only} **and** not "single user / offline" | sqlite −15; note: "SQLite lets one writer change the database at a time and runs inside one server, so it's a poor fit for a shop or app where many users save data at once." | GK, **unverified** (`reviewed: false`): check against sqlite.org "Appropriate uses" (owner is getting this checked, Q21). Owner request 2026-10-24 |

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
- `community`: backend frameworks have lower usage shares than databases, so the database bands would put almost everything at 2–3. Backend bands: `so-survey` usage ≥ 15% → 5 · 10–15% → 4 · 5–10% → 3 · 2–5% → 2 · < 2% → 1. Not listed → placeholder ⚠.

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
- **performance / scalability:** mostly decided by the language and runtime, not the kind of framework, so the type values stay close (3–4). Minimal frameworks do less work per request (GK; TechEmpower blocked, flagged). fullstack scalability 3: the server logic is deployed and scaled together with the frontend (GK).
- **real-time:** batteries 4 (SignalR, Spring WebSocket, NestJS gateways, Laravel Broadcasting are all first-party); minimal 3 (FastAPI built in, Fastify official plugin, Express and Gin need third-party libraries); fullstack 2 (Next.js and SvelteKit document no WebSocket server; Nuxt's server engine Nitro has one) (`ref:fw-repos`, P).

## 8. Backend products (level 2)
Order: learn · prod · perf · scal · real-time · ecosystem · community · maturity · type-safety.

| Product | Type(s) | Language | Scores | Key facts (P unless marked) |
|---|---|---|---|---|
| **frontend-server** (Next.js / Nuxt / SvelteKit / Astro server) | fullstack | TS/Node | 4 · 3 · 3 · 3 · 2 · 4 · 5 ⚠ · 4 · 4 | Bridge option (schema §3). Community from Next.js 20.8% (S). Next.js 1.0 2016-10, SvelteKit 1.0 2022-12, Nuxt 1.0 2018-01 (npm). WebSockets: Nitro yes (`features.websocket`), Next.js/SvelteKit docs: none |
| **Express** | minimal | TS/Node | **5** · 2 · 3 · 4 · 2 · 5 · 5 · 5 · 3 | 5.3.0, MIT. 1.0 2010-12 (npm); v4 and v5 both still get security support (`ref:eol`). Built in: routing, middleware, view rendering only. 19.9% (S) |
| **Fastify** | minimal | TS/Node | 4 · 2 · 4 · 4 · 4 · 4 · 2 ⚠ · 4 · 4 | 5.12.7, MIT. 1.0 2018-03; published LTS policy (each major ≥ 6 months + 6 months security after the next). Built in: JSON-schema validation, logging; official plugins `@fastify/websocket`, `@fastify/view`, `@fastify/jwt`. Not in the survey numbers found ⚠ |
| **FastAPI** | minimal | Python | 4 · 3 · 3 · 4 · 4 · 4 · 4 · 3 · 4 | 0.162.0 (still 0.x since 2018-12), MIT. Built in: validation (Pydantic), OpenAPI docs, dependency injection, security helpers, background tasks, WebSockets. No ORM, migrations or admin. 14.8% (S) |
| **Gin** | minimal | Go | 3 · 2 · **5** · 5 · 2 · 3 · 2 ⚠ · 4 · 5 | 1.12.0 (2026-02-28), MIT. First v1 tag on the Go proxy: 2016. No published support policy. Built in: binding/validation, HTML templates. WebSockets via third-party `gorilla/websocket` (GK). Not in the survey numbers found ⚠ |
| **NestJS** | batteries | TS/Node | 2 · 4 · 3 · 4 · **5** · 4 · 3 ⚠ · 4 · 4 | 12.2.0, MIT, `@nestjs/core` since 2017-05. In its repo: `websockets`, `platform-socket.io`, `platform-ws`, `microservices`; first-party `@nestjs/typeorm`, `/passport`, `/schedule`, `/bullmq`, CLI generators. No published support policy found. Survey share not found ⚠ |
| **Django** | batteries | Python | 3 · **5** · 2 · 3 · 4 · 5 · 4 · 5 · 3 | 6.1.2, BSD-3. In `django/contrib`: `admin`, `auth`, `sessions`; plus ORM, migrations, forms, templates and a `tasks` framework (background jobs) in core. LTS releases (5.2 to 2028-04). WebSockets: Channels, a separate project in the `django` org. 12.6% (S) |
| **Spring Boot** | batteries | Java/Kotlin | 2 · 4 · 4 · 5 · **5** · 5 · 4 · 5 · 5 | 4.1.2, Apache-2.0. 1.0.0 on Maven Central 2014-04-01. OSS support per minor (4.1 to 2027-07). Starters: `data-jpa`, `flyway`, `security`, `validation`, `thymeleaf`, `websocket`, `actuator`. No admin UI or code generators beyond Initializr. 14.7% (S) |
| **Laravel** | batteries | PHP | 3 · **5** · 2 · 3 · **5** · 5 · 3 · 5 · 3 | 13.38, MIT. Support policy: 13 gets security fixes to 2028-03 (`ref:eol`). `Illuminate/*`: Auth, Database (Eloquent, migrations), Validation, Queue, View (Blade), Console (Artisan generators), Broadcasting; first-party WebSocket server Reverb. Admin UI not counted (first-party Nova is paid). 8.9% (S) |
| **ASP.NET Core** | minimal, batteries | C# | 3 · **5** · **5** · 5 · **5** · 5 · 5 · 5 · 5 | Ships with .NET 10 (LTS to 2028-11), MIT. 1.0 2016-06. In `dotnet/aspnetcore`: Identity, Mvc/Razor, SignalR, Validation, OpenApi; EF Core (first-party ORM + migrations, separate repo). Minimal APIs give the small style too. 19.7% (S) |

Language skill effects (T1–T5) are added at product level through each product's language (`requires` relation). `frontend-server` requires a frontend framework with a server (Next.js, Nuxt, SvelteKit, Astro).

Unsourced extremes held at 3 (§3b rule): Express `learning-curve`, `ecosystem`; Gin `scalability`; Django, Laravel `ecosystem`; Spring Boot `scalability`, `ecosystem`; ASP.NET Core `scalability`, `ecosystem`; (since Part 3, `type-safety` of Gin, Spring Boot and ASP.NET Core is sourced through the language docs, and `performance` of Gin and ASP.NET Core through their runtime's benchmark, §11); placeholders Fastify, Gin, NestJS `community`. The table above shows proposed values.

Score reasons that need a second source before release (`flagged`):
- **Every `performance` score** (no source yet: TechEmpower is blocked; bands by runtime, GK). Every `scalability` score above/below the type value (GK: Go, Java and C# use all cores in one process; Python and PHP usually scale by running more processes).
- **Every `community` score** comes from secondary 2025 survey numbers (S); Fastify, Gin and NestJS ⚠ are placeholders.
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
- `performance`: normalised run time vs C in Pereira et al. 2021 (`ref:energy-langs`, CPU-bound benchmarks measured on 2017 versions; **S**: paper sites blocked, numbers from arXiv 2410.05460 Table I): < 4× → 5 · 4–10× → 4 · 10–25× → 3 · 25–50× → 2 · > 50× → 1.
- `learning-curve`: the language learners use most (`so-survey`) **and** the most common introductory teaching language (`guo-2014`, `siegfried-2021`) → 5; a top introductory teaching language → 4; otherwise GK 2–4. Proxy for "easy to learn", chosen by the owner's source list (survey, teaching sources); all sources **S**.
- `community`: the database bands (≥ 40% → 5 …) with Stack Overflow 2026 language shares (**S**).
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

`5u` = unsourced, held at 3 (§3b rule): **Python and TypeScript/Node `ecosystem`**. PyPI's size (921,802 projects, P) is known, but npm, Maven Central and NuGet counts can't be read from cloud sessions, so no fair registry-size comparison exists yet.

## 12. Language rules
| id | When | Effect | Source |
|---|---|---|---|
| S9 | the backend part is not needed | language `not-needed` ("The frontend uses HTML, CSS and JavaScript; no server language is needed") | DESIGN (rule reads `part.backend`, pass 2) |
| T1 / T2 | skill strong / some | language +20 / +10; products running on it +10 / +5 | `book:fosa ch.19` + DESIGN (starting values, **not tuned**: owner 2026-10-24) |
| T3 | framework known | that product +10 | same |
| T4 | deadline tight or very tight, the team knows a language at some/strong | languages nobody knows −10 | same |
| T5 | goal = learn | every skill effect × 0.5; `learning-curve` floor medium | DESIGN (Q11) |
| **T6** | goal = "Use what we know" (default) and the team knows a language at **strong** | **hard rule:** that language never ranks below, and the stack never picks, a language nobody on the team knows, unless a rule excludes the strong language. "Some" stays a points bonus | `book:fosa ch.19` (team factors) + DESIGN (owner 2026-10-24) |

Stack assembly (`SCORING_ENGINE.md` step 6) is implemented: the best combination of each needed part's top 5 that satisfies every `requires` relation (backend product → language), score = mean candidate score. It replaces the "team language" stand-in of sessions 3–4.

## 13. Calibration log (language and stack)
### Session 5 (2026-10-24): language part, backend re-run with assembly
`npm run calibrate` (variant `current`; the `## language` and `## stack` tables). Golden expectations: `npm test`.

1. **First run (before sourcing):** the stack picked **C# + ASP.NET Core** over the team's own language in G4 (Python strong), G7 (PHP strong), G8 (Go some) and G9 (Python some). Owner's diagnosis: uneven sourcing. C#'s 5s were sourced, while Python's unsourced 5s had just been reset to 3, so they lost on paperwork, not merit. **Owner: don't tune T1/T2; source first.**
2. **Sourcing (owner step 1):** Python `learning-curve` 5 (learner and teaching sources, rubric §11), Java `learning-curve` 4 (same rubric, applied evenly), 2026 survey shares for every language. Gin and ASP.NET Core `performance` 5 through their runtime's benchmark, applied to both. Python and TypeScript `ecosystem` stay unsourced (no comparable registry counts). PHP and Go languages had no reset 5s. **Result:** the language part now ranks the team's language #1 in every golden scenario, and G9 (Python some) passes. But the stack still picked C# + ASP.NET Core in G4, G7 and G8, because ASP.NET Core's backend base (83.3 in G4) is far above Django's, Laravel's and Gin's.
3. **Hard rule T6 (owner step 3)** for "strong" only. **G4 and G7 now pass** (Django + Python, Laravel + PHP).
4. **G8 still fails (owner step 4): draft branch, not merged.** Numbers (`npm run calibrate`, G8 rows): language Go 94.1 (base 84.1 + T2 10), Java 88.6, C# 88.6. Backend: ASP.NET Core 83.3 (base, no skill), Gin 73.3 (base 68.3 + T2 5), Fastify 70.0. Stack: ASP.NET Core + PostgreSQL + C# 81.4 vs Gin + PostgreSQL + Go, about 79.9 (sums 171.9 vs 167.4 for backend + language). Why Gin is low: `scalability` is still unsourced (3, proposed 5); `community` is a placeholder (3); `productivity` 2 and `real-time` 2 by the rubrics (little built in, WebSockets via a third-party library); `ecosystem` 3 (GK). G8's expectation is "lang `go` #1 (Java or C# in top 3); BE `gin` or `aspnet-core`". ASP.NET Core is allowed as the backend, but with C#, not Go, so the language expectation fails. **Decision for the owner: Q29.**

Other results: G2 Spring Boot + Java, G3 NestJS + TS, G5 frontend-server + TS, G6 ASP.NET Core + C#, G9 FastAPI + SQLite + Python, G11 Spring Boot + Java (database: MongoDB, the G11 finding of session 4), **G12 neutral: ASP.NET Core + C#** (Java and C# tie at 86.1 in the language part; ASP.NET Core's backend score breaks the tie). Earlier tables still reproduce: `--variant session4`, `draft`, `session2`.
