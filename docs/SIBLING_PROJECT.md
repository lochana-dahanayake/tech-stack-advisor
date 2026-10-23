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

## Summary of the study (2026-10-23)
Read in a cloud session from a shallow clone: `CLAUDE.md`, all of `docs/` (overview, KB schema and draft incl. the §8 calibration log, scoring engine, testing, AI integration, architecture, tech stack, ADRs 001–007, open questions) and the KB JSON files.

### What carries over (and why)
| Idea | Why it fits here too |
|---|---|
| **Pure rule engine** `score(input, kb)`, run in the browser and on the server (ADR-004) | Same input, same output; instant result; the server never trusts browser scores |
| **Weighted average on a 1–5 scale, normalised to 0–100**; importance levels none 0 / low 1 / medium 2 / high 3 / critical 5; unset = low | Easy to explain ("+5 points"), independent of how many criteria the user rated |
| **Floors**: situation answers raise a criterion's minimum importance, and conflicts with the user's own level are shown | E.g. "very tight deadline" raises *productivity*; the user sees why |
| **Rules as data** (`when` / `otherwise` / effects `modify`, `exclude`, `floor`, `note`), modifier cap ±30, every rule has a user-facing explanation and a source | Reviewable, testable without touching engine code |
| **Bounded AI** (ADR-002): ±5 per option, max 3 adjustments, top 5 only, reasons required, server clamps and re-validates; Gemini Flash-Lite → Groq → rules-only (ADR-005) | The ranking stays reproducible; AI can only reorder close options |
| **KB as versioned JSON + Zod**, integrity checks, score-matrix snapshot, release gate on unreviewed sources (ADR-003) | Score changes become visible diffs |
| **Glossary of recognised-but-unranked items** matched against the notes (ADR-007) | Users will mention tools we don't rank (WordPress, Firebase, Streamlit, Bun) and deserve a short answer |
| **Golden scenarios** reviewed by the owner, plus property tests (determinism, cap, exclusions) | Encodes domain judgement; a broken golden test means "stop and think" |
| **Module layout** `src/modules/{knowledge-base,scoring,recommendation,ai,platform}` and fitness functions (dependency-cruiser) | Proven structure; the same one developer |
| **Docs-first process**: calibration log, open-questions log, "Next up" | Works across short cloud sessions |

### What changes for tech-stack choices (and why)
| Change | Why |
|---|---|
| **Several parts, two levels each** (type, then product), not one list | Choosing "relational vs document" is a different question from "PostgreSQL vs MySQL". Ranking all products in one pool would let a strong product of the wrong type win |
| **Decide the type first with situation rules** | Lesson from the sibling's Q30 ("microservices for almost everything"): a weighted average over many criteria favours all-rounders. The fix there was to ask the gating questions *before* comparing ratings. Here the gating answers are data shape, app kind, hosting constraints |
| **Compatibility rules and stack assembly** (requires / works best with / conflicts) | Choices depend on each other: Django needs Python; Next.js can be the backend too; Vercel doesn't run Spring Boot. The engine must return one consistent stack, not five unrelated winners |
| **Team skills as a first-class input**, with their own capped modifier bucket | "My team knows Java" can outweigh technical fit; the sibling only had a generic experience level |
| **Facts age in months, not years** | Every version, licence, support date and free-tier limit gets `checked:` and a stale window per fact kind; tests flag overdue facts |
| **Fairness rules for sources** | Tool vendors publish self-serving comparisons; popularity data can push trendy tools. Comparative scores need neutral sources and a written rubric |
| **"Not needed" parts** | A static portfolio needs no database or backend; the sibling always ranked every style |
| **User can lock a part** ("we must use MongoDB") | Real projects often have one fixed choice; the rest of the stack is built around it |

### What not to bring over
The style scores, attributes and drivers themselves (different domain); the T2 "similar answer" cache can wait until traffic justifies it (it doesn't save quota, see sibling `AI_INTEGRATION.md` §7).

### Link to Architecture Advisor
Optional input `arch-style` using the sibling's style ids (`layered`, `modular-monolith`, `microkernel`, `pipeline`, `service-based`, `event-driven`, `space-based`, `microservices`, `soa`, `serverless`, `cell-based`, `peer-to-peer`, `edge`). A few small rules use it (`KNOWLEDGE_BASE_SCHEMA.md` §7.5). Hand-off design: `OPEN_QUESTIONS.md` Q2.
