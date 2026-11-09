# Tech Stack Advisor

A free web app (planned) that recommends **frameworks and a technical stack** for a software project: language, frontend framework, backend framework, database, hosting and so on.

It is the sibling of **[Architecture Advisor](https://github.com/lochana-dahanayake/architecture-advisor)** ([live](https://architecture-advisor-pink.vercel.app)), which recommends _architectural styles_. Tech Stack Advisor answers the next question: "I picked a style, now which tools should I build it with?"

**Status:** Phase 3 (UI). The knowledge base covers all five parts (language, frontend, backend, database, hosting) as JSON with Zod validation, and the pure scoring engine ranks them and assembles a stack. The Next.js app (v0.3.0) works end to end with AI off: landing page, a four-step form with a live stack preview, must-use locks and an architecture style, the full result page, share links, Markdown export, `/methodology`, `/about` and `/changelog`. End-to-end and accessibility tests: `npm run build`, then `npm run test:e2e`. `npm ci`, then `npm run dev` (app at http://localhost:3000), `npm run check` (lint, typecheck, format, tests) and `npm run calibrate` (prints the calibration tables). Start with `CLAUDE.md`, then `docs/`.

| Folder           | What's in it                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `docs/`          | The plan and spec. The docs are the source of truth.                                                                     |
| `docs/adr/`      | Architecture Decision Records (one short file per decision and why).                                                     |
| `references/`    | Source material the owner adds to build the knowledge base rules from.                                                   |
| `src/`, `tests/` | Next.js app (`src/app`, `src/components`), KB data and schema, scoring engine; KB, engine, golden-scenario and UI tests. |
