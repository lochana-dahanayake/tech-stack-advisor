import { expect, test, type Page } from "@playwright/test";
import { MOCK_PORTS } from "../../playwright.config";
import { axe, stackHeading } from "./helpers";

// TESTING_STRATEGY §6: the AI states with AI_MODE=mock, so no AI service is called.
const at = (mock: keyof typeof MOCK_PORTS) => `http://localhost:${MOCK_PORTS[mock]}`;
const aiPanel = (page: Page) => page.getByRole("region", { name: "In plain words (AI)" });

/** The "chat" example is golden G3, where the mock's +5 lifts a close #2 into the stack. */
const openExample = (page: Page, baseURL: string, example = "chat") =>
  page.goto(`${baseURL}/advisor?example=${example}`);

test("AI off: a neutral note, and the rule result is complete", async ({ page }) => {
  await page.goto("/advisor?example=shop");
  await expect(aiPanel(page).getByText("AI explanation not enabled yet")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Things to know" })).toBeVisible();
});

test("AI ok: the explanation fills in, explains every part and names the provider", async ({ page }) => {
  await openExample(page, at("ok"), "shop");
  const panel = aiPanel(page);
  await expect(panel.getByText(/^Mock explanation: java \+ nextjs/)).toBeVisible();
  await expect(panel.getByText("Explanation by Mock AI.", { exact: false })).toBeVisible();
  await expect(panel.getByText("AI changed the stack")).toHaveCount(0);
  await expect(stackHeading(page)).toHaveText(
    "Java / Kotlin on the JVM + Next.js + Spring Boot + PostgreSQL + Railway",
  );
  await axe(page);
});

test("AI fails: a neutral fallback with Retry, and the rule result stays", async ({ page }) => {
  await openExample(page, at("fail"), "shop");
  await expect(aiPanel(page).getByText("The AI explanation isn't available right now")).toBeVisible();
  await expect(aiPanel(page).getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Things to know" })).toBeVisible();
});

test("AI adjusts a close call: the stack is re-assembled and the change is explained", async ({ page }) => {
  await page.goto("/advisor?example=chat");
  const rulesStack = await stackHeading(page).textContent();
  await openExample(page, at("reorder"));
  const panel = aiPanel(page);
  await expect(panel.getByText("AI changed the stack")).toBeVisible();
  await expect(panel.getByText(/Our rule engine picked .* after the AI's small adjustment/)).toBeVisible();
  await expect(panel.getByRole("heading", { name: /Score adjustments by the AI/ })).toBeVisible();
  await expect(page.getByText(/The AI.s small score adjustments changed the stack/)).toBeVisible();
  await expect(stackHeading(page)).not.toHaveText(rulesStack!);
  await axe(page);
});

test("Don't use AI: nothing is requested and the panel says so", async ({ page }) => {
  let requested = false;
  await page.route("**/api/explain", (route) => {
    requested = true;
    return route.continue();
  });
  await openExample(page, at("ok"), "shop");
  await page.getByRole("button", { name: "Edit answers" }).first().click();
  await page.getByLabel("Anything else we should know? (optional)").fill("We already run MySQL.");
  await page.getByRole("checkbox", { name: "Don't use AI for this request" }).check();
  await expect(page.getByText("AI is off for this request")).toBeVisible();
  requested = false;
  await page.getByRole("button", { name: "See my stack", exact: true }).click();
  await expect(aiPanel(page).getByText("AI turned off for this request")).toBeVisible();
  expect(requested).toBe(false);
});

test("the privacy page says what is sent where", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
  await expect(page.getByText(/first Google Gemini; if it is slow or busy, Groq/)).toBeVisible();
  await axe(page);
});
