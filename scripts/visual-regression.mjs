import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
const baseURL = process.argv[2] || "http://localhost:3000";
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
const output = "artifacts/v1.1";
mkdirSync(output, { recursive: true });
const report = [];
for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 900, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of routes) {
    const response = await page.goto(new URL(route, baseURL).href, { waitUntil: "networkidle" });
    await page.locator("h1").waitFor();
    // Reveal viewport-triggered sections before capturing the full page.
    for (const section of await page
      .locator("main > section, main section.section, main .contact-section")
      .all()) {
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
    await page.screenshot({ path: `${output}/${viewport.name}-${slug}.png`, fullPage: true });
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    report.push({
      viewport: viewport.name,
      route,
      status: response.status(),
      overflow: dimensions.width > dimensions.viewport,
      errors: [...errors],
    });
  }
  for (const experimentId of ["pathfinding", "converter", "memory"]) {
    await page.goto(new URL(`/lab#${experimentId}`, baseURL).href);
    await page.locator(".experiment-panel").waitFor();
    await page.locator(".experiment-panel").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `${output}/${viewport.name}-lab-${experimentId}.png`,
      fullPage: true,
    });
  }
  await context.close();
}
writeFileSync(`${output}/visual-report.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log(
  JSON.stringify(
    {
      captures: 30,
      routes: report.length,
      overflow: report.filter((item) => item.overflow),
      errors: report.filter((item) => item.errors.length),
    },
    null,
    2,
  ),
);
