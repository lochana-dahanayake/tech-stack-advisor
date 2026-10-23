# Roadmap

Keep this current. At the end of every session, update **Next up** so the next (cloud) session can start straight away.

## Next up
- Phase 0: read `SIBLING_PROJECT.md` and the Architecture Advisor docs it points to, then `references/INDEX.md`. Draft the criteria list and KB schema.

## Phase 0: Plan (status: started)
- [x] Repo, doc skeleton, references folder
- [ ] Owner adds references (`references/`)
- [ ] Draft criteria list and KB schema (`KNOWLEDGE_BASE_SCHEMA.md`); raise anything unclear in `OPEN_QUESTIONS.md`
- [ ] Draft scoring approach (`SCORING_ENGINE.md`, adapted from Architecture Advisor)
- [ ] Draft `ARCHITECTURE.md` and `TECH_STACK.md` for the app itself
- [ ] Golden scenarios: 8 to 12 realistic inputs with expected top picks (`TESTING_STRATEGY.md`)
- [ ] Owner answers Q2 to Q6

## Phase 1: Knowledge base
- [ ] KB as versioned JSON with source tags and `checked:` dates
- [ ] KB validation tests (schema, every score sourced, no stale entries)

## Phase 2: Rule engine
- [ ] Pure scoring + compatibility rules, test-first, golden scenarios passing

## Phase 3: UI
- [ ] Form, result page, comparison table; link from Architecture Advisor

## Phase 4: AI layer
- [ ] Bounded adjustments + explanation, fallback chain, rules-only mode

## Phase 5: Launch
- [ ] Deploy on a free host, README, about/methodology pages
