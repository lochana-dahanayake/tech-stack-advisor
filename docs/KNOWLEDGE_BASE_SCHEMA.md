# Knowledge Base Schema

Status: **draft (2026-10-23)**, Phase 0; implemented for the database, backend and language parts in `src/modules/knowledge-base/` (2026-10-24) and the frontend and hosting parts (2026-11-08). Owner answers of 2026-10-23 and 2026-10-24 applied (Q2–Q19, Q24–Q27 decided). Starts from Architecture Advisor's `docs/KNOWLEDGE_BASE_SCHEMA.md` and adds what tech-stack choices need: parts with two levels, compatibility, team skills and dated facts. Open points are marked with their question number in `OPEN_QUESTIONS.md`.

The KB is a set of JSON files in the repo, validated with **Zod** (a TypeScript library that checks data against a schema) at build time and in tests. It has a semantic `kbVersion`; every result records the version it was computed with (same as sibling ADR-003).

## 1. Files
```
src/modules/knowledge-base/data/
  meta.json            # version, scale, levels, caps, stale windows, architecture style ids
  references.json      # short citation (+ public URL) for every book:/ref: id; the methodology page lists them
  parts.json           # parts of the stack and their levels
  criteria.json        # what options are scored on
  options.json         # every type and product, with scores and dated facts
  questions.json       # form questions (situation, team, constraints) and their floors
  rules.json           # situation, data-shape, constraint, style-link rules
  compatibility.json   # requires / conflicts / works-best-with between options
  skills.json          # team-skill rules (how known languages/frameworks shift scores)
  bundles.json         # well-known stacks shown as info (MERN, LAMP, ...), not ranked
  glossary.json        # recognised but not ranked (WordPress, Firebase, Bun, ORM, SSR, ...)
```

## 2. Shared types
```ts
type Source =
  | { kind: "book"; ref: string; locator?: string }          // ref = id from references/INDEX.md, e.g. "ddia", locator "ch.2"
  | { kind: "ref"; ref: string; quality: "P" | "S"; note?: string }  // published article, docs page, survey, registry; P/S as in RESEARCH.md
  | { kind: "general"; note?: string; reviewed: boolean }    // GK; reviewed=false blocks release
  | { kind: "design"; note: string; reviewed: boolean };     // DESIGN: a product decision, not a fact

type Score = 1 | 2 | 3 | 4 | 5;
type Level = "none" | "low" | "medium" | "high" | "critical";
type Date = `${number}-${number}-${number}`;               // YYYY-MM-DD

interface ScoreEntry {
  value: Score;
  why: string;              // one line, own words, shown in the comparison table tooltip
  sources: Source[];        // ≥ 1; comparative scores need ≥ 2 independent sources or a rubric metric (§8)
  checked: Date;            // when the evidence was last looked at
  unsourced?: true;         // GK-only extreme held at the neutral 3 until sourced (owner rule 2026-10-24, §8 rule 7)
  proposed?: Score;         // the draft value waiting for a source; only with unsourced
}
```

## 3. Parts and levels (`parts.json`)
A **part** is one slot in the stack. Each part has one or two levels. Level 1 options are **types**; level 2 options are **products**. A product belongs to one or more types.

```json
[
  { "id": "language", "name": "Programming language", "levels": ["product"],
    "help": "The main language for server-side code. Browser code is always JavaScript or TypeScript." },
  { "id": "frontend", "name": "Frontend", "levels": ["type", "product"],
    "typeLabel": "Approach", "productLabel": "Framework",
    "typeCriteria": ["learning-curve", "performance", "seo", "interactivity", "cost"] },
  { "id": "backend",  "name": "Backend",  "levels": ["type", "product"],
    "typeCriteria": ["learning-curve", "productivity", "performance", "scalability", "real-time"] },
  { "id": "database", "name": "Database", "levels": ["type", "product"],
    "typeCriteria": ["learning-curve", "performance", "scalability", "real-time", "data-integrity", "schema-flexibility"] },
  { "id": "hosting",  "name": "Hosting",  "levels": ["type", "product"] }
]
```

