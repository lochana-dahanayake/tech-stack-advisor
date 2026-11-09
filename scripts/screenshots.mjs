// README screenshots and the link-preview (Open Graph) image. Uses a browser already on the machine (Edge by
// default), so nothing is downloaded. Start the app first (`npm run build && npm run start -- --port 3100`, or use
// the live URL). Usage: node scripts/screenshots.mjs [base URL] [channel] [out dir]
// Writes PNGs to docs/screenshots/ and src/app/opengraph-image.png (1200×630, the top of the landing page).
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3100";
const channel = process.argv[3] ?? "msedge";
const out = process.argv[4] ?? "docs/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel });
// Light theme, no animation mid-shot (buttons have transitions).
const context = await browser.newContext({ colorScheme: "light", reducedMotion: "reduce" });

// The link preview: exactly 1200×630 at 1×, the size social sites and chat apps expect.
const og = await context.newPage();
await og.setViewportSize({ width: 1200, height: 630 });
await og.goto(base);
await og.waitForLoadState("networkidle");
// Only the header and the hero: hide whatever starts below it, so the image has no half-cut section.
await og.addStyleTag({ content: "main > * > *:not(:first-child), footer { visibility: hidden !important; }" });
await og.screenshot({ path: "src/app/opengraph-image.png" });

const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
const shot = (name, options = {}) => page.screenshot({ path: `${out}/${name}.png`, ...options });

await page.goto(base);
await page.waitForLoadState("networkidle");
await shot("landing");

await page.goto(`${base}/advisor?new`);
await page.getByRole("heading", { name: "What are you building?" }).waitFor();
await shot("form-step");

// The "chat" example (golden G3): the header with the stack (cut above the AI panel), then one part's ranking.
await page.goto(`${base}/advisor?example=chat`);
const things = page.getByRole("heading", { name: "In plain words (AI)" });
await things.waitFor();
const top = await things.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
await shot("result", { fullPage: true, clip: { x: 0, y: 0, width: 1280, height: Math.ceil(top) - 16 } });

const database = page.locator("section[aria-labelledby=part-database]");
await database.scrollIntoViewIfNeeded();
await database.screenshot({ path: `${out}/part-ranking.png` });

await browser.close();
console.log(`Saved screenshots to ${out}/ and src/app/opengraph-image.png`);
