import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
});

test("scroll focus hands off decoration without dimming readable copy", async ({ page }) => {
  await page.goto("/");
  const about = page.locator("#about");
  const before = await about
    .locator(".profile-statement > p")
    .first()
    .evaluate((element) => ({
      opacity: getComputedStyle(element).opacity,
      color: getComputedStyle(element).color,
    }));
  await about.scrollIntoViewIfNeeded();
  await expect(about).toHaveAttribute("data-attention", "focus");
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await expect(about).toHaveAttribute("data-attention", "past");
  const after = await about
    .locator(".profile-statement > p")
    .first()
    .evaluate((element) => ({
      opacity: getComputedStyle(element).opacity,
      color: getComputedStyle(element).color,
    }));
  expect(after).toEqual(before);
  await expect(page.locator(".visual-environment")).toHaveAttribute("data-section", "skills");
});

test("archive hover routes the existing core signal and local atmosphere", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const card = page.locator('[data-project="airpocket"]').first();
  await card.hover();
  await expect(card).toHaveAttribute("data-emphasis", "focus");
  await expect(page.locator(".core-canvas")).toHaveAttribute("data-signal", "airpocket");
  await expect(page.locator(".visual-environment")).toHaveAttribute(
    "data-project-focus",
    "airpocket",
  );
  await expect(page.locator('[data-project="vision-navigation"]').first()).toHaveAttribute(
    "data-emphasis",
    "quiet",
  );
  await card.click();
  await expect(page.locator("h1")).toHaveText("AirPocket");
  await expect(page.locator(".project-detail-top .project-identity")).toHaveText("PROJECT_002");
  await expect(page.locator(".route-signal")).toHaveCount(0, { timeout: 3000 });
  await page.goBack();
  await expect(page.locator(".project-card")).toHaveCount(4);
});

test("quiet mode rests visuals while keeping terminal and keyboard controls usable", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await expect(page.locator(".system-root")).toHaveAttribute("data-quiet", "true", {
    timeout: 15000,
  });
  await page.keyboard.press("Control+k");
  await expect(page.locator(".system-root")).toHaveAttribute("data-quiet", "false");
  await expect(page.getByRole("combobox")).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open interactive terminal" }).click();
  await expect(page.locator(".system-root")).toHaveAttribute("data-shell-mode", "true");
  await expect(page.locator(".header-status")).toContainText("SYSTEM SHELL ACTIVE");
  await expect(page.locator("html")).not.toHaveClass(/custom-cursor-enabled/);
  const input = page.getByRole("textbox", { name: "Terminal command" });
  await input.fill("neofetch");
  await input.press("Enter");
  await expect(page.getByRole("dialog")).toContainText("v1.5.1");
  await page.keyboard.press("Escape");
  await expect(page.locator(".system-root")).toHaveAttribute("data-shell-mode", "false");
});

test("vision sidebar inherits successive stages from unchanged case-study sections", async ({
  page,
}) => {
  await page.goto("/projects/vision-navigation");
  await expect(page.locator(".header-time")).toHaveText(/\d{2}:\d{2}:\d{2}/);
  for (let phase = 0; phase < 4; phase++) {
    await page.locator(`main [data-vision-phase="${phase}"]`).evaluate((element) =>
      scrollTo({
        top: element.getBoundingClientRect().top + scrollY - innerHeight * 0.45 + 36,
        behavior: "instant",
      }),
    );
    await expect(page.locator("main .vision-story")).toHaveAttribute("data-phase", String(phase));
  }
  await expect(page.locator(".vision-story-phase")).toHaveText("ACTIONABLE FEEDBACK");
  await expect(page.locator(".project-detail-copy")).toContainText("What works today.");
});

test("small diagrams draw one signal while project hero stages share a coherent six-second cycle", async ({
  page,
}) => {
  await page.goto("/projects");
  const diagram = page.locator(".visual-vision");
  await expect(diagram).toHaveAttribute("data-play", "once");
  await expect(diagram).toHaveAttribute("data-visual-entered", "true");
  await expect(diagram.locator(".diagram-link")).toHaveCSS("animation-iteration-count", "1");
  await page.locator('[data-project="vision-navigation"]').click();
  const hero = page.locator(".project-detail-visual .project-visual");
  await expect(hero).toHaveAttribute("data-play", "loop");
  await expect(hero.locator('[data-step="5"]')).toHaveCSS("animation-duration", "6.4s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(hero).toHaveAttribute("data-play", "static");
  expect(await hero.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
});

test("small desktop windows preserve project motifs and input interactions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/custom-cursor-enabled/);
  await page.locator(".core-project-node").first().click();
  await expect(page.locator("h1")).toHaveText("Vision Navigation");
  await expect(page.locator(".project-detail-visual .project-visual")).toHaveAttribute(
    "data-play",
    "loop",
  );
});

test("a genuinely pending project keeps its identifier and resolves without a navigation delay", async ({
  page,
}) => {
  let release: () => void = () => {};
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/projects\/vision-navigation\?.*_rsc=/, async (route) => {
    await waiting;
    await route.continue();
  });
  await page.goto("/");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.locator(".core-project-node").first().click();
  await expect(page.locator(".route-signal")).toContainText("PROJECT_001");
  await expect(page.locator(".route-signal")).not.toContainText("MODULE READY");
  release();
  await expect(page.locator("h1")).toHaveText("Vision Navigation");
  await expect(page.locator(".project-detail-visual .project-visual")).toHaveAttribute(
    "data-visual-entered",
    "true",
  );
});

test("unknown routes retain a readable recoverable signal-loss state", async ({ page }) => {
  const response = await page.goto("/route-signal-missing");
  expect(response?.status()).toBe(404);
  await expect(page.locator("main")).toContainText("ROUTE SIGNAL LOST / ERR_404");
  await page.getByRole("link", { name: "Return to core" }).click();
  await expect(page.locator("h1")).toContainText("Marcell.");
});

test("cursor follows the surface under a stationary pointer after scrolling", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.locator('[data-project="vision-navigation"]').hover();
  await expect(page.locator(".cursor-ring")).toHaveText("OPEN");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator(".cursor-ring")).toHaveText("");
  await expect(page.locator(".cursor-ring")).toHaveAttribute("data-hover", "false");
});
