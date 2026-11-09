# Deploy and launch (Phase 5)

Hosting is **Vercel Hobby** (free; TECH_STACK, decided Q8), the same as Architecture Advisor. Hobby is for **non-commercial personal use only** (RESEARCH §4), which fits: the app is free, with no ads and no paid tier. Nothing in the repo needs changing for Vercel: it is a standard Next.js app, so there is no `vercel.json`.

## 1. First deploy (done 2026-11-09)

**Live at https://tech-stack-advisor-one.vercel.app** (Vercel project `tech-stack-advisor` under "Lochana's projects", Hobby; `tech-stack-advisor.vercel.app` belongs to someone else, so Vercel added `-one`). The owner signed in to Vercel in Chrome and Claude did the import with `AI_MODE=off` for Production and Preview (Q40). The first build took 40 s. The steps, for a re-import:

1. Sign in at vercel.com with the GitHub account `lochana-dahanayake` (the same account as Architecture Advisor).
2. **Add New → Project → Import** `lochana-dahanayake/tech-stack-advisor`. Vercel detects Next.js; leave the build and output settings as they are. The project name sets the free URL (`<name>.vercel.app`); `tech-stack-advisor` if it is free.
3. **Environment variables** (Production and Preview):

   | Name | Value | Notes |
   |---|---|---|
   | `AI_MODE` | `off` | Start with `off`: the site is complete without AI and says so. Switch to `live` after the live check (Q39). |
   | `GEMINI_API_KEY`, `GROQ_API_KEY` | (empty until Q39) | Free keys from Google AI Studio and GroqCloud. Server-only: never `NEXT_PUBLIC_`. |

   Optional settings and their defaults are in `.env.example` and AI_INTEGRATION §12.
4. **Deploy.** From then on every push to `main` redeploys, and every PR gets a preview URL.
5. Tell Claude the URL (or add it to `docs/ROADMAP.md`). The README, the About page link from Architecture Advisor and the `?style=` hand-off all wait for it.

## 2. Facts checked for this deploy (2026-11-09, vercel.com docs)

- **Function duration** (docs/functions/configuring-functions/duration, updated 2026-08-24): Hobby default and maximum **300 s**, with Fluid compute on by default. `/api/explain` gives up after 20 s (AI_INTEGRATION §1), so no `maxDuration` setting is needed.
- **Node.js** (docs/functions/runtimes/node-js/node-js-versions, updated 2026-02-27): new projects use the latest LTS on Vercel, **26.x** (22.x and 24.x also offered). Next.js 16 needs ≥ 20.9; the app is developed and tested on Node 26.
- **Monthly caps** (RESEARCH §4, checked 2026-11-08): 100 GB transfer, 1M function invocations, 4 active CPU-hours, 1M CDN requests; at a cap the project pauses instead of billing. Every page is static except `/api/explain`, which is called once per result with AI on.
- **Link previews:** `src/app/opengraph-image.png` becomes `og:image`/`twitter:image`. Next.js builds the absolute image URL from Vercel's production domain, so no `metadataBase` is set. Retake the image with `node scripts/screenshots.mjs` when the landing page changes.
- **AI state is per instance:** the cache, rate limits, daily budget and provider breaker live in memory per server instance (AI_INTEGRATION §8), so with several warm instances the limits are per instance. Fine for launch traffic; an Upstash Redis adapter is one file if it isn't (sibling's Q25).

## 3. Smoke test on the real URL

**Run 2026-11-09, all passed:** `/`, `/advisor`, `/methodology`, `/about`, `/privacy`, `/changelog` and `/opengraph-image.png` return 200; with a crawler user agent `og:image` is `https://tech-stack-advisor-one.vercel.app/opengraph-image.png?…`; `POST /api/explain` returns 400 for `{}` and `disabled` for a valid input; `PW_BASE_URL=https://tech-stack-advisor-one.vercel.app PW_CHANNEL=msedge npx playwright test tests/e2e/advisor.spec.ts` passed 42/42 (desktop + mobile: every example's stack, the form, share links, Markdown, locks, `?style=`, axe on every page). The checklist:

1. `/` loads; the "See the full result" link opens the chat example.
2. The form end to end; the result's stack matches the e2e expectations; "AI explanation not enabled yet" shows with `AI_MODE=off`.
3. A share link opens in a fresh browser; Download Markdown works.
4. `/methodology`, `/about`, `/privacy`, `/changelog` load.
5. `curl -A Twitterbot <url>` shows `og:image` with the production domain, and the image loads.
6. `POST /api/explain` with `{}` returns 400; with a valid input returns `disabled`.
7. Run the e2e suite against the URL where it applies, and record the result in ROADMAP.

## 4. Launch checklist (Phase 5)

- [x] README with screenshots, how it works, local run, deploy (2026-11-09)
- [x] Open Graph image + alt text, `og`/`twitter` metadata (2026-11-09)
- [x] First deploy (§1) and the smoke test (§3), 2026-11-09
- [ ] Q41: the repo is private (and has copyrighted PDFs in its history), but the site links to it as public: reword the pages, or purge the PDFs and make it public
- [ ] Live AI check per provider, then `AI_MODE=live` (Q39)
- [ ] Architecture Advisor → `/advisor?style=<id>` link, in the sibling repo, once the URL exists (Q2)
- [ ] First KB refresh session scheduled (every 3 months, Q7)
