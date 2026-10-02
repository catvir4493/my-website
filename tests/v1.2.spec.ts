import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
});

test("project diagram retains identity through navigation and browser back", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/projects");
  const card = page.locator('[data-project="swordsmith-notebook"]');
  await card.hover();
  await expect(card).toHaveCSS("--ambient-primary", "rgb(217, 180, 125)");
  await card.click();
  await expect(page.locator("h1")).toHaveText("Swordsmith Notebook");
  await expect(page.locator(".project-detail-visual")).toContainText("SYSTEM VISUALIZATION");
  await expect(page.locator(".route-signal")).toHaveCount(0, { timeout: 3000 });
  await page.goBack();
  await expect(page.locator(".archive-grid .project-card")).toHaveCount(4);
  expect(errors).toEqual([]);
});

test("command mode dims HUD, preserves focus, and restores the core", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(page.locator(".system-root")).toHaveAttribute("data-command-mode", "true");
  await expect(page.getByRole("combobox")).toBeFocused();
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  await page.keyboard.press("Escape");
  await expect(page.locator(".system-root")).toHaveAttribute("data-command-mode", "false");
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
});

test("C selects related systems while preserving truthful evidence", async ({ page }) => {
  await page.goto("/");
  await page.locator(".skill-node").filter({ hasText: /^C$/ }).click();
  for (const name of ["Algorithms", "Data Structures", "Dynamic Memory"]) {
    await expect(page.locator(".skill-node").filter({ hasText: name })).toHaveAttribute(
      "data-state",
      "related",
    );
  }
  await expect(
    page.locator(".skill-inspector").getByRole("link", { name: /Memory Lab/ }),
  ).toHaveAttribute("href", "/lab#memory");
});

test("reduced motion can be changed live without losing core navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "low");
  await expect(page.locator(".core-fallback")).toBeVisible();
  await page.locator(".core-project-node").last().click();
  await expect(page.locator("h1")).toHaveText("Gomoku AI");
  await expect(page.locator(".route-signal")).toHaveCount(0);
  const animations = await page
    .locator(".project-visual")
    .evaluate((element) => element.getAnimations({ subtree: true }).length);
  expect(animations).toBe(0);
});

test("medium quality retains a simplified core and disables parallax", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 }),
  );
  await page.goto("/");
  await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "medium");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.mouse.move(1000, 200);
  await expect(page.locator(".visual-environment")).not.toHaveAttribute("style", /parallax-x/);
});

test("project heroes and memory state remain accessible on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const home = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(home.violations).toEqual([]);
  for (const slug of ["vision-navigation", "airpocket", "swordsmith-notebook", "gomoku-ai"]) {
    await page.goto(`/projects/${slug}`);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  await page.goto("/lab#memory");
  await page.getByRole("button", { name: "malloc", exact: true }).click();
  await expect(page.locator('.heap-regions [data-allocated="true"]')).toHaveCount(1);
  await page.getByRole("button", { name: "free block 1" }).click();
  await expect(page.locator('.heap-regions [data-allocated="true"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("pausing motion keeps newly opened dialogs readable and functional", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await page.keyboard.press("Control+k");
  await expect(page.locator(".command-palette")).toHaveCSS("opacity", "1");
  await expect(page.locator(".command-palette")).toHaveCSS("filter", "none");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open interactive terminal" }).click();
  const input = page.getByRole("textbox", { name: "Terminal command" });
  await expect(input).toBeFocused();
  await expect(page.locator(".terminal-output")).toHaveCSS("opacity", "1");
  await input.fill("help");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText("whoami");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
