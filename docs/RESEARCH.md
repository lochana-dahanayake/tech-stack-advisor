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
| MySQL | 9.7 (LTS, 2026-04-21); 26.10.0 (newest tag) | Year.month numbering after 9.7: tags `mysql-26.7.0` and `mysql-26.10.0` exist in `mysql/mysql-server` (P, checked 2026-10-23). LTS policy for the new scheme still to confirm on mysql.com |
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
| Neo4j Community | GPLv3 | `LICENSE.txt` in `neo4j/neo4j` (P) |

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
| Cloudflare Workers / Pages | **Workers Free: 100,000 requests/day, 10 ms CPU time per request, 128 MB memory per isolate (P: `cloudflare/cloudflare-docs`, `workers/platform/limits.mdx`).** Pages 500 builds/month; R2 10 GB (S) | Commercial use allowed (GK, verify) |
| Supabase Free | **Pauses Free-plan projects with low database activity over 7 days; warning email about a week before; paid plans never auto-pause (P: `supabase/supabase` docs, `free-project-pausing.mdx`).** 500 MB database, 2 active projects (S) | Needed for v1.1 (Q13) and database-hosting notes (Q18) |
| AWS / Azure / GCP | Not checked this session (AWS changed its free tier in 2025, GK: verify) | Q21 |
| GitHub Pages | **Not allowed as free hosting for an online business, e-commerce or commercial SaaS; published site ≤ 1 GB; soft bandwidth limit 100 GB/month (P: `github/docs`, `github-pages-limits.md`).** Static only (GK) | Rule K1b |

## 4b. Real-time and runtimes on frontend platforms (session 2, checked 2026-10-23)
Owner asked (Q24) to re-check WebSocket support. Vendor sites are still blocked, so evidence comes from the vendors' own packages and repos (P) plus search summaries of their changelogs (S).

| Item | Finding | Mark |
|---|---|---|
| Vercel WebSockets | **Supported.** Public beta 2026-06-22 (Node.js, incl. Socket.IO), Python Functions 2026-07-23 (ASGI/WSGI: FastAPI, Django, Flask), **generally available 2026-10-20**; same limits and pricing as other function invocations | S (changelog titles and summaries) |
| | `@vercel/functions` 3.10.3 (npm, 2026-10-22) exports a stable `upgradeWebSocket()` (plus the older `experimental_upgradeWebSocket`) | P |
| | Caveat: connections are pinned to one instance; no built-in broadcast to connections on other instances, so a chat app needs a pub/sub service (e.g. Redis/Valkey or a hosted real-time service) | S (Vercel docs as quoted in summaries) |
| | Duration limits per plan (one source: 5 min default) | S, from a competitor's article (Ably); not used |
| Netlify WebSockets | **Not supported** by Netlify Functions. The current `@netlify/functions` 6.0.3, `@netlify/edge-functions` 4.0.3 and `@netlify/runtime` 5.0.10 (npm, 2026-10-20/21) contain no WebSocket API; Netlify "durable functions" (2026) extend run time but don't hold connections | P (absence in packages) + S |
| Vercel runtimes | `vercel/vercel` repo has runtime packages for Node.js, Python, Go, Ruby, Rust, plus presets for Express, Fastify, NestJS, Hono, Koa and others | P (repo, commit 2026-09-08) |
| Vercel containers | `packages/container` builds a `Dockerfile.vercel` / `Containerfile.vercel` into an image and runs it as a function. Reported as **beta on all plans**, Hobby functions up to 300 s | P (code) + S (status, plans, limits) |

Consequences for the KB: rule K7 (real-time penalty) applies to Netlify only; Vercel gets a broadcast note; the Vercel–Java/C#/PHP conflict becomes "allowed via container runtime (beta)", rule K9 (Q26, decided 2026-10-24).

## 5. Reference books: what they give the KB
Summaries in our own words; cite by chapter, never quote at length.