### v1 options (decided 2026-10-23, Q4, Q10)
| Part | Types (level 1) | Products (level 2) → their types |
|---|---|---|
| language | — | `typescript-node` (JS/TS on Node.js), `python`, `java` (JVM, incl. Kotlin), `csharp`, `go`, `php` |
| frontend | `static` (pre-built pages), `spa` (single-page app: the browser builds the page), `ssr` (server-rendered pages from a meta-framework, then interactive), `server-templates` (pages rendered by the backend framework), `none` (API only) | `plain-html` → static · `astro` → static, ssr · `react` → spa · `vue` → spa · `svelte` → spa · `angular` → spa, ssr · `nextjs` → ssr, static, spa · `nuxt` → ssr, static · `sveltekit` → ssr, static, spa · `backend-templates` → server-templates |
| backend | `none`, `fullstack` (the frontend framework's own server), `minimal` (small API frameworks), `batteries` (batteries-included: ORM, auth, admin, structure built in) | `frontend-server` → fullstack · `express`, `fastify`, `fastapi`, `gin` → minimal · `nestjs`, `django`, `spring-boot`, `laravel` → batteries · `aspnet-core` → minimal, batteries |
| database | `none`, `relational` (SQL), `document`, `key-value`, `graph` | `postgresql`, `mysql`, `sqlite` → relational · `mongodb` → document · `redis`, `valkey` → key-value · `neo4j` → graph |
| hosting | `static-hosting`, `frontend-platform` (static + serverless functions), `paas` (platform-as-a-service: runs your server or container for you), `cloud` (big cloud providers), `vps` (a rented virtual server you manage) | `github-pages` → static-hosting · `netlify`, `vercel`, `cloudflare` → frontend-platform · `render`, `railway`, `fly-io` → paas · `aws`, `azure`, `gcp` → cloud · `vps` → vps |

`frontend-server` and `backend-templates` are **bridge options**: they mean "this part is handled by the product chosen in another part" (Next.js API routes; Django/Laravel/Thymeleaf/Razor templates). Compatibility rules (§6) tie them to the right partner.

`none` types mean "this part isn't needed". When `none` wins, the part is shown as *Not needed* with the reason, and its products aren't ranked.

## 4. Criteria (`criteria.json`)
One global list. Each criterion says which parts it applies to; a part's score only averages its applicable criteria. All criteria are "higher is better" (e.g. `cost` 5 = cheapest).

| id | Name (user-facing) | Short help | Applies to |
|---|---|---|---|
| `learning-curve` | Easy to learn | How fast a beginner gets productive | all |
| `productivity` | Fast to build with | Built-in features, conventions, generators | language, frontend, backend |
| `performance` | Performance | Speed per request / page under normal load | all |
| `scalability` | Scalability | Handles much more traffic or data by adding resources | backend, database, hosting |
| `ecosystem` | Ecosystem and libraries | Ready-made packages, integrations, tooling | language, frontend, backend, database |
| `community` | Community and hiring | Size of user base, answers online, people you can hire | language, frontend, backend, database |
| `maturity` | Maturity and long-term support | Track record, stable releases, clear support windows | all |
| `cost` | Low running cost | Hosting / licence cost at small-to-medium scale | database, hosting, frontend (type) |
| `type-safety` | Type safety | Mistakes caught before the code runs | language, frontend, backend |
| `real-time` | Real-time support | Live updates (chat, notifications) via WebSockets or similar | backend, database, hosting |
| `seo` | Search engines and first load | Pages readable by search engines and fast to show | frontend |
| `interactivity` | Rich interactivity | App-like behaviour in the browser | frontend |
| `data-integrity` | Data integrity | Transactions, constraints, consistency (important for money) | database |
| `schema-flexibility` | Flexible data structure | Store items with varying fields without migrations | database |
| `ops-effort` | Low operations work | Little to configure, patch, back up and monitor yourself | database, hosting |
| `portability` | Easy to move away | Low vendor lock-in; standard formats and tools | database, hosting |

Shape of an entry (as in the sibling, plus `appliesTo`):
```json
{ "id": "real-time", "name": "Real-time support", "short": "...", "help": "...", "example": "A chat app that shows new messages instantly",
  "appliesTo": ["backend", "database", "hosting"], "visibility": "default", "source": { "kind": "book", "ref": "fosa", "locator": "ch.4" } }
```
**Type-only criteria** (`typeOnlyFor: [partId]`, 2026-11-08): in those parts only the types are scored on the criterion, never the products. Used for the frontend: `seo`, `interactivity` and `cost` describe the rendering approach, and a framework that supports several approaches would otherwise collect the best values of all of them (KB draft §14, §18). Products score every other criterion that applies to their part.

`visibility: "default"` criteria are on the form; `"advanced"` ones are hidden behind "More priorities" (advanced: `portability`, `schema-flexibility`, `interactivity`; decided Q6).

## 5. Options (`options.json`)
```json
{
  "id": "postgresql",
  "part": "database",
  "level": "product",                     // "type" | "product"
  "types": ["relational"],                // products only; ≥ 1
  "name": "PostgreSQL",
  "summary": "Open-source relational database with strong SQL, transactions and JSON support.",
  "status": "active",                     // active | maintenance | deprecated (deprecated → never ranked)
  "licence": { "spdx": "PostgreSQL", "osi": true, "sources": [ ... ] },   // + "publicDomain": true for SQLite (not an OSI licence; Q28)
  "scores": {
    "learning-curve": { "value": 3, "why": "...", "sources": [ ... ], "checked": "2026-10-23" },
    "data-integrity": { "value": 5, "why": "...", "sources": [ { "kind": "book", "ref": "mpg17", "locator": "ch.2" }, { "kind": "book", "ref": "ddia", "locator": "ch.7" } ], "checked": "2026-10-23" }
    // one entry per criterion that applies to this part (validated)
  },
  "facts": [
    { "kind": "version", "text": "Current major: 18 (18.6)", "checked": "2026-10-23", "sources": [ { "kind": "ref", "ref": "eol" } ] },
    { "kind": "support", "text": "PostgreSQL 18 supported until 2030-11", "until": "2030-11-14", "checked": "2026-10-23", "sources": [ { "kind": "ref", "ref": "eol" } ] }
  ],
  "strengths": ["..."], "weaknesses": ["..."], "goodWhen": ["..."], "avoidWhen": ["..."],
  "freeTier": null,                       // hosting products (required, null = none): { "summary": "...", "commercialUse": true|false|"unknown", "checked": "..." }
  "aliases": ["postgres", "pg", "psql"],  // matched against notes (glossary-style)
  "links": { "docs": "https://www.postgresql.org/docs/" }
}
```
Validation rules (integrity checks, like the sibling's):
- every product scores **every** criterion that applies to its part, and every type (except `none`) scores every criterion in its part's `typeCriteria`; values are integers 1–5; each score has ≥ 1 source and a `checked` date;
- every product lists ≥ 1 type, and each type exists in the same part;
- each part has exactly one `none` type at most, and `none` types have no products;
- `licence.osi` is set for every product (a product with no licence of its own, such as plain HTML or the bridge `backend-templates`, has `notAPackage: true`: allowed under "open source only", no badge); `freeTier.commercialUse` is set for every hosting product;
- `deprecated` options are referenced by nothing except the glossary.

Types are scored only on their part's **fit criteria** (`parts.json` → `typeCriteria`), never on popularity, ecosystem, cost or lock-in, which describe a product, not a category. Without this, niche but well-fitting categories (graph databases) could never win (calibration finding 1, `KNOWLEDGE_BASE_DRAFT.md` §5). Database fit criteria: `learning-curve`, `performance`, `scalability`, `real-time`, `data-integrity`, `schema-flexibility`. Backend fit criteria: `learning-curve`, `productivity`, `performance`, `scalability`, `real-time` (`type-safety` depends on the language, so it is product-only). `none` types have no scores; they are chosen only by a `not-needed` rule. Situation rules (§7) do most of the type choice.

## 6. Compatibility (`compatibility.json`)
Relation kinds between options in **different parts**. Conditions use the same tiny language as rules (§7).

**As implemented (2026-11-08, Part 5):** every relation is `{ id, kind, option, part, anyOf, when?, explanation, sources }`, where `when` is an optional rule condition (e.g. only when the budget is free only). Kinds: `requires` and `conflicts` (hard filters during assembly), `note` (shown under the stack when the pair is in it, `stack.relationNotes`) and `penalty` (the stack pays `points`; K9 uses it, with `highMaturityPoints` and a `fact` id: the penalty applies only while that `release-status` fact says beta). `worksBestWith` since 2026-11-09: `points` 1 to 3 (schema-checked; penalties ≤ 0; other kinds carry no points), the stack's total pairing bonus is capped at `caps.stackPairBonus` (6). Two pairings so far, each sourced to the project's own docs: `C-nextjs-vercel` +2 (Vercel makes Next.js) and `C-django-postgresql` +1 (`django.contrib.postgres`). The result shows a matched pairing under Things to know as "Goes well together".

| Kind | Meaning | Engine effect | Example |
|---|---|---|---|
| `requires` | A only works if the other part is one of X | Hard filter during stack assembly; the option is labelled "needs: Python" when the stack doesn't match | `django` requires language `python`; `frontend-server` requires frontend ∈ {`nextjs`, `nuxt`, `sveltekit`, `astro`}; `github-pages` requires backend `none` |
| `conflicts` | A and B can't be used together | Hard filter | `netlify` conflicts with language `java`, `csharp`, `php` (Netlify Functions run JS/TS and Go: GK, verify); `github-pages` conflicts with any backend; `plain-html` conflicts with backend `frontend-server` |
| `worksBestWith` | A known good pairing | Small bonus to the **stack** score (+1 to +3, total capped at +6); shown as "goes well with" | `nextjs` + `vercel` (first-party support); `laravel` + `mysql`; `django` + `postgresql` (Django's PostgreSQL-only extras) |

```json
{ "id": "C-django-python", "kind": "requires", "option": "django", "when": { "eq": ["language", "python"] },
  "explanation": "Django is a Python framework.", "source": { "kind": "ref", "ref": "django-docs" } }
{ "id": "C-nextjs-vercel", "kind": "worksBestWith", "options": ["nextjs", "vercel"], "points": 2,
  "explanation": "Vercel builds Next.js and supports its features first.", "source": { "kind": "ref", "ref": "vercel-docs" } }
```
Source ids such as `django-docs` and `vercel-docs` are placeholders: each gets a row in `references/INDEX.md` when the KB entry is written (Phase 1).

A `requires` relation **fails when the required part isn't in the stack** (2026-11-08): `backend-templates` needs a backend, so it can never be picked when the backend is not needed. Frontend relations: `frontend-server` requires frontend ∈ {`nextjs`, `nuxt`, `sveltekit`, `astro`}; `backend-templates` requires backend ∈ the nine server frameworks.

Language requirements are written once on each backend/frontend product as `requires` relations; the frontend always runs JavaScript/TypeScript in the browser, so frontend products only constrain the language when they also provide the backend (`frontend-server` → `typescript-node`).

Fairness note: `worksBestWith` bonuses are small on purpose. A vendor's own product working best on its own platform is a fact, but it must not decide the stack.

## 7. Rules (`rules.json`)
Same idea as the sibling: **rules are data**, interpreted by the engine. Condition operators: `eq`, `in`, `has` (a multi-select answer contains a value), `all`, `any`, `not`, `gte` (weight levels are ordered). Paths: `q.<questionId>` (form answers), `skill.<languageId>`, `locked.<partId>`, `style` (Architecture Advisor style id), `weight.<criterionId>` (effective level after floors, step 2), `part.<partId>` (`needed` / `not-needed`, after pass 1; used by S9), `fact.<optionId>.<factId>.status` (a dated fact, e.g. a beta flag).

Effect types:
| Effect | Meaning |
|---|---|
| `modify` | Add points (0–100 scale) to an option. Summed per option, capped ±30 (rules bucket) |
| `exclude` | Remove an option; listed under "Ruled out because…" with the rule's explanation |
| `floor` | Raise a criterion's minimum importance |
| `not-needed` | Mark a part as not needed (its `none` type wins; products not ranked) |
| `note` | No score change; adds a message and an AI hint |
| `keep-type` | `part` + `target` (a type of that part): the stack takes that part's product from this approach while one of its products is ranked; a lock still wins (B2, owner 2026-11-10, SCORING_ENGINE step 6.1) |

Every rule has `id`, `name`, `explanation` (shown when it fires), `source`, and optionally `otherwise` + `otherwiseExplanation`. Rule ids: `S…` situation, `D…` data shape, `B…` backend, `K…` constraint, `A…` architecture-style link, `N…` notes. Team-skill rules live in `skills.json` (§7.4).

### 7.0 Form questions (`questions.json`)
Every question has "Not sure". Ids are the `q.` paths used by rules. Since Phase 3 (2026-11-09) each question also carries its form copy: `labels` (one plain-language label per option, required; an integrity check fails on a missing or extra label), optional `hints` (a short example under an option, shown as a radio card) and optional `help` (one line under the question). Copy only: the engine never reads them.
| id | Asks | Options (short) |
|---|---|---|
| `app-kind` | What are you building? | content/marketing site, portfolio, interactive web app, API only, e-commerce, internal tool / dashboard, backend for a mobile app |
| `traffic` | Expected users and growth | tiny, small and stable, growing, large, spiky |
| `data-shape` | What does your data look like? | linked records, self-contained documents, highly connected, simple lookups, no stored data |
| `data-flags` | Extra data facts (multi) | fields vary a lot, money / strict consistency, single user / offline, many people save data at the same moment (`many-writers`: e.g. bookings, live collaboration; added 2026-10-25 for D9) |
| `real-time` | Live updates needed? | yes / no |
| `seo` | Must pages be found by search engines? | yes / no |
| `team-size`, `experience` | Team | solo, 2–5, 6–15, 16+; beginner, some, experienced |
| `budget` | Monthly budget for running it | free only ($0), small paid (up to about $25), moderate (about $25–$100), comfortable (more than $100); amounts are form copy (Q36), rules only test `free-only` |
| `deadline`, `lifespan` | Time | very tight (< 1 month), tight, relaxed; prototype, 1–3 years, 5+ years |
| `commercial` | Is this a commercial project? (Q15) | yes / no |
| `hosting-rule` | Hosting constraint | none, must self-host, must use AWS / Azure / Google Cloud |
| `open-source-only` | Only OSI open-source licences? (Q16) | yes / no |

Team skills, known frameworks, goal, locks (Q12) and the optional style come from their own form sections (`SCORING_ENGINE.md` step 1).

### 7.1 Situation rules (examples)
| id | When | Effect | Source |
|---|---|---|---|
| S1 | app kind = content site or portfolio | frontend `static` +20; `seo` floor high (backend and database become not needed through B0 and D8 when nothing is stored; a `none` type has no score to add points to) | `ref:web-rendering` |
| S2 | app kind = API only | frontend `not-needed` | DESIGN |
| S3 | app kind = interactive web app, SEO not important | frontend `spa` +10 | `ref:web-rendering` |
| S4 | SEO = yes and app kind ∈ {web app, e-commerce} (pages change per user/request) | frontend `ssr` +15, `spa` −10 | `ref:web-rendering` |
| S5 | real-time = yes | `real-time` floor high | `book:fosa ch.4` |
| S6 | deadline very tight | `productivity` floor high; backend `batteries` +5 for teams that already know one (via skills) | DESIGN |
| S7 | traffic = spiky or large | `scalability` floor high | `book:fosa ch.4` |
| S8 | lifespan 5+ years | `maturity` floor high | DESIGN |
| S9 | backend part is not needed (or its `none` type wins) | language `not-needed` ("the frontend uses HTML, CSS and JavaScript; no server language needed") | DESIGN |
| S10–S16 | frontend rules added with Part 4 (2026-11-08): content site with stored data, backend team without JS/TS, no backend → no server pages, SEO floor, interactivity floor for apps, B2's frontend side, content pages without hydration | see KB draft §17 | `ref:web-rendering`, DESIGN |

### 7.2 Data-shape rules (`ddia` ch.2, `sixstep`)
| id | When (q.data-shape / flags) | Effect |
|---|---|---|
| D0 | data shape "Not sure" | `relational` +10, with the reason shown (`ddia` ch.2: data tends to become more interconnected as features are added) |
| D1 | linked records (many-to-one, many-to-many) | database `relational` +15, `document` −10 (`ddia` ch.2: joins; `sixstep` ch.1: entity–relationship data) |
| D2 | self-contained documents loaded as a whole | `document` +15; note: "PostgreSQL's JSONB also stores documents" (`ddia` ch.2 convergence; `mpg17`) |
| D3 | highly connected (friends of friends, recommendations) | `graph` +20, `document` −30 (`ddia` ch.2: the document model handles many-to-many relationships poorly; graph models most natural). −30 is the smallest round value that keeps document from ever being #1 on this input, under any weights (owner 2026-10-24; KB draft §5 session 3) |
| D4 | fields vary a lot between items / change often | `schema-flexibility` floor high (`ddia` ch.2 schema-on-read) |
| D5 | money or strict consistency | `data-integrity` floor critical; `document` −5 |
| D6 | single user / offline / embedded / very small | `sqlite` +15; note on backups (GK, verify with sqlite.org "appropriate uses") |
| D7 | only simple lookups / cache / sessions | `key-value` +15 · **otherwise** `key-value` −20 ("most apps use a key-value store *next to* a main database") |
| D8 | no stored data | database `not-needed` |
| D9 | not single user **and** (traffic large or spiky **or** many people save data at the same moment) | `sqlite` −15 (one writer at a time, one server). Commercial or not. `ref:sqlite-whentouse` (owner Q30, 2026-10-25) |

### 7.3 Constraint rules
| id | When | Effect | Source |
|---|---|---|---|
| K1 | commercial = yes **and** budget = free only | exclude `vercel` (Hobby is non-commercial) | `ref:vercel-docs` (S, verify Q21) |
| K1b | app kind ∈ {e-commerce, web app} **and** commercial = yes | exclude `github-pages` (not allowed for online businesses, e-commerce or commercial SaaS); for other commercial sites: note | `ref:github-docs` "GitHub Pages limits" (P, 2026-10-23) |
| K2 | commercial = yes, budget > free | `vercel` note: "needs the paid Pro plan for commercial use" | same |
| K3 | must self-host / on-premises | exclude all `frontend-platform`, `paas`, `cloud` products except where the provider offers on-prem (none in v1) | DESIGN |
| K4 | must use cloud X | lock hosting to X (as if the user locked it) | DESIGN |
| K5 | budget = free only | exclude hosting products with no lasting free tier (`railway`, `fly-io` for new accounts, `vps`); note cloud free tiers expire | RESEARCH §4 (S) |
| K6 | open-source licences only | exclude products with `licence.osi = false` unless `licence.publicDomain` (e.g. `mongodb` SSPL is excluded; `sqlite` public domain is allowed and its badge says "public domain", not OSI: owner Q28, 2026-10-24); note: Redis 8 can be used under AGPLv3, Valkey is BSD. Helpers: `isOpenSourceAllowed`, `licenceBadge` | RESEARCH §2 (P) + owner |
| K7 | real-time = yes | `netlify` −15 (Netlify Functions don't hold WebSocket connections). `vercel`: **no penalty**, note: "WebSockets work on Vercel Functions, but each connection stays on one instance; to send a message to everyone you need a pub/sub service such as Redis/Valkey" | RESEARCH §4b (P + S, 2026-10-23; owner Q24) |
| K8 | backend is a separate server framework (Spring Boot, ASP.NET Core, Laravel, Django, ...) | `static-hosting` excluded | GK |
| K12 | budget = free only | `render` −5: Free web services sleep after 15 minutes without traffic and take about a minute to wake (Q34, 2026-11-09) | render.com/docs/free (P) + DESIGN for the points |
| K9 | the stack only works on a hosting product through a feature whose `release-status` fact says **beta** (e.g. Java/C#/PHP on Vercel via its container runtime) | that hosting product −5, or **−10 when `weight.maturity` ≥ high** (set by the user, or by S8 when lifespan is 5+ years); note "uses a beta feature (status checked on <date>)". The rule reads the fact, so marking the feature GA switches it off, and the 90-day stale window forces a re-check | DESIGN (owner Q26, 2026-10-24) + RESEARCH §4b |
| K10 | relation `C-sqlite-hosting`: database `sqlite` with a hosting product whose server has **no persistent local disk** (filesystem reset on restart/redeploy, or one per request) or that runs **several instances** of the app | conflict (SQLite can't keep its file or be shared); where a persistent disk exists but only on one instance, a warning note. Per product in RESEARCH §4c | `ref:host-docs` (P, 2026-10-25) + `ref:sqlite-whentouse` (owner Q30) |

As implemented (Part 5, 2026-11-08; KB draft §22): K1 and K1b as above plus **K1c** (other commercial sites: a note on GitHub Pages' terms); K3 also excludes the other hosting types; K4 is three rules (K4 AWS, K4b Azure, K4c Google Cloud) that exclude every other provider and type; **K5** keeps Railway out although it now has a Free plan ($1 of usage a month: a few days of a small server); K6 lists its exclusions explicitly and a unit test keeps the list equal to every product that `isOpenSourceAllowed` rejects; K8 excludes the `static-hosting` type when the backend is needed; **K9** and **K10** are relations (§6). Hosting situation rules S17–S21 are in KB draft §22.

### 7.3b Backend rules (KB draft §9)
| id | When | Effect | Source |
|---|---|---|---|
| B0 | app kind ∈ {content site, portfolio} and no stored data | backend `not-needed` | DESIGN |
| B1 | app kind ∈ {API only, mobile backend} | exclude backend type `fullstack` | DESIGN |
| B2 | deadline very tight, team ≤ 5, TS/JS skill some/strong, app kind ∈ {web app, e-commerce, internal tool} | `fullstack` +20; `minimal`, `batteries` −15 | DESIGN |
| B3 | real-time and `frontend-server` in the stack | note on WebSocket support per frontend framework | `ref:fw-repos` |

### 7.4 Team-skill rules (`skills.json`)
Input (decided Q11): `skills: { [languageId]: "none" | "some" | "strong" }`, `knownFrameworks: optionId[]` and `goal: "ship" | "learn"`. Starting values (DESIGN, tune in calibration):

| id | When | Effect |
|---|---|---|
| T1 | language skill = strong | language +20; every backend/frontend product that *requires* that language +10 |
| T2 | language skill = some | language +10; products requiring it +5 |
| T3 | framework known | that product +10 |
| T4 | deadline tight or very tight, and the team knows ≥ 1 language at some/strong | languages with skill `none` −10 |
| T5 | goal = learn something new | T1–T4 effects halved; `learning-curve` floor medium |
| T6 | goal = "Use what we know" and a language at skill **strong** | hard rule: a strongly known language never ranks below, and the stack never picks, a language nobody knows, unless a rule excludes it (owner 2026-10-24; `book:fosa ch.19`) |

Skill effects go into their own bucket, capped to **−10…+25** per option, separate from the ±30 rules bucket, so "the team knows Java" can count a lot without being cancelled out by unrelated rules. Source: `book:fosa ch.19` (team and organisational factors) + DESIGN.

### 7.5 Architecture-style link (optional input `style`, sibling style ids)
Small nudges only (±5 to ±10), because the style describes structure, not tools.
| id | When | Effect | Source |
|---|---|---|---|
| A1 | style ∈ {microservices, service-based, cell-based} | hosting `paas`, `cloud` +5; backend `frontend-server` −10; note: "one database per service is common" | `book:fosa ch.18` |
| A2 | style = serverless | hosting `frontend-platform`, `cloud` +10 | `book:fosa` (implemented 2026-11-08) |
| A3 | style ∈ {layered, modular-monolith} | backend `batteries` +5 | `book:fosa ch.10–11` |
| A4 (not in the KB yet) | style = event-driven | note: "you will also need a message broker (not ranked in v1)" | `book:fosa ch.15` |

**Style ids (2026-11-09):** `meta.json` `architectureStyles` lists Architecture Advisor's 13 style ids and names, copied from its knowledge base v1.2.0 (`styles.json`, checked 2026-11-09). The integrity check rejects a rule condition on an unknown style; the engine rejects an unknown `input.style`; the app ignores an unknown `?style=` and says so. When the sibling adds or renames a style, update this list. No `kbVersion` bump: the list changes no score or result.

## 8. Fairness and sourcing rules
1. **Source tags as in the sibling:** `book:<id> <locator>`, `ref:<id>`, `GK` (general knowledge, needs review), `DESIGN`.
2. **Comparative scores** (anything that says A is better than B) need **two independent sources** *or* a written rubric based on a public metric (below). One source isn't enough.
3. **Vendor sources only for their own facts.** A vendor's page may prove its own feature, limit, licence or version. It may not be used as evidence that it beats a rival (e.g. a database company's benchmark against competitors).
4. **Popularity isn't quality.** Survey usage feeds only `community` (and the hiring part of it). "Admired"/satisfaction numbers can inform `learning-curve` or `productivity` only together with another source.
5. **No novelty bonus.** Newer isn't better; `maturity` explicitly rewards track record. A tool that is popular in surveys of enthusiasts (e.g. State of JS) is cross-checked with a broad survey (Stack Overflow, JetBrains).
6. **Rubrics** (draft; finalise in Phase 1, Q20):
   | Criterion | Rubric |
   |---|---|
   | `community` | Stack Overflow survey usage share within its category: ≥ 40% → 5, 20–40% → 4, 10–20% → 3, 4–10% → 2, < 4% → 1; ± 1 if JetBrains disagrees strongly |
   | `maturity` | Years since 1.0 and support policy: ≥ 10 y with published LTS/support windows → 5 … < 2 y or 0.x → 2 (FastAPI is still 0.x but widely used: score 3–4 with reason) |
   | `type-safety` | Static types enforced by the compiler → 5; optional static types widely used (TypeScript, Python type hints) → 3–4; none → 1–2 |
   | `performance` | TechEmpower bands (rough signal only, never alone) + a second source |
   | `cost` (hosting) | Free tier fit for a small app and price of the first paid step |
   | `productivity` (backend) | Built-in or first-party building blocks out of 8 (KB draft §6) |
   | `real-time` (backend) | First-party WebSockets with group broadcasting → 5 … third-party only → 2 (KB draft §6) |
   | `community` (backend) | Own bands: ≥ 15% → 5 … < 2% → 1 (usage shares are lower than for databases; KB draft §6) |
   | `cost` (database) | Free under an OSI or public-domain licence with every feature a small app needs → 5 · a free edition with limits (licence limits on offering it as a service, paid clustering, memory-bound storage) → 3 (written down 2026-11-09 from the scores' reasons) |
   | `portability` (database) | OSI licence and standard SQL → 5 · OSI licence and a protocol several products implement → 4 · a choice of licences including an OSI one → 3 · a non-OSI licence, or a query language with one main implementation → 2 (written down 2026-11-09) |
   | `real-time` (hosting) | Long-lived WebSocket connections run on the platform → 4 · not possible (static files only, or functions without a WebSocket API) → 1 |
   | `scalability` (hosting) | Automatic horizontal scaling by load on a self-serve plan → 5 · more instances by setting a count → 4 · one instance or soft limits → 3 · one server you resize by hand → 2 (vendors' own docs, KB draft §24, Q34) |
   | `ecosystem` (frontend) | npm packages with the library's keyword (registry search): ≥ 100k → 5 · 25k–100k → 4 · 5k–25k → 3 · 1k–5k → 2; a meta-framework counts its base library's (KB draft §24, Q33) |
   | `ecosystem` (language) | Packages in the language's main registry, all counted by libraries.io (one method for npm, PyPI, Go, Maven, NuGet, Packagist; Go publishes no count of its own): ≥ 2M → 5 · 500k–2M → 4 · 100k–500k → 3 · 20k–100k → 2 · < 20k → 1. Bands four times apart, so only large differences count; the registries' own counts are a cross-check (KB draft §25, Q32 option b) |
   | `ops-effort` (hosting) | Upkeep jobs the provider does for you, of four: servers and OS (NIST SP 800-145 PaaS vs IaaS), HTTPS certificates, deploy on git push without your own CI file, restarts. All four → 4 · three → 3 · two or fewer → 2 (KB draft §26) |
   | `portability` (hosting) | A standard artefact another host runs unchanged (static files, OCI image, plain Linux server) → 4 · standard code with the platform's own function API, runtime or config → 3 · built from the provider's own managed services → 2 (KB draft §26) |
   | `learning-curve` (hosting) | The vendor's own quick start: Git import in the dashboard → 4 · a CLI first, or a runtime unlike standard Node.js → 3 · IAM, networking or a server before the first deploy → 2 (KB draft §26) |
   | `productivity` (language) | No fair public metric: every language held at 3 (KB draft §26; the framework's built-in features are scored on the backend part) |
   | Every other criterion | Written rubrics for the last GK scores (session 17): backend learning-curve, scalability, type-safety split; backend ecosystem held at 3; frontend learning-curve (MDN layers, framework deductions); database ecosystem (npm keyword), real-time, schema-flexibility, ops-effort, scalability, learning-curve; hosting maturity and performance; type scores as the median of their products. Full text in each score's DESIGN source and KB draft §27 |
   | `productivity` (frontend) | Routing, data loading and more built in or official → 4 · a UI library whose own docs point to a separate framework → 3 (Q33) |
7. **Fairness lint (tested, 2026-11-09):** a comparative score (2 or more away from the median of its part, level and criterion) whose only evidence is the vendor's own documentation must also cite one of the rubrics above (a DESIGN source naming it); otherwise `tests/kb` fails. A vendor proves its own fact, the rubric turns the fact into a score the same way for every rival.
8. **A score of 5 or 1 needs a `book:` or `ref:` source** (owner, 2026-10-24). Until then it is stored as 3 with `unsourced: true` and its `proposed` value; the release gate fails while any remain. Enforced by `tests/kb`.

## 9. Stale facts
Tech facts age fast. Every `ScoreEntry` and every `facts[]` item has `checked`.

| Fact kind | Stale after | Examples |
|---|---|---|
| `pricing` (free tiers, limits) | 90 days | Vercel Hobby caps, Render sleep time |
| `release-status` (beta / GA of a feature) | 90 days | Vercel container runtime: beta (owner Q26: a beta penalty must not outlive the beta) |
| `version` | 180 days | "Current major: Spring Boot 4.1" |
| `support` | 180 days, or immediately when `until` has passed | EOL dates from endoflife.date |
| `licence`, `ownership` | 365 days | MongoDB SSPL, Astro team acquired by Cloudflare |
| score evidence | 365 days | survey-based `community` scores |

Windows live in `meta.json` (`staleAfterDays`) so they're data. How they're enforced:
- **The engine never reads the clock.** Staleness is checked by tests and the build, and the UI compares `checked` with today's date only for display.
- `npm run kb:stale` lists overdue facts. In development: warning. **Release gate:** the production build fails if any fact is more than **2×** its window overdue, or any `support.until` date has passed for the version we describe as current.
- The UI shows "checked on <date>" in the comparison table, and a "may be out of date" badge for overdue facts.
- A refresh session (every 3 months, decided Q7) re-checks overdue facts, logs changes in `docs/RESEARCH.md`, and bumps `kbVersion`.
- An option whose project is abandoned or deprecated gets `status: "deprecated"` and moves to the glossary.

## 10. Bundles and glossary
- **`bundles.json`, implemented 2026-11-09:** 7 bundles (MERN, MEAN, PERN, LAMP, T3, Django + PostgreSQL, Spring Boot + Angular), validated by `bundleSchema` and the integrity check (each pick is a product of its part). `buildRecommendation` lists a bundle when the stack matches all its parts, or all but one for a bundle of four or more parts; the result shows it under "Things to know" (and in the Markdown). Never changes a score or pick (tested). G5 is the T3 stack.
- `bundles.json`: well-known stacks (MERN, LAMP, T3, Django + PostgreSQL, Spring + Angular) with a one-line description and their option ids. Shown as "This is close to the well-known X stack". **Not ranked** (same reasoning as sibling ADR-007).
- **`glossary.json`, implemented 2026-11-09:** 18 entries (WordPress, Firebase, Supabase, Ruby on Rails, Bun, Deno, ORM, Prisma, Drizzle, SQLAlchemy, SSR, SPA, Docker, Kubernetes, GraphQL, Tailwind CSS, mobile app frameworks, Flask), each `{ id, name, kind, aliases, answer, related, sources }`. Options may carry `aliases` too ("postgres", "golang", "c#"); an option is also matched by its name and id when 3+ characters and not an everyday word (render, express, railway, astro are matched only through explicit aliases). `matchMentions(notes, kb)` (pure, `knowledge-base/mentions.ts`, adapted from the sibling): whole-word, longest alias first, at most 4, in order of appearance. The integrity check rejects an alias claimed by two items. The result shows "You mentioned" with the KB's answers (with or without AI), and the AI must answer each matched item (AI_INTEGRATION §4).
- `glossary.json`: things users mention that we don't rank: CMSs (WordPress), backend-as-a-service (Firebase, Supabase), Python dashboard tools (Streamlit, Dash), runtimes (Bun, Deno), ORMs (Prisma, Drizzle, SQLAlchemy, Hibernate), terms (SSR, SPA, ORM, ACID). Matched against notes with the sibling's alias matcher (longest alias first, max 4).

## 11. meta.json
```json
{
  "kbVersion": "0.1.0",
  "scale": { "min": 1, "max": 5 },
  "levels": { "none": 0, "low": 1, "medium": 2, "high": 3, "critical": 5 },
  "caps": { "rules": 30, "skillsMin": -10, "skillsMax": 25, "stackPairBonus": 6, "ai": 5 },
  "closeCallPoints": 5,
  "staleAfterDays": { "pricing": 90, "release-status": 90, "version": 180, "support": 180, "licence": 365, "ownership": 365, "score": 365 },
}
```
