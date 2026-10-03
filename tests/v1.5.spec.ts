import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
});

test("production ignores development shader faults and camera controls", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/?debugLighting=1&debugMaterials=1&shaderFault=1");
  await expect(page.locator('.core-canvas [data-material-ready="true"]')).toBeVisible();
  await expect(page.locator(".core-canvas [data-optics-mode]")).toHaveAttribute(
    "data-optics-mode",
    "optics",
  );
  await expect(page.locator(".optics-debug")).toHaveCount(0);
  await page.locator(".core-project-node").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toHaveText("Vision Navigation");
  expect(errors).toEqual([]);
});

test("command and lab focus preserve keyboard controls and static reduced-motion visuals", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".header-time")).toHaveText(/\d{2}:\d{2}:\d{2}/);
  await page.keyboard.press("Control+k");
  await expect(page.locator(".system-root")).toHaveAttribute("data-optics-focus", "COMMAND_FOCUS");
  await expect(page.getByRole("combobox")).toBeFocused();
  await page.keyboard.press("Escape");
  await page.goto("/lab");
  await expect(page.locator(".system-root")).toHaveAttribute("data-optics-focus", "LAB_FOCUS");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/vision-navigation");
  await expect(page.locator(".project-detail-visual")).toContainText("SYSTEM VISUALIZATION");
  const animation = await page
    .locator(".optical-sensor")
    .evaluateAll((elements) =>
      elements.every((element) => getComputedStyle(element).animationName === "none"),
    );
  expect(animation).toBe(true);
  await page.goto("/");
  await expect(page.locator(".core-canvas")).toHaveAttribute("data-core-mode", "frozen");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.locator(".core-project-node").last().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toHaveText("Gomoku AI");
});
