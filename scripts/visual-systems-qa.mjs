import { chromium, webkit } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const baseURL = process.argv[2] || "http://localhost:3000";
const output = process.argv[3] || "artifacts/v1.2";
mkdirSync(output, { recursive: true });
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH || (existsSync(edge) ? edge : undefined),
  args: ["--enable-unsafe-swiftshader"],
});
const routes = [
  "/",
  "/projects",
  "/projects/vision-navigation",
  "/projects/airpocket",
  "/projects/swordsmith-notebook",
  "/projects/gomoku-ai",
  "/lab",
];
const report = [];
let screenshots = 0;
try {
  for (const viewport of [
    { name: "1920", width: 1920, height: 1080 },
    { name: "1440", width: 1440, height: 900 },
    { name: "1366", width: 1366, height: 768 },
    { name: "ipad", width: 820, height: 1180 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of routes) {
      const response = await page.goto(new URL(route, baseURL).href);
      await page.locator("h1").waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (route === "/" && viewport.width > 760)
        await page.locator(".core-canvas canvas").waitFor();
      await page.waitForTimeout(650);
      const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
      await page.screenshot({ path: `${output}/${viewport.name}-${slug}-viewport.png` });
      screenshots++;
      if (["1440", "mobile"].includes(viewport.name)) {
        for (const section of await page.locator("main section.section, .contact-section").all()) {
          await section.scrollIntoViewIfNeeded();
          await page.waitForTimeout(550);
        }
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(550);
        await page.screenshot({
          path: `${output}/${viewport.name}-${slug}-full.png`,
          fullPage: true,
        });
        screenshots++;
      }
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      report.push({
        viewport: viewport.name,
        route,
        status: response.status(),
        overflow: dimensions.width > dimensions.viewport,
        errors: [...errors],
      });
    }
    if (["1440", "mobile"].includes(viewport.name)) {
      for (const id of ["pathfinding", "memory", "converter", "cpu"]) {
        await page.goto(new URL(`/lab#${id}`, baseURL).href);
        await page.locator(".experiment-panel").waitFor();
        if (id === "memory")
          await page.getByRole("button", { name: "malloc", exact: true }).click();
        if (id === "pathfinding")
          await page.getByRole("button", { name: "Step", exact: true }).click();
        await page.locator(".experiment-panel").scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${output}/${viewport.name}-lab-${id}.png` });
        screenshots++;
      }
      await page.goto(baseURL);
      await page.waitForFunction(() =>
        /\d{2}:\d{2}:\d{2}/.test(document.querySelector(".header-time")?.textContent || ""),
      );
      await page.keyboard.press("Control+k");
      await page.getByRole("combobox").fill("vsnnav");
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${output}/${viewport.name}-palette.png` });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Open interactive terminal" }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${output}/${viewport.name}-terminal.png` });
      screenshots += 2;
    }
    console.log(`Captured ${viewport.name}: all seven routes`);
    await context.close();
  }
  const reduced = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await reduced.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
  const page = await reduced.newPage();
  await page.goto(baseURL);
  await page.locator(".core-fallback").waitFor();
  assert.equal(await page.locator(".core-canvas canvas").count(), 0);
  await page.screenshot({ path: `${output}/reduced-motion-home.png` });
  screenshots++;
  await reduced.close();
} finally {
  await browser.close();
}

let webkitResult = {
  tested: false,
  reason: "Playwright WebKit binary unavailable in this environment",
};
if (existsSync(webkit.executablePath())) {
  const safari = await webkit.launch();
  const errors = [];
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await safari.newContext({ viewport });
    await context.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
    const page = await context.newPage();
    page.on("pageerror", (error) => {
      errors.push(error.message);
      console.error(
        JSON.stringify({
          engine: "WebKit",
          viewport,
          route: page.url(),
          message: error.message,
          stack: error.stack,
        }),
      );
    });
    for (const route of routes) {
      // Follow the real navigation path. Whole-document replacement can abort
      // queued RSC prefetches in WebKit even after its network-idle notification.
      if (route === "/") await page.goto(baseURL, { waitUntil: "networkidle" });
      else {
        if (!(await page.locator(`a[href="${route}"]:visible`).count()))
          await page.getByRole("button", { name: "Open navigation" }).click();
        await page.locator(`a[href="${route}"]:visible`).first().click();
        await page.waitForURL(new URL(route, baseURL).href);
        await page.waitForLoadState("networkidle");
      }
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
    }
    await page.getByRole("link", { name: "Marcell.OS home" }).click();
    await page.waitForURL(new URL("/", baseURL).href);
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() =>
      /\d{2}:\d{2}:\d{2}/.test(document.querySelector(".header-time")?.textContent || ""),
    );
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${output}/webkit-${viewport.width}-home.png` });
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox").fill("vsnnav");
    await page.keyboard.press("Enter");
    await page.locator("h1").filter({ hasText: "Vision Navigation" }).waitFor();
    await page.getByRole("link", { name: "Back to archive" }).click();
    await page.locator(".project-card").first().click();
    await page.locator("h1").filter({ hasText: "Vision Navigation" }).waitFor();
    await context.close();
  }
  webkitResult = { tested: true, viewports: [1440, 390], routes: routes.length * 2, errors };
  await safari.close();
}
writeFileSync(
  `${output}/visual-report.json`,
  JSON.stringify({ screenshots, routes: report, webkit: webkitResult }, null, 2),
);
assert.equal(webkitResult.errors?.length || 0, 0, JSON.stringify(webkitResult.errors));
assert.equal(
  report.some((item) => item.status !== 200 || item.overflow || item.errors.length),
  false,
);
console.log(
  JSON.stringify({
    screenshots,
    routes: report.length,
    overflow: 0,
    errors: 0,
    webkit: webkitResult,
  }),
);
