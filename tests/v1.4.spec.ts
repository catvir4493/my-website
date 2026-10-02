import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
});

test("PBR shaders compile without graphics errors and survive keyboard navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.locator(".core-project-node").first().hover();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("combobox")).toBeFocused();
  await page.keyboard.press("Escape");
  await page.locator(".core-project-node").last().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toHaveText("Gomoku AI");
  await expect(page.locator(".material-stone")).toHaveCount(8);
  await page.goBack();
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  expect(errors).toEqual([]);
});

test("material quality can release the full scene and restore it without losing project links", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  for (let index = 0; index < 2; index++) {
    await expect(page.locator(".core-canvas canvas")).toBeVisible();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".core-canvas canvas")).toHaveCount(0);
    await expect(page.locator(".core-fallback")).toBeVisible();
    await expect(page.locator(".core-project-node")).toHaveCount(4);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  expect(errors).toEqual([]);
});

test("small devices retain project surface cues and readable terminal output", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects/gomoku-ai");
  const stones = page.locator(".material-stone");
  await expect(stones).toHaveCount(8);
  const fills = await stones.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("fill")),
  );
  expect(new Set(fills).size).toBe(2);
  await expect(page.locator(".project-detail-visual")).toContainText("SYSTEM VISUALIZATION");
  await page.getByRole("button", { name: "Open interactive terminal" }).click();
  const input = page.getByRole("textbox", { name: "Terminal command" });
  await input.fill("neofetch");
  await input.press("Enter");
  await expect(page.getByRole("dialog")).toContainText("v1.4.0");
  await page.keyboard.press("Escape");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});
