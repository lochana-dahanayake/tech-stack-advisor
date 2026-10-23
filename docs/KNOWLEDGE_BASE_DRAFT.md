# Knowledge Base Draft

Status: **draft, part 1 of 5: database** (2026-10-23). Real KB content in reviewable form, before it becomes JSON (Phase 1). Other parts follow in this order: backend → language → frontend → hosting (`ROADMAP.md`). Shape and rules of the game: `KNOWLEDGE_BASE_SCHEMA.md`.

## Source tags
`book:<id> <locator>` (ids from `references/INDEX.md`), `ref:<id>` (published source), `GK` (general knowledge: must be reviewed and, where it's comparative, backed by a second source before release), `DESIGN` (a product decision). **(P)** / **(S)** = primary / secondary evidence (`RESEARCH.md`). Every score below was checked **2026-10-23** unless noted.

`ref:so-survey` = Stack Overflow Developer Survey 2026, databases question (n = 12,061 respondents; usage shares read from the official results page via search, S: the survey site is blocked from cloud sessions). `ref:mdb-docs` = MongoDB manual in the `mongodb/docs` repo (P).

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

Not used: DDIA 1st ed.'s note that MongoDB has no joins, and its remark that MySQL copies a whole table on `ALTER TABLE`. Both described 2017 versions and are out of date (`$lookup` exists today, `ref:mdb-docs`). Re-check against the 2nd edition (2026).

## 4. Database rules
Rule table in schema §7.2; final draft values:
| id | When | Effect | Source |
|---|---|---|---|
| D0 | `data-shape` = Not sure | relational +10; note: "Data tends to become more connected as an app gains features, and relational databases handle that best. If your items really are self-contained, pick 'documents'." | `book:ddia ch.2` (data becoming more interconnected as features are added) |
| D1 | linked records | relational +15, document −10 | `book:ddia ch.2`, `book:sixstep ch.1` |
| D2 | self-contained documents | document +15; note "PostgreSQL's JSONB can store documents too" | `book:ddia ch.2`, `book:mpg17` |
| D3 | highly connected | graph +20, document −10 | `book:ddia ch.2` |
| D4 | fields vary a lot | `schema-flexibility` floor High | `book:ddia ch.2` (schema-on-read helps when items differ) |
| D5 | money / strict consistency | `data-integrity` floor Critical; document −5 | `book:ddia ch.7` |
| D6 | single user / offline / small | sqlite +15 | GK (verify, Q21) |
| D7 | only simple lookups / cache | key-value +15 · **otherwise** key-value −20, `otherwiseExplanation`: "Key-value stores like Redis are usually added *next to* a main database (for caching or sessions), not used as the only one." | `book:ddia ch.3` + DESIGN |
| D8 | no stored data | database `not-needed` | DESIGN |
| D9 (proposed, not applied) | multi-user server app and traffic growing/large/spiky | sqlite −15 | needs sqlite.org "Appropriate uses" (blocked) |

## 5. Calibration log
### Session 2 (2026-10-23): first database simulation
Scratch script, not committed: weights + rules from schema §7, scores from §2–3, type level then product level (`SCORING_ENGINE.md` steps 2–5). Database part only.

1. **v0: types scored on all 12 criteria → graph could never win** (G10: graph 37.5 vs relational 75.0 even with D3 +20). Cause: popularity, ecosystem, cost and portability belong to *products*; at type level they punish any niche category, the same hidden bias the owner warned about (G13 request). **Fix:** types are scored on the six fit criteria only (§1). Schema §4/§5 and `SCORING_ENGINE.md` step 4 updated.
2. **v1: key-value came #2 almost everywhere,** although it's mainly a secondary store. **Fix:** D7 `otherwise` −20 (§4).
3. **v2: with no data-shape answer, document won** (neutral G12: document 70.8 vs relational 62.5). For "Not sure" the sourced default is DDIA's observation that data gets more connected as features are added. **Fix:** D0 (+10 relational, with the reason shown).
4. **MongoDB data integrity 3 → 4:** its manual documents multi-document transactions since 4.0/4.2 (P). The document *type* stays 3.

**Result (v3):**
| Scenario (database part) | Types | Products in the chosen type |
|---|---|---|
| G2 e-commerce (D1, D5) | relational 92.5; graph 57.5; document 47.5; key-value 32.5 | postgresql 86.1, sqlite 76.4, mysql 75.0 |
| G4 dashboard (D1) | relational 77.5; document 60.8; key-value 50.8; graph 45.8 | postgresql 79.2, sqlite 72.9, mysql 70.8 |
| G5 MVP (D1) | relational 77.5; document 60.8; key-value 50.8; graph 45.8 | postgresql 79.2, sqlite 72.9, mysql 70.8 |
| G9 hobby (D1, D6) | relational 74.4; document 61.9; key-value 51.9; graph 40.6 | sqlite 91.8, postgresql 75.0, mysql 67.9 |
| G10 social (D3) | **graph 65.8**; relational 62.5 (close call); document 60.8; key-value 50.8 | neo4j 43.8 |
| G10 + scalability High | document 61.9; graph 60.6; relational 59.4 (three-way close call) | mongodb 73.2 |
| G13 catalogue (D2, D4) | **document 93.1**; relational 59.4; graph 53.1; key-value 45.6 | mongodb 73.2 |
| G13 without the D4 floor | document 85.8; relational 62.5 | mongodb 68.8 |
| G3 chat, data shape Not sure (D0), real-time High | relational 69.4; document 65.6 (close call); key-value 58.1 | postgresql 75.0, mysql 64.3, sqlite 62.5 |
| G12 neutral (D0) | relational 72.5; document 70.8 (close call) | postgresql 82.1, sqlite 76.8, mysql 75.0 |
| Cache-only service (D7 fires) | **key-value 93.1**; document 71.9 | redis 71.4, valkey 64.3 |

**All database expectations in `TESTING_STRATEGY.md` §3 hold.** Every type wins at least one case (type-win coverage, Q27). Open findings:
- **G10 sensitivity:** with scalability High, document edges out graph (61.9 vs 60.6, a close call, so both are shown). G10's input therefore leaves scalability at its default; logged in the TESTING_STRATEGY notes. Not tuned further without a source: graph databases really are harder to scale out (GK, needs a second source).
- **SQLite #2 for e-commerce (G2):** acceptable as a runner-up for a small shop, but D9 should probably exist. Waits for sqlite.org.
- **Neo4j's product score is weak (43.8)** because of its small community (`so-survey` 2.8%). That's honest: it's picked because the *type* fits, and the result shows "weak fit as a product, strong fit as a type". Worth a UI note in Phase 3.
