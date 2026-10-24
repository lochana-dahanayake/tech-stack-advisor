# Open Questions

Product decisions belong to the owner. Claude: add new questions here instead of guessing, and keep working on what isn't blocked. Move answered ones to "Decided" with the date.

## Open: needs the owner's answer

| # | Question | Recommendation and reason |
|---|---|---|
| Q29 | **G8 (Go "some", performance Critical) picks C# + ASP.NET Core, not Go.** Language part: Go 94.1, C# 88.6. Stack: ASP.NET Core + C# beats Gin + Go (backend + language 171.9 vs 167.4) because Gin scores low as a framework: `scalability` unsourced, `community` placeholder, little built in. Numbers: KB draft §13. Options: **(a)** keep G8 as is and wait for sources for Gin (TechEmpower, a survey share), then re-run; **(b)** accept "C# + ASP.NET Core" for G8 (the expectation already allows ASP.NET Core as the backend, and lists C# in the top 3 languages) and change the language expectation to "Go or C#"; **(c)** extend T6 to "some" (owner said no, so not done). | **(a)**, because the gap is mostly missing evidence for Gin, the same "paperwork, not merit" pattern as Python. The branch stays unmerged until you decide. |
| Q28 | **SQLite is public domain, which isn't an OSI-approved licence.** Should the "open-source licences only" constraint (K6) allow it? | **Allow it**: public domain has no restrictions at all, which is what the constraint is for. The KB stores it as `osi: false, publicDomain: true`, so the badge can say "public domain" instead of a wrong "OSI: yes". K6 isn't in the JSON yet (hosting rules come with Part 5). |

## Open: delegated to Claude (no answer needed unless you disagree)

| # | Topic | Plan |
|---|---|---|
| Q20 | Scoring rubrics | Finalise the per-criterion rubrics in Phase 1 (draft in KB schema §8): survey usage bands for `community`, years + support policy for `maturity`, compiler-enforced types for `type-safety`. Backend proposals (2026-10-24, KB draft §6): `productivity` = built-in/first-party building blocks out of 8, `real-time` = first-party WebSockets with broadcasting, own `community` bands for frameworks (≥ 15% → 5). Every comparative score needs two independent sources or a rubric metric; vendor pages only for their own facts. |
| Q21 | **Facts not yet verified from primary sources** | Verified 2026-10-23 (session 2), via GitHub-hosted docs and package registries: Vercel WebSockets, Netlify (no WebSocket API), Vercel runtimes and container beta (code only), Cloudflare Workers free limits, GitHub Pages terms, Supabase pausing, Neo4j licence, MySQL versioning (RESEARCH §4b). **Still unverified** (vendor sites blocked, docs not on GitHub): Vercel Hobby non-commercial rule and caps; Vercel container beta limits per plan; Vercel WebSocket duration limits; Netlify credit model; Render free tier; Railway and Fly.io trial terms; AWS/Azure/GCP free tiers; Stack Overflow 2026 **web-framework** numbers (2025 numbers used as S placeholders for backend `community`; Fastify, Gin, NestJS not found); TechEmpower results (site blocked; every backend `performance` score is flagged); State of JS 2025 numbers; Thoughtworks Radar vol. 34 verdicts; SQLite "appropriate uses" page (**owner is getting this checked**; rule D9 stays `reviewed: false` until then). Each stays marked S in RESEARCH and can't become a KB fact until checked. |
| Q22 | Language granularity | One option for **TypeScript/JavaScript on Node.js** (TypeScript recommended in the text), one for **Java/Kotlin on the JVM**. Bun and Deno are glossary entries (runtimes, not languages). |
| Q23 | Close-call threshold | 5 points between the top two types → show both. Tune in calibration. |

## Decided

