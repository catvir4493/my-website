import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const output = "artifacts/v1.5.1/before";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--enable-unsafe-swiftshader"] });
const report = [];
try {
  for (const [width, height, dpr] of [
    [840, 849, 1.75],
    [1919, 1568, 1],
    [1440, 900, 1.25],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: dpr,
    });
    await context.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
    const page = await context.newPage();
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.locator('[data-material-ready="true"]').waitFor();
    await page.waitForTimeout(1600);
    const name = `${width}x${height}-dpr${dpr}`;
    await page.screenshot({ path: `${output}/${name}.png`, scale: "css" });
    await page
      .locator(".core-canvas")
      .screenshot({ path: `${output}/${name}-core.png`, scale: "css" });
    report.push(
      await page.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
        dpr: devicePixelRatio,
        quality: document.querySelector(".system-root").dataset.quality,
        core: document.querySelector(".core-canvas").getBoundingClientRect().toJSON(),
        hover: matchMedia("(hover:hover)").matches,
        fine: matchMedia("(pointer:fine)").matches,
      })),
    );
    await context.close();
  }
} finally {
  await browser.close();
  writeFileSync(`${output}/baseline.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report));
