# Tech Stack Advisor

A free web app (planned) that recommends **frameworks and a technical stack** for a software project: language, frontend framework, backend framework, database, hosting and so on.

It is the sibling of **[Architecture Advisor](https://github.com/lochana-dahanayake/architecture-advisor)** ([live](https://architecture-advisor-pink.vercel.app)), which recommends _architectural styles_. Tech Stack Advisor answers the next question: "I picked a style, now which tools should I build it with?"

**Status:** Phase 1 (knowledge base). The database and backend parts of the KB are JSON with Zod validation, and the scoring engine covers them. `npm ci`, then `npm run check` (lint, typecheck, format, tests) and `npm run calibrate` (prints the calibration tables). Start with `CLAUDE.md`, then `docs/`.

| Folder           | What's in it                                                              |
| ---------------- | ------------------------------------------------------------------------- |
| `docs/`          | The plan and spec. The docs are the source of truth.                      |
| `docs/adr/`      | Architecture Decision Records (one short file per decision and why).      |
| `references/`    | Source material the owner adds to build the knowledge base rules from.    |
| `src/`, `tests/` | KB data and schema, scoring engine; KB, engine and golden-scenario tests. |
