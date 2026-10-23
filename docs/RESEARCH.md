# Research log

Facts that change (versions, support dates, licences, free tiers, survey numbers), with where they came from and when they were checked. The knowledge base (Phase 1) copies these into `facts[]` entries with the same `checked:` date. **Re-check before using anything older than its stale window** (`KNOWLEDGE_BASE_SCHEMA.md` §9).

Source quality marks:
- **P** = primary source read directly (registry, official repo, release data).
- **S** = secondary only (search-result summaries, third-party blogs). Must be confirmed from a primary source in Phase 1 before it becomes a KB fact. Listed in `OPEN_QUESTIONS.md` Q21.

## How research works from a cloud session (2026-10-23)
- **Reachable:** GitHub (clone and `raw.githubusercontent.com`), npm registry, PyPI, Packagist, Maven Central, Go module proxy, NuGet, web search.
- **Blocked** (DNS or proxy refusal, both from `curl` and WebFetch): endoflife.date, survey.stackoverflow.co, vercel.com, render.com, postgresql.org, thoughtworks.com.
- **Work-around for endoflife.date:** its data lives in the public repo `endoflife-date/endoflife.date` (`products/*.md`). A sparse clone of that repo gives the same release and support dates. The copy used below was at the commit of 2026-10-23.

## 1. Versions and support (checked 2026-10-23)
Source: endoflife.date data repo (P) unless noted; latest package versions from the npm / PyPI / Packagist / Maven / Go / NuGet registries (P).

| Item | Current | Support notes |
|---|---|---|
| Node.js | 26.12 (Current, becomes LTS 2026-10-28); 24.22 (LTS) | 24: active support ended 2026-10-20, security until 2028-04-30. 26: until 2029-04-30 |
| Java (Oracle JDK) | 27 (non-LTS, 2026-09-15); 25 (LTS) | 25 supported to 2030-09; 27 until 2027-03 |
| Python | 3.15.1 (2026-10-09) | 3.14 active to 2027-10; 3.13 security-only since 2026-10-01 |
| Go | 1.27.3 | Two newest minors supported (1.27, 1.26) |
| PHP | 8.5.12 | 8.5 active to 2027-12-31; 8.4 active to 2026-12-31 |
| .NET | 10 (LTS, EOL 2028-11-14) | 8 (LTS) and 9 both end 2026-11-10. .NET 11 is at RC2 on NuGet (P); GA date not checked |
| TypeScript | 7.0.2 (2026-07-08, npm) | — |
| React | 19.3.1 (2026-10-14) | — |
| Vue | 3.5.44 | — |
| Angular | 22.2.3 | 21 in LTS to 2027-06-30; 20 ends 2026-11-28 |
| Svelte | 5.57.2 | — |
| Next.js | 16.4.3 (npm, 2026-10-23) | 15 reached EOL 2026-10-21 |
| Nuxt | 4.6.2 | Nuxt 3 EOL 2026-07-31 |
| SvelteKit | 3.1.0 | — |
| Astro | 7.4.2 | Team acquired by Cloudflare (announced 2026-01-16); stays MIT, open governance (S: press release coverage). Licence file in `withastro/astro` is still MIT (P) |
| Express | 5.3.0 | — |
| Fastify | 5.12.7 | — |
| NestJS | 12.2.0 | — |
| Hono | 4.13.13 | — |
| Spring Boot | 4.1.2 (2026-06-30) | OSS support for 4.1 to 2027-07-31; 4.0 to 2026-12-31 |
| Django | 6.1.2 (6.1 released 2026-08-05) | 5.2 is the LTS (to 2028-04-30) |
| FastAPI | 0.162.0 (still 0.x) | — |
| Flask | 3.1.3 | — |
| Laravel | 13.38.0 (13 released 2026-03-17) | Security fixes to 2028-03-17 |
| ASP.NET Core | ships with .NET 10 | — |
| Gin | 1.12.0 (2026-02-28) | — |
| PostgreSQL | 18.6 | 18 to 2030-11; 17 to 2029-11 |
| MySQL | 9.7 (LTS, 2026-04-21); 26.7 (innovation, 2026-07-28) | Version numbering changed to year-based after 9.7. **Confirm on mysql.com** (Q21) |
| SQLite | 3.54.1 | Public domain (GK) |
| MongoDB | 9.0.4 (2026-09-30) | — |
| Redis | 8.10.2 | — |
| Valkey | 9.1.2 | 9.1 supported to 2031-05 |
| ORMs (for a later part) | Prisma (latest tag is an 8.0 RC, odd: re-check), Drizzle 0.45.4, SQLAlchemy 2.1.6, Mongoose 9.11.4 | — |

