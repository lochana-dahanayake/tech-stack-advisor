# References index

Source material for knowledge-base rules. Each entry gets a short id; KB entries cite it as `ref:<id>` (or `book:<id> <chapter>` for books).

## How to add a reference (owner)
- Drop files into `books/`, `articles/` or `notes/` (PDF, markdown, text, links file, screenshots all fine).
- Add a row below. A link alone is fine: put it in the "Location" column.
- Large PDFs: GitHub refuses files over 100 MB; prefer a link or extracted chapters.
- **Never** add university lecture material here.

## How to use them (Claude)
- Read the relevant files before drafting scores or rules.
- Summarise in your own words; never paste long passages into docs, code or the app.
- If a reference is old, check the current state online and note both.

| id | Title / author | Type | Location | Covers | Added |
|---|---|---|---|---|---|
| ddia | Kleppmann, *Designing Data-Intensive Applications*, 1st ed. (O'Reilly, 2017) | book | `books/ddia-1st-ed-2017.pdf` | SQL vs NoSQL, data models, replication, partitioning, consistency. A 2nd ed. (Kleppmann & Riccomini, 2026) exists; check online for anything that changed. | 2026-10-24 |
| fosa | Richards & Ford, *Fundamentals of Software Architecture*, 2nd ed. (O'Reilly, 2025) | book | `books/fosa-2nd-ed-2025.pdf` | Definitions of quality attributes (scalability, performance, ...) and trade-off thinking. Background only. The PDF is the **German translation** (chapter numbers match the English edition). | 2026-10-24 |
| mpg17 | Schönig, *Mastering PostgreSQL 17*, 6th ed. (Packt, 2024) | book | `books/mastering-postgresql-17.pdf` | PostgreSQL features: JSON, indexing, extensions, replication, performance. | 2026-10-24 |
| sixstep | Fidel A. Captain, *Six-Step Relational Database Design*, 2nd ed., revised (2015) | book | `books/six-step-relational-db-design-2nd-ed.pdf` | How to design a relational (SQL) database step by step; when relational modelling fits. | 2026-10-24 |
| so-survey | Stack Overflow Developer Survey (latest: 2026, published 2026-10-06) | link | https://survey.stackoverflow.co/2026 | Usage and how much developers like each language, framework and database; hiring signal. | 2026-10-24 |
| jb-eco | JetBrains State of Developer Ecosystem | link | https://www.jetbrains.com/lp/devecosystem-2025/ (check for newer year) | Second survey to cross-check usage. | 2026-10-24 |
| state-js | State of JS | link | https://stateofjs.com/ | Frontend and Node framework satisfaction. | 2026-10-24 |
| db-engines | DB-Engines ranking | link | https://db-engines.com/en/ranking | Database popularity and per-database facts. | 2026-10-24 |
| tw-radar | Thoughtworks Technology Radar (latest found: Vol. 34, April 2026) | link | https://www.thoughtworks.com/radar | Expert adopt / trial / hold verdicts on tools. | 2026-10-24 |
| web-rendering | web.dev, "Rendering on the Web" | link | https://web.dev/articles/rendering-on-the-web | SPA vs server rendering vs static sites. | 2026-10-24 |
| eol | endoflife.date | link | https://endoflife.date/ (blocked in cloud sessions: use its data repo https://github.com/endoflife-date/endoflife.date, `products/*.md`) | Support and end-of-life dates for each version. | 2026-10-24 |
| techempower | TechEmpower Framework Benchmarks | link | https://www.techempower.com/benchmarks/ | Backend framework speed. Rough signal only. | 2026-10-24 |
| mdb-docs | MongoDB manual (official docs source) | link | https://github.com/mongodb/docs (`content/manual/`) | MongoDB facts only (transactions, `$lookup`); vendor source: own facts, never comparisons | 2026-10-23 |
| github-docs | GitHub Docs (official docs source) | link | https://github.com/github/docs | GitHub Pages limits and allowed use | 2026-10-23 |
| cloudflare-docs | Cloudflare Docs (official docs source) | link | https://github.com/cloudflare/cloudflare-docs | Workers/Pages limits | 2026-10-23 |
| supabase-docs | Supabase Docs (official docs source) | link | https://github.com/supabase/supabase (`apps/docs/`) | Free-plan pausing; needed for v1.1 | 2026-10-23 |
| vercel-repo | Vercel CLI and runtimes (official repo) + `@vercel/functions` on npm | link | https://github.com/vercel/vercel | Supported runtimes, container runtime, WebSocket API | 2026-10-23 |
| fw-repos | Backend frameworks' own repos, docs and registry pages: `expressjs/express`, `fastify/fastify`, `nestjs/nest` + `nestjs/docs.nestjs.com`, `fastapi/fastapi`, `django/django` + `django/channels`, `spring-projects/spring-boot`, `laravel/framework` + `laravel/reverb`, `dotnet/aspnetcore`, `gin-gonic/gin`, `vercel/next.js`, `nuxt/nuxt`, `nitrojs/nitro`, `sveltejs/kit` | link | https://github.com/ (paths as listed) | Licences, release dates, support policies, built-in features, WebSocket support. Vendor sources: own facts only | 2026-10-24 |
| so-survey-2025 | Stack Overflow Developer Survey 2025, web frameworks question | link | https://survey.stackoverflow.co/2025/technology (blocked: numbers from secondary write-ups, S) | Placeholder usage shares for backend `community` until the 2026 numbers are read | 2026-10-24 |

Every file in `books/` has a row above (checked 2026-10-23). Facts taken from the links, with their checked dates, are in `docs/RESEARCH.md`.
