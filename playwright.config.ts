import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/** Set PW_CHANNEL=msedge (or chrome) to use an installed browser instead of Playwright's own Chromium. */
const channel = process.env.PW_CHANNEL;

/**
 * End-to-end and accessibility checks of the main flow (TESTING_STRATEGY §6), run against a production build
 * (`npm run build` first). The app works fully with AI off, so no AI setting is needed yet.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel } },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