| id | Useful for |
|---|---|
| `ddia` ch.2 | Choosing a **database type** from the shape of the data. Document model fits tree-shaped, one-to-many data loaded as a whole (locality, schema flexibility). Relational fits many-to-one and many-to-many relationships (joins). Highly interconnected data fits graph models best. "Schema-on-read" vs "schema-on-write" is like dynamic vs static typing; neither is always right. Relational databases with JSON support are converging with document databases. |
| `ddia` ch.5–9 | Replication, partitioning, transactions, consistency: background for `scalability` and `data-integrity` scores of database products. 1st ed. (2017): check the 2nd ed. (2026) changes online. |
| `fosa` ch.4–6, 18, 19 | Ch.4–6: definitions for criteria (performance, scalability, elasticity) and "least worst trade-off" thinking. Ch.18 (microservices): a database per service, heavy reliance on automation and containers; background for the Architecture Advisor style link. Ch.19: team and organisational factors count when choosing. The repo copy is the **German translation** of the 2nd ed.; chapter numbers match the English edition. |
| `mpg17` | PostgreSQL features that reduce the need for a second database: JSON/JSONB, rich index types, extensions, logical replication. Book is about one product: use for facts about PostgreSQL only, not for comparative scores (§8 fairness rule). |
| `sixstep` | When relational modelling fits: data that can be described as entities with attributes and relationships (the book's step-by-step E-R → relational process). Supports the "linked records" data-shape rule. |

## 6. Backend frameworks (session 3, checked 2026-10-24)
Used by the backend part of the KB draft (§6–10). Read from the frameworks' own repos and registries (P) unless marked. Own-facts only: none of these sources is used to compare one framework with another.

| Item | Licence | First stable / 1.0 | Support policy | WebSockets | Built-in or first-party pieces |
|---|---|---|---|---|---|
| Express 5.3.0 | MIT (npm) | 1.0.0 2010-12-29 (npm) | v4 and v5 both under security support (`ref:eol` data repo) | none built in (GK) | routing, middleware, views |
| Fastify 5.12.7 | MIT (npm) | 1.0.0 2018-03-06 (npm) | `docs/Reference/LTS.md`: each major ≥ 6 months, + 6 months security after the next major | official plugin `@fastify/websocket` (fastify org) | JSON-schema validation, logging; official `@fastify/view`, `@fastify/jwt` |
| NestJS 12.2.0 | MIT (npm) | `@nestjs/core` first published 2017-05 | none found | `packages/websockets`, `platform-socket.io`, `platform-ws` in `nestjs/nest`; gateways docs | first-party `@nestjs/typeorm`, `/passport`, `/schedule`, `/bullmq`, CLI |
| FastAPI 0.162.0 | MIT (`LICENSE`) | still 0.x; 0.1.0 2018-12-08 (PyPI) | none | built in (`docs/en/docs/advanced/websockets.md`) | validation, OpenAPI, DI, security helpers, background tasks |
| Django 6.1.2 | BSD-3 | 1.0 2008 (GK; endoflife data starts at 1.3, 2011-03) | LTS releases (`ref:eol`) | Channels: separate project in the `django` GitHub org | `contrib/admin`, `auth`, `sessions`; ORM, migrations, forms, templates, `django/tasks` |
| Spring Boot 4.1.2 | Apache-2.0 (`LICENSE.txt`) | 1.0.0.RELEASE 2014-04-01 (Maven Central) | OSS support per minor (`ref:eol`) | `spring-boot-starter-websocket` | starters `data-jpa`, `flyway`, `security`, `validation`, `thymeleaf`, `actuator` |
| Laravel 13.38 | MIT (`LICENSE.md`, 12.x and 13.x) | 1.0 2011 (GK) | 13: security to 2028-03-17 (`ref:eol`) | `Illuminate/Broadcasting` + first-party server `laravel/reverb` | `Illuminate/` Auth, Database, Validation, Queue, View, Console |
| ASP.NET Core (.NET 10) | MIT (`LICENSE.txt`) | 1.0 2016-06-27 (`ref:eol`, .NET) | .NET 10 LTS to 2028-11-14 | `src/SignalR` in `dotnet/aspnetcore` | `src/` Identity, Mvc, Razor, Validation, OpenApi; EF Core (first-party, separate repo) |
| Gin 1.12.0 (2026-02-28) | MIT (`LICENSE`) | first v1 tags 2016 (v1.1.4 2016-12-04, Go proxy) | none | none built in (GK: `gorilla/websocket`) | binding/validation, HTML templates |
| Next.js 16.4.3 / Nuxt 4.6.2 / SvelteKit 3.1.0 | MIT (npm) | 1.0: 2016-10 / 2018-01 / 2022-12 (npm) | Next.js and Nuxt in `ref:eol` | Next.js docs (route handlers) and SvelteKit docs: no WebSocket server; Nuxt's engine Nitro: `features.websocket` (`nitrojs/nitro` docs) | route handlers / server routes |

**Usage, Stack Overflow 2025 web frameworks (S, secondary write-ups; the 2026 framework numbers weren't found):** Next.js 20.8%, Express 19.9%, ASP.NET Core 19.7%, FastAPI 14.8%, Spring Boot 14.7%, Flask 14.4%, Django 12.6%, Laravel 8.9%. Sources disagree by a few points (e.g. Node.js 48.7% vs 49.1%). Fastify, NestJS, Gin: not found.

**Performance:** TechEmpower (site and status page) blocked from cloud sessions; no numbers used.

**Still blocked (retried 2026-10-24):** sqlite.org, survey.stackoverflow.co, techempower.com, vercel.com.

**Session 6 retry (2026-10-24, after the owner switched the environment to full network access):** the switch hadn't reached the session; the proxy still answered 403 to `www.techempower.com`, `tfb-status.techempower.com`, `survey.stackoverflow.co`, `stackoverflow.blog`, `sqlite.org`, `gin-gonic.com`, `arxiv.org`, `export.arxiv.org`, `endoflife.date`, `search.maven.org`, `central.sonatype.com`, the NuGet search service (`azuresearch-usnc.nuget.org`) and `web.archive.org`. The npm search API answered 400 and the registry root no longer gives a package count. Reachable as before: `raw.githubusercontent.com`, `proxy.golang.org`, `index.golang.org`, `pkg.go.dev`, `api.nuget.org` (index only), `repo1.maven.org` (files only), `packagist.org`, `pypi.org`. Nothing in this section moved from S to P. SQLite "Appropriate Uses" from search snippets only (S): suits most low-to-medium traffic websites; ~100K hits/day called a conservative guide; high write concurrency listed as a reason for a client/server database (see Q21, rule D9).

## 7. Languages (session 3, checked 2026-10-24)
| Item | Finding | Mark |
|---|---|---|
| Type systems | Go spec: "strongly typed and garbage-collected". C# docs: "a strongly typed language … the compiler enforces type safety". PEP 484: annotations, "no type checking happens at runtime". PHP manual: declarations checked at run time (TypeError). TypeScript handbook: a static type checker. Kotlin FAQ: "statically typed". Java Language Specification: blocked (docs.oracle.com) | P (GitHub sources of each doc) |
| Licences | Node.js MIT; CPython PSF-2.0; OpenJDK GPL-2.0 + Classpath exception; .NET runtime MIT; Go BSD-3; `php-src` master BSD-3 (older releases: PHP License 3.01) | P (LICENSE files) |
| Registries | PyPI 921,802 projects (simple index); Packagist 475,503 packages (`statistics.json`). npm, Maven Central, NuGet search: not reachable | P |
| Speed (Pereira et al. 2021, normalised time vs C) | Java 1.89, Go 2.83, C# 3.14, JavaScript 6.52, TypeScript 46.20 (outlier), PHP 27.64, Python 71.90. CPU-bound Benchmarks Game programs, 2017 versions | S (arXiv 2410.05460 Table I via search; paper sites blocked). Session 6: the authors' repo `greensoftwarelab/Energy-Languages` (last commit 2022-02-27) has a raw CSV per language, but without column headers, with different benchmark sets per language and no plain-Java file (only GraalVM), so the published ratios can't be rebuilt from it with confidence. Not used; stays S |
| Stack Overflow 2026, languages (of 14,099 answering) | JavaScript 62.0%, Python 58.0%, TypeScript 43.8%, Java 27.6%, C# 27.1%, PHP 17.7%, Go 16.5%, Kotlin 10.8% | S (official technology page via search; site blocked) |
| Learners and teaching | SO 2025 results blog: Python #1 among people learning to code. Guo 2014 (CACM blog): Python the most common intro language at top US departments. Siegfried et al. 2021: CS1 mostly Java, Python, C++, C. UK 2016: Java most common | S (all via search summaries; sites blocked) |
| JetBrains 2025 | Primary language: Python 35%, Java 33%, JavaScript 26%, TypeScript 22% (InfoWorld summary). Not used for scores yet | S |
