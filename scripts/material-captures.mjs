import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const base = process.argv[2] || "http://localhost:3000";
const output = process.argv[3] || "artifacts/v1.4/after";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_BROWSER_PATH ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--enable-unsafe-swiftshader"],
});
const report = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const route of [
    "/",
    "/projects/vision-navigation",
    "/projects/airpocket",
    "/projects/swordsmith-notebook",
    "/projects/gomoku-ai",
    "/projects",
  ]) {
    await page.goto(new URL(route, base).href, { waitUntil: "networkidle" });
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (route === "/") await page.locator('.core-canvas [data-material-ready="true"]').waitFor();
    await page.waitForTimeout(1200);
    // Resolve both diagram versions to the same complete illustrative state.
    await page.evaluate(() =>
      document
        .querySelectorAll(".project-visual")
        .forEach((element) => element.setAttribute("data-play", "static")),
    );
    const name = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
    await page.screenshot({ path: `${output}/${name}.png` });
    if (route === "/")
      await page.locator(".core-canvas").screenshot({ path: `${output}/core.png` });
    report.push({ route, errors: [...errors] });
  }
  await context.close();
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  writeFileSync(`${output}/captures.json`, JSON.stringify(report, null, 2));
}
console.log(`Material comparison: ${report.length} routes captured at 1440×900`);