## 2. Licences (checked 2026-10-23)
| Item | Licence | Source |
|---|---|---|
| MongoDB Community | SSPL v1 (not OSI-approved open source) | `LICENSE-Community.txt` in `mongodb/mongo` (P) |
| Redis 8+ | Your choice of RSALv2, SSPLv1 or AGPLv3 (AGPL is OSI-approved); 7.2 and older stay BSD-3 | `LICENSE.txt` in `redis/redis` (P) |
| Valkey | BSD-3-Clause (Linux Foundation fork of Redis 7.2) | `COPYING` in `valkey-io/valkey` (P) |
| Astro, React, Vue, Angular, Svelte, Next.js, Nuxt, Express, Fastify, NestJS, Hono | MIT | npm metadata (P) |
| TypeScript, Drizzle, Prisma | Apache-2.0 | npm metadata (P) |
| Django, Flask | BSD-3-Clause | PyPI (P) |
| Neo4j Community | GPLv3 (GK) | Not checked; Q21 |

## 3. Usage and popularity surveys
| Source | What we found | Mark |
|---|---|---|
| Stack Overflow Developer Survey **2026** (published 2026-10-06, 30,903 responses, 169 countries) | Databases: PostgreSQL 57.9%, SQLite 42.1%, MySQL 35.1%. PostgreSQL also top for "admired" (62.3%) and "desired" (43.9%). Languages: JavaScript 62.0%, SQL 58.4%, HTML/CSS 58.2%, Python 58.0% | S (search snippets of the survey pages and the SO blog; the survey site itself is blocked) |
| Stack Overflow 2026, web frameworks | **Not found yet.** 2025 figures (secondary): Node.js 49.1%, React 46.9% | S |
| State of JS 2025 (results ~March 2026) | Secondary sources conflict on satisfaction numbers (e.g. Svelte 86% vs 91% retention). **Not usable until read on stateofjs.com** | S |
| Thoughtworks Technology Radar | Latest found: Vol. 34, April 2026 (PDF on thoughtworks.com) | S (site blocked) |
| JetBrains State of Developer Ecosystem | Not checked this session | — |

Vendor-run comparisons (e.g. a database company benchmarking itself against rivals) were not used. See the fairness rules in `KNOWLEDGE_BASE_SCHEMA.md` §8.

## 4. Hosting free tiers (all **S**, checked 2026-10-23; vendor pages blocked)
These matter for two rules: "free-only budget" and "commercial project". Every number here must be confirmed from the vendor's own page before it becomes a KB fact.

| Provider | Free tier as reported | Notes |
|---|---|---|
| Vercel Hobby | Free, **non-commercial personal use only**; hard caps (pauses instead of billing). Reported caps vary by source (e.g. ~100 GB transfer, ~1M function invocations, ~4 h active CPU per month) | Pro is $20/seat/month |
| Netlify Free | 300 credits/month, hard cap; all sites pause when used up (accounts created since Sept 2025; older accounts keep the bandwidth/minutes model) | Per-action credit costs differ between sources |
| Render Free | Web services sleep after 15 min with no HTTP request **or WebSocket message** (Feb 2026 change); ~1 min to wake; 750 instance hours/month; free Postgres 1 GB, expires 30 days after creation (+14-day grace) | Render docs: free instances not for production |
| Railway | No lasting free tier: one-time trial credit; sources conflict on details | — |
| Fly.io | Free allowance only for orgs created before Oct 2024; new accounts get a short trial | — |
| Cloudflare Workers / Pages | Workers ~100,000 requests/day; Pages 500 builds/month; R2 10 GB. Sources disagree on the CPU-time cap | Commercial use allowed (GK, verify) |
| Supabase Free | Projects pause after 7 days without activity; 500 MB database; 2 active projects | Relevant if we later suggest database hosting (Q18) |
| AWS / Azure / GCP | Not checked this session (AWS changed its free tier in 2025, GK: verify) | Q21 |
| GitHub Pages | Not checked (GK: free for public repos, static only, not meant for commercial SaaS) | Q21 |

## 5. Reference books: what they give the KB
Summaries in our own words; cite by chapter, never quote at length.

| id | Useful for |
|---|---|
| `ddia` ch.2 | Choosing a **database type** from the shape of the data. Document model fits tree-shaped, one-to-many data loaded as a whole (locality, schema flexibility). Relational fits many-to-one and many-to-many relationships (joins). Highly interconnected data fits graph models best. "Schema-on-read" vs "schema-on-write" is like dynamic vs static typing; neither is always right. Relational databases with JSON support are converging with document databases. |
| `ddia` ch.5–9 | Replication, partitioning, transactions, consistency: background for `scalability` and `data-integrity` scores of database products. 1st ed. (2017): check the 2nd ed. (2026) changes online. |
| `fosa` ch.4–6, 18, 19 | Ch.4–6: definitions for criteria (performance, scalability, elasticity) and "least worst trade-off" thinking. Ch.18 (microservices): a database per service, heavy reliance on automation and containers; background for the Architecture Advisor style link. Ch.19: team and organisational factors count when choosing. The repo copy is the **German translation** of the 2nd ed.; chapter numbers match the English edition. |
| `mpg17` | PostgreSQL features that reduce the need for a second database: JSON/JSONB, rich index types, extensions, logical replication. Book is about one product: use for facts about PostgreSQL only, not for comparative scores (§8 fairness rule). |
| `sixstep` | When relational modelling fits: data that can be described as entities with attributes and relationships (the book's step-by-step E-R → relational process). Supports the "linked records" data-shape rule. |
