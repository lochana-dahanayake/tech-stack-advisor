# Project Overview: Tech Stack Advisor

> Name decided 2026-10-24 (D3).

## What it is
A free web app that recommends a **technical stack** for a software project. The user describes:
- the kind of system (web app, API, mobile backend, data pipeline, ...),
- the architectural style, if known (ideally taken from Architecture Advisor),
- which quality attributes matter (performance, scalability, developer productivity, ...),
- team and business factors (team skills, budget, deadline, hiring market, lifespan),
- constraints (must run on X, regulated data, existing systems, licence rules),
- and anything else in plain text.

The app returns, for each **stack layer** (language, frontend framework, backend framework, database, hosting, ...), a **ranked list of options with scores**, a **plain-language explanation**, and a **comparison table** built from the knowledge base.

## How it works (planned, mirrors Architecture Advisor)
A deterministic **rule engine** scores every option against the user's weighted priorities using a curated, sourced knowledge base, then applies constraint and compatibility rules (for example "Django implies Python"). That always gives a result. An optional **AI layer** (free-tier LLM) may nudge scores by a small capped amount with a stated reason and writes the explanation. If the AI is down, the user still gets the full rule-based result.

## What's new compared with Architecture Advisor
- **Several layers, not one list.** Choices depend on each other (language limits frameworks; framework suggests hosting). Needs compatibility rules and maybe "whole stack" bundles. See `OPEN_QUESTIONS.md` Q3.
- **Facts age fast.** Frameworks release often. Every version-dependent fact needs a `checked:` date, and the KB needs a refresh process.
- **Team skill matters a lot.** "What the team already knows" can outweigh technical fit.

## Who it is for
Students, developers starting a new system, and small teams who want a defensible second opinion.

## Goals
1. Trustworthy: same input, same ranking; every score traceable to a sourced KB entry.
2. Explainable: user sees why an option ranked where it did.
3. Always available: works with zero AI.
4. Free to run and free to use.
5. Beginner-friendly but not dumbed down.
6. Linked to Architecture Advisor (hand-off from a style result is the ideal flow; see Q2).

## Non-goals (v1, proposed)
- Not a project generator (no scaffolding code, no starter repos).
- No live benchmarks or scraping GitHub stars at runtime.
- No login, no saved history.
- No paid or self-hosted models.
