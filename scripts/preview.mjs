import { chromium } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";

mkdirSync("artifacts", { recursive: true });
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH || (existsSync(edge) ? edge : undefined),
  args: ["--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    deviceScaleFactor: 1,
  });
  await page.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://localhost:3000");
  await page.locator(".core-canvas canvas").waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "artifacts/home-desktop.png" });
  await page.screenshot({ path: "artifacts/home-full.png", fullPage: true });
  await page.goto("http://localhost:3000/lab");
  await page.screenshot({ path: "artifacts/lab-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000");
  await page.screenshot({ path: "artifacts/home-mobile-viewport.png" });
  await page.screenshot({ path: "artifacts/home-mobile.png", fullPage: true });
  console.log(
    JSON.stringify({
      screenshots: ["home-desktop", "home-full", "lab-desktop", "home-mobile"],
      errors,
    }),
  );
} finally {
  await browser.close();
}
