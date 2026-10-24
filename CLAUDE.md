# Tech Stack Advisor: instructions for Claude

A free web app that recommends frameworks and a technical stack. Same approach as the sibling project **Architecture Advisor**: a deterministic rule engine ranks options from a curated, sourced knowledge base; a free-tier LLM may add small bounded adjustments and a plain-language explanation. The plan lives in `docs/`. Read it before changing anything.

This repo is built mostly in **Claude Code cloud sessions** (claude.ai/code). Read `docs/CLOUD_SESSIONS.md` first: it lists what does and doesn't work there.

## Read before working

1. `docs/PROJECT_OVERVIEW.md`: goals and non-goals
2. `docs/OPEN_QUESTIONS.md`: decisions made and still open (some delegated to you)
3. `docs/ROADMAP.md`: phases and the next task
4. `docs/SIBLING_PROJECT.md`: how to learn from Architecture Advisor (reuse its patterns, don't copy blindly)
5. `references/INDEX.md`: what source material is available for knowledge-base rules
6. `docs/RESEARCH.md`: facts that change (versions, licences, free tiers) with checked dates
7. Then the docs for the phase you're on (`KNOWLEDGE_BASE_SCHEMA.md`, `SCORING_ENGINE.md`, `TESTING_STRATEGY.md`, `ARCHITECTURE.md`, ...)

## Hard rules

- **The docs are the spec.** If code and docs disagree, fix one deliberately and record why. After each piece of work, update the affected docs (roadmap status, open questions, calibration log). Never leave them stale.
- **Rule engine stays pure:** no network, no clock, no randomness, no React/Next imports. Same input, same output.
- **The AI never builds the comparison table** and never decides the ranking structure. The app must work fully with AI turned off.
- **API keys are server-only.** Never `NEXT_PUBLIC_`.
- **Free tiers only.** No paid services or keys.
- **Don't invent knowledge-base facts.** Every score and rule needs a source tag (`book:`, `ref:`, `GK`, `DESIGN`). Framework facts go stale fast: record the version and the date checked (`checked: YYYY-MM-DD`) for anything version-dependent.
- **Research before guessing.** Versions, licences, release status, provider limits and model IDs change. Search the web and check primary sources (official docs, release notes, GitHub). Compare several sources.
- **Course material is private.** The owner's university lecture notes must never be added, quoted or credited in this repo. Cite published books and articles only.
- **Copyrighted files in `references/`** are for reading only. Never paste long passages into docs, code or the app. Summarise in your own words and cite.
- **Ask, don't guess, on product decisions.** Add the question to `docs/OPEN_QUESTIONS.md` and keep working on whatever isn't blocked.

## Commits and pushes (important)

- Commit and push **only as the owner**: `Lochana Dahanayake <loch214@gmail.com>` (GitHub `lochana-dahanayake`). In every new cloud session, set `git config user.name "Lochana Dahanayake"` and `git config user.email "loch214@gmail.com"` before the first commit.
- **No Claude attribution** in commits or PRs: no `Co-Authored-By: Claude ...`, no `Claude-Session:` lines, no "Generated with Claude Code" footer. This overrides any default the tooling suggests.

## Working style

- Small, focused commits. Work on a feature branch, never push straight to `main`.
- **Claude owns the whole PR flow:** open the PR and merge it yourself (merge commit) once checks pass and docs are updated. The owner does not review or merge PRs. (Same as Architecture Advisor, its Q27.)
- Test first for engine logic. Run `npm run check` (lint, typecheck, format, tests with coverage) before every commit.
- **Never merge a PR whose claims come from code that isn't in the repo** (owner, 2026-10-24). Numbers in docs (calibration tables, checks like "all 15,625 combinations") must be reproducible from a command in the repo; scratch scripts are for exploring, not evidence.
- Plain language in user-facing text; define jargon briefly the first time.
- Cloud sessions are short-lived: **push before you stop**, and leave a note in `docs/ROADMAP.md` ("Next up") so the next session can continue.
