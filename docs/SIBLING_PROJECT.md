# Learning from Architecture Advisor

Architecture Advisor is the finished sibling project (v1.1, live). Tech Stack Advisor should follow the same overall design. Read it to understand the approach, then adapt; don't copy code blindly.

- Repo (public): https://github.com/lochana-dahanayake/architecture-advisor
- Live app: https://architecture-advisor-pink.vercel.app

## Getting it in a cloud session
GitHub is reachable from cloud sessions, so a shallow read-only clone outside this repo works:

```sh
git clone --depth 1 https://github.com/lochana-dahanayake/architecture-advisor /tmp/architecture-advisor
```

Never commit it into this repo. If cloning fails, read single files from
`https://raw.githubusercontent.com/lochana-dahanayake/architecture-advisor/main/<path>`.

## What to read, in order

| File | Why |
|---|---|
| `CLAUDE.md` | Its working rules. This repo's `CLAUDE.md` is based on it. |
| `docs/PROJECT_OVERVIEW.md` | Goals, non-goals, success criteria. Tech Stack Advisor mirrors them. |
| `docs/KNOWLEDGE_BASE_SCHEMA.md` | How KB entries, source tags and rules are shaped. Start the stack KB schema from this. |
| `docs/KNOWLEDGE_BASE_DRAFT.md` | Real KB content; §8 is the calibration log. Shows the level of sourcing expected. |
| `docs/SCORING_ENGINE.md` | Weighted scoring, constraint rules, tie-breaks. The core idea to reuse. |
| `docs/TESTING_STRATEGY.md` | Golden scenarios and KB tests. |
| `docs/AI_INTEGRATION.md` | Bounded ±5 adjustments, fallback chain, response validation. |
| `docs/ARCHITECTURE.md`, `docs/TECH_STACK.md` | Module boundaries (`src/modules/{knowledge-base,scoring,recommendation,ai,platform}`) and chosen tools. |
| `docs/adr/` | Decisions and reasons: rules + bounded AI, KB as JSON, engine in browser and server, AI fallback chain, Upstash for cache/rate limits, patterns shown not ranked. |
| `docs/UI_UX.md` | Form and result layout, plain-language style. |
| `src/modules/scoring/`, `src/modules/knowledge-base/` | Working engine and KB loader. |

## The link between the two apps
Architecture Advisor outputs a ranked list of **architectural style ids** (layered, modular monolith, microservices, event-driven, ...). Tech Stack Advisor can take a style id as input that changes weights and rules (e.g. microservices raises the value of container-friendly hosting and per-service databases). Use the **same style ids** as Architecture Advisor's KB so a URL hand-off works. How the hand-off works is still open: `OPEN_QUESTIONS.md` Q2.

## What not to bring over
- Any private course material (it isn't in the public repo anyway).
- Its style scores. Tech Stack Advisor needs its own sourced facts.
