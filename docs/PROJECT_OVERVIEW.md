# Project Overview: Tech Stack Advisor

> Name decided 2026-10-24 (D3). Rewritten 2026-10-23 from the owner's kickoff brief.

## What it is
A free web app that helps people choose the **concrete technologies** for a software project. It is **not** about software architecture (that's the sibling app, Architecture Advisor). It's about tools:

| Part of the stack | Level 1: the type of choice | Level 2: the product |
|---|---|---|
| Programming language | (single level) | TypeScript/JavaScript on Node.js, Python, Java, C#, Go, PHP |
| Frontend | Approach: static site, single-page app (SPA), server-rendered with a meta-framework, pages rendered by the backend, none (API only) | Astro, React, Vue, Angular, Svelte, Next.js, Nuxt, SvelteKit, plain HTML, the backend's templates |
| Backend | Type: none, the frontend framework's own server, minimal API framework, "batteries-included" framework | Express, Fastify, NestJS, FastAPI, Django, Spring Boot, ASP.NET Core, Laravel, Gin |
| Database | Type: none, relational (SQL), document, key-value, graph | PostgreSQL, MySQL, SQLite, MongoDB, Redis, Valkey, Neo4j |
| Hosting | Type: static hosting, frontend platform, platform-as-a-service, cloud provider, virtual private server (VPS) | GitHub Pages, Netlify, Vercel, Cloudflare, Render, Railway, Fly.io, AWS, Azure, Google Cloud, a VPS |

This v1 list was decided on 2026-10-23 (`OPEN_QUESTIONS.md` Q4, Q10). **v1.1 starts with backend-as-a-service (Supabase, Firebase)**, which is popular with students (Q13). After that: ORM (a library that maps database tables to code objects), authentication, caching/queues, mobile.

Two things make this harder than a simple ranking:
1. **Two levels.** First the type (SQL vs NoSQL), then the product (PostgreSQL vs MySQL).
2. **Choices depend on each other.** Spring Boot means Java/Kotlin; Django means Python; Next.js covers both frontend and backend; a static site needs no database. The rules must produce **one consistent stack**.

## What the user tells us
- **What kind of app:** content/marketing site, portfolio, interactive web app, REST API only, e-commerce, internal tool or data dashboard, backend for a mobile app.
- **Size and traffic:** expected users and how traffic grows (stable, growing, spiky).
- **Type of data:** linked records (orders, customers), self-contained documents, highly connected data (friends of friends), simple key-value lookups, or no stored data.
- **Team skills (very important):** which languages and frameworks the team already knows, and how well. "My team knows Java" changes a lot.
- **Budget, deadline and lifespan.**
- **Constraints:** must self-host, must use a given cloud, commercial project, open-source licences only, real-time features, SEO, offline use.
- **Already decided** (optional): lock a part, e.g. "we must use MongoDB".
- **Architecture style** (optional): carried over from Architecture Advisor, e.g. microservices. Nudges the picks a little.
- **Free-text notes:** read only by the AI layer, never by the rules.

## What the user gets
- A **recommended stack**: one pick per needed part, guaranteed compatible.
- For each part, a **ranked list of options with scores** (type first, then products), with "why" bars and the rules that fired.
- A **comparison table** built from the knowledge base (never by the AI), with the date each fact was checked.
- A **plain-language explanation** (AI, optional) and short definitions of jargon (ORM, SSR, ...).
- Parts that aren't needed are labelled as such ("No database needed for a static portfolio").

## How it works (mirrors Architecture Advisor)
A deterministic **rule engine** ranks options from a curated, sourced **knowledge base** (KB). It decides each part's type first, then ranks products inside it, applies compatibility, team-skill and constraint rules, and assembles the best consistent stack. Same input, same output: no network, clock or randomness. An optional **AI layer** (free-tier LLM) may nudge a few scores by at most ±5 points with a stated reason and writes the explanation. With AI off or failing, the user still gets the full result. Details: `SCORING_ENGINE.md`, `KNOWLEDGE_BASE_SCHEMA.md`.

## Who it is for
| User | What they need |
|---|---|
| Students | A sensible, explained stack for a course or personal project; learn the trade-offs |
| Developers starting something new | A quick, defensible second opinion |
| Small teams | A shared starting point that respects what the team already knows |

## Goals
1. **Trustworthy:** same input, same result; every score traceable to a sourced, dated KB entry.
2. **Fair:** no favouring of trendy tools; vendor marketing isn't used as evidence; boring, proven options get full credit.
3. **Explainable:** the user sees why each option ranked where it did, and why the stack fits together.
4. **Current:** version-dependent facts carry a `checked:` date and go stale on a schedule.
5. **Always available:** works with zero AI.
6. **Free to run and free to use:** free tiers only for the app itself. (Recommendations may include paid products when the user's budget allows; free tiers are labelled.)
7. **Beginner-friendly but not dumbed down:** plain language, jargon explained once.
8. **Linked to Architecture Advisor** (optional hand-off of the chosen style, Q2).

## Non-goals (v1)
- Not about architecture styles (Architecture Advisor does that).
- Not a project generator: no scaffolding, no starter repos.
- No live benchmarks, no scraping GitHub stars or prices at runtime. Facts are curated and dated.
- No chat interface. One form in, one result out.
- No login or saved history.
- No ranking of CMSs, no-code tools or backend-as-a-service products in v1 (recognised in the glossary instead; decided Q13, Q14). Supabase and Firebase are ranked in v1.1.
- No paid or self-hosted AI models.

## Success criteria for v1
- All golden scenarios pass (`TESTING_STRATEGY.md`).
- Rules-only result in under 200 ms in the browser.
- No KB fact past its stale window at release.
- Every `GK` item reviewed before launch.
- Deployed publicly on a free host.
