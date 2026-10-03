import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const base = process.argv[2] || "https://marcell-os.vercel.app";
const output = process.argv[3] || "artifacts/v1.5.1/deployment";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--enable-unsafe-swiftshader"] });
const report = {
  base,
  version: "1.5.1",
  checkedAt: new Date().toISOString(),
  routes: [],
  interactions: [],
  errors: [],
};
try {
  for (const device of [
    { width: 1440, height: 900, dpr: 1.25, touch: false },
    { width: 840, height: 849, dpr: 1.75, touch: false },
    { width: 390, height: 844, dpr: 2, touch: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.dpr,
      hasTouch: device.touch,
      isMobile: device.touch,
    });
    await context.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
    const page = await context.newPage();
    page.on("pageerror", (e) => report.errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") report.errors.push(m.text());
    });
    for (const route of [
      "/",
      "/projects",
      "/projects/vision-navigation",
      "/projects/airpocket",
      "/projects/swordsmith-notebook",
      "/projects/gomoku-ai",
      "/lab",
    ]) {
      const response = await page.goto(base + route, { waitUntil: "networkidle" });
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("footer")).toContainText("1.5.1");
      await expect(page.locator("footer")).toContainText("CROSS-DEVICE VISUAL CONSISTENCY");
      assert.equal(response.status(), 200);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      report.routes.push({ device, route, status: 200, overflow: false });
    }
    await page.goto(base, { waitUntil: "networkidle" });
    await expect(page.locator(".system-root")).toHaveAttribute("data-graphics-ready", "true");
    if (device.touch) await expect(page.locator(".core-fallback")).toBeVisible();
    else {
      await expect(page.locator('[data-material-ready="true"]')).toBeVisible();
      await expect(page.locator("[data-optics-mode]")).toHaveAttribute(
        "data-optics-mode",
        "optics",
      );
      if (device.width === 840)
        await expect(page.locator(".system-root")).toHaveAttribute(
          "data-layout",
          "compact-desktop",
        );
    }
    const graphics = await page
      .locator(".system-root")
      .evaluate((root) => ({
        layout: root.dataset.layout,
        quality: root.dataset.quality,
        probe: root.dataset.graphicsProbe,
        phonePolicy: root.dataset.mobileStaticCore,
      }));
    await page.screenshot({ path: `${output}/${device.width}-home.png`, scale: "css" });
    await page.getByRole("button", { name: "Open interactive terminal" }).click();
    const input = page.getByRole("textbox", { name: "Terminal command" });
    await input.fill("neofetch");
    await input.press("Enter");
    await expect(page.getByRole("dialog")).toContainText("v1.5.1");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("combobox")).toBeFocused();
    await page.getByRole("combobox").fill("vsnnav");
    await page.keyboard.press("Enter");
    await expect(page.locator("h1")).toHaveText("Vision Navigation");
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator(".core-project-node").last().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("h1")).toHaveText("Gomoku AI");
    await page.goto(base + "/projects", { waitUntil: "networkidle" });
    await page.locator(".project-card").first().click();
    await expect(page.locator("h1")).toHaveText("Vision Navigation");
    await page.goto(base + "/lab#memory");
    await page.getByRole("button", { name: "malloc", exact: true }).click();
    await expect(page.locator('.heap-regions [data-allocated="true"]')).toHaveCount(1);
    await page.getByRole("button", { name: "free block 1" }).click();
    await expect(page.locator('.heap-regions [data-allocated="true"]')).toHaveCount(0);
    await page.goto(base + "/lab#pathfinding");
    await page.getByRole("button", { name: "Step", exact: true }).click();
    report.interactions.push({
      device,
      graphics,
      terminal: true,
      paletteKeyboard: true,
      coreNavigation: true,
      cards: true,
      memory: true,
      pathfinding: true,
    });
    await context.close();
    console.log(`Production smoke: ${device.width}px passed`);
  }
  const context = await browser.newContext({
    viewport: { width: 840, height: 849 },
    deviceScaleFactor: 1.75,
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
  const page = await context.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  await page.goto(base + "/?quality=high&debugGraphics=1", { waitUntil: "networkidle" });
  await expect(page.locator(".graphics-debug")).toBeVisible();
  await expect(page.locator('[data-material-ready="true"]')).toBeVisible();
  await expect(page.locator(".core-canvas")).toHaveAttribute("data-core-mode", "frozen");
  await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "high");
  await expect(page.locator("canvas")).toHaveAttribute("data-actual-render-dpr", "1.5");
  await expect(page.locator(".graphics-debug")).toContainText("URL quality override");
  await page.screenshot({ path: `${output}/840-debug-reduced.png`, scale: "css" });
  report.reducedMotionHigh = true;
  report.productionQueryControls = true;
  const response = await context.request.get(base + "/api/github");
  assert.equal(response.status(), 200);
  const data = await response.json();
  assert.equal(data.status, "connected");
  assert.ok(JSON.stringify(data).includes("catvir4493"));
  report.github = { status: data.status, account: "catvir4493" };
  await context.close();
  assert.deepEqual(report.errors, []);
  report.passed = true;
} finally {
  await browser.close();
  writeFileSync(`${output}/smoke.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report));
