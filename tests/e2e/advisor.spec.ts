import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { presets } from "../../src/components/form/presets";
import { axe, stackHeading } from "./helpers";

/**
 * Each example's recommended stack, as the result heading shows it. These come from golden scenarios, so a KB
 * change that moves one fails the engine tests first (tests/scoring/golden.test.ts); update both together.
 */
const EXPECTED: Record<string, string> = {
  chat: "TypeScript / JavaScript on Node.js + Next.js + NestJS + PostgreSQL + Render",
  shop: "Java / Kotlin on the JVM + Next.js + Spring Boot + PostgreSQL + Render",
  portfolio: "Plain HTML, CSS and JavaScript + Cloudflare Workers",
  api: "C# (.NET) + ASP.NET Core + PostgreSQL + AWS",
  mvp: "TypeScript / JavaScript on Node.js + Next.js + Frontend framework server + PostgreSQL + Cloudflare Workers",
  hobby: "Python + Vue + FastAPI + PostgreSQL + Render",
};

test("every example has an expected stack in this file", () => {
  expect(Object.keys(EXPECTED).sort()).toEqual(presets.map((p) => p.id).sort());
});

for (const preset of presets) {
  test(`the “${preset.title}” example opens its result from the home page`, async ({ page }) => {
    await page.goto("/");
    const examples = page.getByRole("region", { name: "Or explore an example" });
    await examples.getByRole("link", { name: preset.title }).click();
    await expect(page.getByText(`Example: ${preset.title}`)).toBeVisible();
    await expect(stackHeading(page)).toHaveText(EXPECTED[preset.id]!);
    await expect(page).toHaveURL(/\/advisor$/);
  });
}

test("a not-needed part says why, and the result is accessible", async ({ page }) => {
  await page.goto("/advisor?example=portfolio");
  await expect(stackHeading(page)).toHaveText(EXPECTED.portfolio!);
  const notNeeded = page.getByRole("region", { name: "Not needed for this project" });
  await expect(notNeeded.getByText("Database:")).toBeVisible();
  await axe(page);
});

test("the full result is accessible, including the open details", async ({ page }) => {
  await page.goto("/advisor?example=chat");
  await expect(stackHeading(page)).toHaveText(EXPECTED.chat!);
  await page.getByRole("button", { name: "How this was worked out" }).click();
  await expect(page.getByRole("heading", { name: /Rules that applied/ })).toBeVisible();
  await axe(page);
});

test("filling in the form step by step gives a result", async ({ page }) => {
  await page.goto("/advisor?new");
  await expect(page.getByRole("heading", { level: 1, name: "Your project" })).toBeVisible();
  await axe(page);

  await page.getByRole("radio", { name: "Interactive web app" }).click();
  await expect(page.getByRole("complementary", { name: "Your stack so far" })).toContainText("Updates as you answer");

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Step 2 of 4")).toBeVisible();
  await page.getByRole("radiogroup", { name: "Python" }).getByRole("radio", { name: "Strong" }).click();
  await axe(page);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await axe(page);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Step 4 of 4")).toBeVisible();
  await axe(page);
  await page.getByRole("button", { name: "See my stack" }).click();

  await expect(page.getByText("Your recommended stack")).toBeVisible();
  await expect(stackHeading(page)).toContainText("Python");
  await expect(page.getByText(/^Example:/)).toHaveCount(0);
});

test("the last step asks for what's missing before ranking", async ({ page }) => {
  await page.goto("/advisor?new");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "See my stack" }).click();
  // (Next.js adds its own route-announcer alert, so filter by text.)
  await expect(page.getByRole("alert").filter({ hasText: "One thing before we can rank" })).toBeVisible();
  await axe(page);
  await page.getByRole("button", { name: "Go to “What are you building?”" }).click();
  await expect(page.getByText("Step 1 of 4")).toBeVisible();
});

test("a reload on the result shows the same result, and editing keeps the answers", async ({ page }) => {
  await page.goto("/advisor?example=shop");
  await expect(stackHeading(page)).toHaveText(EXPECTED.shop!);
  await page.reload();
  await expect(stackHeading(page)).toHaveText(EXPECTED.shop!);

  await page.getByRole("button", { name: "Edit answers" }).click();
  await expect(page.getByText("Step 4 of 4")).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("radio", { name: "Online shop" })).toBeChecked();
});

test("a new visit starts blank, and Start over clears the answers", async ({ page, context }) => {
  await page.goto("/advisor?new");
  await page.getByRole("radio", { name: "Interactive web app" }).click();

  // A new tab is a new visit: nothing carries over.
  const other = await context.newPage();
  await other.goto("/advisor");
  await expect(other.getByRole("radio", { name: "Interactive web app" })).not.toBeChecked();
  await expect(other.getByRole("button", { name: "Start over" })).toHaveCount(0);
  await other.close();

  await page.getByRole("button", { name: "Start over" }).click();
  await page.getByRole("button", { name: "Yes, start over" }).click();
  await expect(page.getByRole("radio", { name: "Interactive web app" })).not.toBeChecked();
});