| # | Decision | Date |
|---|---|---|
| D1 | Separate repo; built mainly in Claude Code cloud sessions. | 2026-10-24 |
| D2 | Claude owns the PR flow (opens and merges), same as Architecture Advisor. | 2026-10-24 |
| D3 | Name: **Tech Stack Advisor** (repo `tech-stack-advisor`). "Framework Advisor" was too narrow: it also covers databases and hosting. | 2026-10-24 |
| D4 | Scope is concrete **tools**, not architecture; two levels per part (type, then product); team skills are a first-class input; the Architecture Advisor style is an optional nudge (owner's kickoff brief). | 2026-10-23 |
| Q2 | **Separate app + URL hand-off**: Architecture Advisor's result page links to `/advisor?style=<style-id>` (same style ids). The style fires a few small rules (KB schema §7.5). In v1; the Architecture Advisor side is built last. | 2026-10-23 |
| Q3 | **Per-part ranking + deterministic stack assembly**; well-known bundles (MERN, LAMP, ...) shown as info only, not ranked. | 2026-10-23 |
| Q4 | **v1 parts:** language, frontend (approach + framework), backend (type + framework), database (type + product), hosting (type + provider). Later: see Q13 for v1.1, then ORM → authentication → caching/queues → mobile. | 2026-10-23 |
| Q5 / Q10 | **v1 tools** as listed in KB schema §3: languages TS/Node, Python, Java (incl. Kotlin), C#, Go, PHP; frontend plain HTML, Astro, React, Vue, Svelte, Angular, Next.js, Nuxt, SvelteKit (+ backend templates); backend Express, Fastify, NestJS, FastAPI, Django, Spring Boot, ASP.NET Core, Laravel, Gin (+ the frontend framework's server); databases PostgreSQL, MySQL, SQLite, MongoDB, Redis, Valkey, Neo4j; hosting GitHub Pages, Netlify, Vercel, Cloudflare, Render, Railway, Fly.io, AWS, Azure, Google Cloud, a VPS. Left for later (glossary in v1): Ruby/Rails, Ktor, Flask, Hono, Remix/React Router, SolidJS, htmx, MariaDB, SQL Server, Cassandra. | 2026-10-23 |
| Q6 | **The 16 criteria** in KB schema §4, each applying only to the parts where it means something; ~10 on the form by default, the rest under "More priorities". | 2026-10-23 |
| Q7 | **Stale windows per fact kind** (free tiers 90 days, versions/support 180, licences 365, score evidence 365); "checked on" shown in the UI; warning when overdue, release-build failure at 2× overdue; **refresh session every 3 months**; abandoned tools → `deprecated` → glossary. | 2026-10-23 |
| Q8 | **Same app stack as Architecture Advisor**: Next.js 16 + TypeScript strict + Zod + Tailwind/shadcn + Vitest/fast-check, Vercel Hobby (app stays non-commercial), Gemini Flash-Lite → Groq → rules-only. Model IDs re-checked in Phase 4. See `TECH_STACK.md`. | 2026-10-23 |
| Q9 | **Repo stays private** while it holds the book PDFs. They are in git history, so a public version later means a **fresh public repo** with `references/` holding only `INDEX.md`. | 2026-10-23 |
| Q11 | **Team skills:** none / some / strong per language, an optional "frameworks we know" multi-select, and a goal toggle "Use what we know" (default) / "Learn something new" that halves skill bonuses. Starting numbers in KB schema §7.4, tuned on the golden scenarios. | 2026-10-23 |
| Q12 | **Locks in v1**: the user can lock a part; the locked option is always in the stack; clashes with rules give a warning, not a removal. | 2026-10-23 |
| Q13 | **Backend-as-a-service is not ranked in v1** (glossary cards: Supabase, Firebase, Appwrite). **Supabase and Firebase are the first item of v1.1** (owner: popular with students), ranked as a backend type with their free-tier and lock-in facts sourced. | 2026-10-23 |
| Q14 | **CMSs, no-code tools and Python dashboard tools** (WordPress, Streamlit, Dash) are not ranked; glossary cards say when they may be the better answer. | 2026-10-23 |
| Q15 | **The form asks "Is this a commercial project?"**: it changes which free tiers are allowed (Vercel Hobby, GitHub Pages). | 2026-10-23 |
| Q16 | **Licences:** each product shows its licence and an "OSI open source: yes/no" badge; optional constraint "open-source licences only" (rule K6). | 2026-10-23 |
| Q17 | **No SQL Server / Oracle in v1** (glossary cards); reconsider SQL Server in v1.1 if G6 shows it's missed. | 2026-10-23 |
| Q18 | **Database hosting** (Supabase, Neon, MongoDB Atlas, RDS) shown as dated notes under the database pick in v1, not ranked; ranked in v1.1 as part of hosting. | 2026-10-23 |
| Q19 | **No mobile frameworks in v1**; "backend for a mobile app" is an app kind. | 2026-10-23 |
| Q24 | **Golden scenarios approved** with two owner changes: (1) re-check WebSocket support on Vercel/Netlify and fix K7 and G3; done: Vercel Functions support WebSockets (GA 2026-10-20), so K7 now applies to Netlify only and Vercel gets a note about cross-instance broadcasting; (2) add **G13**, a product catalogue where a document database is a fair #1, to guard against a hidden bias against NoSQL. | 2026-10-23 |
| Q26 | **Beta features are allowed, with a penalty and a note** (rule K9): −5, or −10 when lifespan is 5+ years or maturity is High. Beta/GA status is a dated `release-status` fact with a **90-day stale window**, so the penalty can't outlive the beta. | 2026-10-24 |
| Q27 | **Type-win coverage is a check on scenario coverage**, using only scenarios a neutral senior developer would agree with; no invented scenarios. `key-value` as the main database has no honest v1 scenario, so it's exempt (reason in TESTING_STRATEGY §3). | 2026-10-24 |
| Rule D3 (G10) | **"Highly connected" penalises the document type directly** (D3 document −30), so document can never beat both relational and graph on that input (`ddia` ch.2: poor fit for many-to-many). Relational winning when scalability is High is fine. | 2026-10-24 |
| Rule D9 | **SQLite −15 for commercial multi-user apps** (e-commerce, web app, mobile backend, API). Unverified until the SQLite docs are checked (owner). | 2026-10-24 |
| Q25 | **No CI server**; `npm run check` locally before every commit; Vercel preview builds per push. | 2026-10-23 |
