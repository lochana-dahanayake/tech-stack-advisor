# Tech Stack (of the app itself)

Decided 2026-10-23 (Q8): **the same stack as Architecture Advisor**, so its engine, KB loader and AI modules can be adapted instead of rewritten. Versions are the latest on npm, checked 2026-10-23; re-check at scaffold time (Phase 1).

| Layer | Choice | Version (npm, 2026-10-23) | Why |
|---|---|---|---|
| Framework | **Next.js** (App Router) | 16.4.3 | React UI + server API route in one app and one deploy; first-class on Vercel |
| UI library | React | 19.3.1 | Comes with Next.js |
| Language | **TypeScript** (strict) | 5.x as in the sibling; 7.0.2 is out (native compiler) | Shared types between engine, KB, API and UI. **Check at scaffold:** whether Next.js 16 type generation (`next typegen`) and `eslint-config-next` work with TypeScript 7; if not, pin 5.x like the sibling |
| Validation | **Zod** | 4.6.7 | One schema for KB files, form input, API body and AI response |
| Styling | **Tailwind CSS** + shadcn/ui (copy-in components on Radix) | 4.3.3 | Accessible form controls without a heavy UI library |
| AI | **Vercel AI SDK** (`ai`, `@ai-sdk/google`, `@ai-sdk/groq`) | 7.0.152 / 4.0.104 / 4.0.69 | One interface for several providers, structured JSON output |
| AI providers | Gemini Flash-Lite → Groq → rules-only | Model IDs in env vars, re-checked in Phase 4 | Free tiers; the sibling measured both (its `AI_INTEGRATION.md`) |
| Tests | **Vitest**, fast-check (property tests), Testing Library; Playwright optional | 5.0.5 / 4.10.2 / – / 1.64.1 | Fast engine tests; property tests for determinism and caps |
| Architecture checks | dependency-cruiser, `server-only` | 18.7.0 | Fitness functions: engine purity, module boundaries, no keys in client code |
| Lint / format | ESLint 10 + Prettier | 10.13.0 / 3.9.10 | Same config as the sibling (incl. its `overrides` fix for ESLint 10 peer warnings) |
| Checks | `npm run check` locally, **no CI server** (decided Q25) | – | lint, typecheck, format, fitness, tests incl. KB and golden |
| Hosting | **Vercel Hobby** | – | Free, preview per push. **Non-commercial only**, fine because the app stays non-commercial |

**Set up so far (2026-10-24):** `package.json` with the sibling's scripts (`lint`, `typecheck`, `test`, `coverage`, `format:check`, `check`, `kb:release-gate`) plus `calibrate` (runs `scripts/calibrate.ts` with `tsx`). ESLint uses `typescript-eslint` instead of `eslint-config-next` until Next.js is added (Phase 3), and keeps the sibling's purity rule for the engine and KB modules. TypeScript 5.x, pinned like the sibling. dependency-cruiser comes with the app modules.

**Scaffold (2026-11-09, Phase 3 step 1):** versions checked on npm that day: `next` 16.4.5 and `eslint-config-next` 16.4.5 (pinned exactly, as the sibling does), `react`/`react-dom` 19.3.1, `tailwindcss` 4.3.5 via `@tailwindcss/postcss` (the standard Next.js set-up; the sibling uses a Turbopack loader instead), shadcn/ui-style copy-in components (`button`, `badge`, `card`) on `radix-ui` 1.8.1, `lucide-react` icons. **TypeScript stays 5.x**: the sibling's set-up (`next typegen && tsc --noEmit`) works with it; TypeScript 7 is left for a later check. ESLint now uses `eslint-config-next` (core-web-vitals + typescript) plus the purity rule, extended to `src/modules/recommendation/**` and still banning React/Next imports in the engine. `next.config.ts` runs `assertValidKnowledgeBase()` (Zod schema + integrity checks), so a broken KB fails `next dev` and `next build` and Zod stays out of the browser bundle. dependency-cruiser is still to come (with the `recommendation`/`ai` modules). Screenshots for review use `playwright-core` with the `msedge` channel.

## Free-tier limits that matter
Same picture as the sibling: one serverless function (`/api/explain`) taking ~1–15 s per call, far below Vercel Hobby's caps (RESEARCH §4: secondary sources, Q21). AI quota is the scarce resource, handled by caching identical requests, rate limits and the rules-only fallback (sibling `AI_INTEGRATION.md` §7–8).

## Not needed in v1
- **Database:** none. The KB is JSON in the repo (sibling ADR-003); results aren't saved (no login).
- **Upstash Redis:** the sibling runs fine without it at low traffic (its Q25). Start without it; add it if rate limits need to be shared across instances.

## What we reuse from Architecture Advisor
Read-only clone into `/tmp` (see `SIBLING_PROJECT.md`). Adapt, don't copy blindly:
| Sibling file | Reuse as |
|---|---|
| `src/modules/scoring/{conditions,weights,validate}.ts` | Condition language, weight resolution, input checks; the engine itself is new (two levels, skills, assembly) |
| `src/modules/knowledge-base/{schema,integrity,check,mentions}.ts` | Pattern for Zod schemas, cross-file checks, build-time validation, alias matching |
| `src/modules/ai/*`, `src/modules/platform/*` | Provider chain, prompt/response validation, redaction, cache, rate limit; prompt and schema change for parts and stacks |
| `.dependency-cruiser.cjs`, `eslint.config.mjs`, `scripts/check-env-names.mjs` | Fitness functions and purity rules |
| `src/components/form/share-link.ts` | Shareable result links (decide later whether notes are included, as in sibling Q29) |