test("Download Markdown saves the result as a dated .md file", async ({ page, baseURL }) => {
  await page.goto("/advisor?example=api");
  await expect(stackHeading(page)).toHaveText(EXPECTED.api!);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Share & save" }).click();
  await page.getByRole("button", { name: "Download Markdown" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^tech-stack-\d{4}-\d{2}-\d{2}\.md$/);
  const text = await readFile(await file.path(), "utf8");
  expect(text).toContain("ASP.NET Core");
  expect(text).toContain("PostgreSQL");
  // The link points back at the site the file came from (localhost here, the real domain with PW_BASE_URL).
  const link = text.match(/\[Open this result in Tech Stack Advisor\]\(([^)]+)\)/)?.[1] ?? "";
  expect(link.startsWith(`${baseURL!.replace(/\/$/, "")}/advisor#a=`)).toBe(true);
  expect(link).toMatch(/#a=[\w-]+$/);
});

test("the home page and /changelog render and are accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start a new recommendation/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Or explore an example" })).toBeVisible();
  await axe(page);
  await page.goto("/changelog");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await axe(page);
});

test("dark mode passes the same checks", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await axe(page);
  await page.goto("/advisor?example=chat");
  await expect(stackHeading(page)).toHaveText(EXPECTED.chat!);
  await axe(page);
  await page.getByRole("button", { name: "Edit answers" }).click();
  await expect(page.getByText("Step 4 of 4")).toBeVisible();
  await page.getByRole("button", { name: "See my stack" }).hover();
  await axe(page);
});

test("Copy link reopens the same result in a fresh browser, and a broken link says so", async ({ page, browser }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/advisor?example=hobby");
  await expect(stackHeading(page)).toHaveText(EXPECTED.hobby!);
  await page.getByRole("button", { name: "Share & save" }).click();
  await axe(page);
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\/advisor#a=[\w-]+$/);

  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto(link);
  await expect(stackHeading(other)).toHaveText(EXPECTED.hobby!);
  await expect(other).toHaveURL(/\/advisor$/);
  await expect(other.getByText(/^Example:/)).toHaveCount(0);
  await other.reload();
  await expect(stackHeading(other)).toHaveText(EXPECTED.hobby!);

  // Same page, new hash: the app reacts to the hash change without a reload.
  await other.goto(link.replace(/#.*/, "#a=broken"));
  await expect(other.getByText("We couldn't open that link")).toBeVisible();
  await expect(other.getByText("Step 1 of 4")).toBeVisible();
  await axe(other);
  await context.close();
});

test("a link with answers the app no longer knows opens the form to check them", async ({ page }) => {
  const data = { v: 1, a: { "app-kind": "web-app", "retired-question": "x" } };
  const hash = Buffer.from(JSON.stringify(data)).toString("base64url");
  await page.goto(`/advisor#a=${hash}`);
  await expect(page.getByText("Some answers in that link need checking")).toBeVisible();
  await expect(page.getByText("Step 4 of 4")).toBeVisible();
  await page.getByRole("button", { name: "See my stack" }).click();
  await expect(page.getByText("Your recommended stack")).toBeVisible();
  await expect(page.getByText("Some answers in that link need checking")).toHaveCount(0);
});

test("?style= from Architecture Advisor starts a form with that style, and the result says what it changed", async ({
  page,
}) => {
  await page.goto("/advisor?style=microservices");
  await expect(page.getByText("Architecture style from Architecture Advisor: Microservices")).toBeVisible();
  await expect(page).toHaveURL(/\/advisor$/);
  await axe(page);
  await page.getByRole("radio", { name: "Interactive web app" }).click();
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Architecture style")).toHaveValue("microservices");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "See my stack" }).click();
  await expect(page.getByText("Architecture style: Microservices")).toBeVisible();

  await page.goto("/advisor?style=big-ball-of-mud");
  await expect(page.getByText("We didn't recognise the architecture style in that link")).toBeVisible();
});

test("a must-use pick stays in the stack and is labelled, and clashing must-uses are explained", async ({ page }) => {
  await page.goto("/advisor?example=shop");
  await page.getByRole("button", { name: "Edit answers" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await page.getByLabel("Database").selectOption({ label: "MongoDB" });
  await axe(page);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "See my stack" }).click();
  await expect(stackHeading(page)).toContainText("MongoDB");
  await expect(page.getByText("MongoDB: your must-use choice")).toBeVisible();
  await expect(page.getByText("Must use (your choice)").first()).toBeVisible();
  await axe(page);

  await page.getByRole("button", { name: "Edit answers" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByLabel("Backend").selectOption({ label: "Django" });
  await page.getByLabel("Language").selectOption({ label: "Java / Kotlin on the JVM" });
  await page.getByRole("button", { name: "See my stack now" }).click();
  await expect(page.getByText("These must-use choices don't fit together")).toBeVisible();
  await expect(page.getByText(/Django runs on Python/).first()).toBeVisible();
});

test("the methodology and about pages render, list rules and sources, and are accessible", async ({ page }) => {
  await page.goto("/methodology");
  await expect(page.getByRole("heading", { level: 1, name: "How it works" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fairness rules" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Stack Overflow Developer Survey 2026" })).toBeVisible();
  await page
    .getByText("Database", { exact: false })
    .filter({ hasText: /^Database \(\d+\)$/ })
    .click();
  await expect(page.getByText("Nothing is stored, so no database is needed.")).toBeVisible();
  await axe(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await axe(page);
  await page.emulateMedia({ colorScheme: "light" });

  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
  await page.getByRole("link", { name: "methodology page" }).click();
  await expect(page).toHaveURL(/\/methodology$/);
  await page.goto("/about");
  await axe(page);
});
