import { chromium, webkit, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const base = process.argv[2] || "http://localhost:3000";
const output = process.argv[3] || "artifacts/v1.5.1";
mkdirSync(output, { recursive: true });
const report = [];
for (const engine of ["Chromium", "WebKit"]) {
  const browser = await (engine === "Chromium"
    ? chromium.launch({ channel: "msedge", args: ["--enable-unsafe-swiftshader"] })
    : webkit.launch());
  try {
    for (const policy of [
      "unavailable",
      "uncertain",
      "cpu-medium",
      "weak",
      "no-hover",
      "none-pointer",
      "normal",
    ]) {
      const context = await browser.newContext({
        viewport: { width: 840, height: 849 },
        deviceScaleFactor: 1.75,
      });
      await context.addInitScript(
        ({ policy }) => {
          sessionStorage.setItem("marcell:booted", "1");
          Object.defineProperty(navigator, "hardwareConcurrency", {
            get: () => (policy === "cpu-medium" ? 4 : 16),
          });
          if (["no-hover", "none-pointer"].includes(policy)) {
            const native = matchMedia.bind(window);
            window.matchMedia = (query) => {
              const m = native(query);
              if (query.includes("hover:")) Object.defineProperty(m, "matches", { value: false });
              if (policy === "none-pointer" && query.includes("pointer:"))
                Object.defineProperty(m, "matches", { value: false });
              return m;
            };
          }
          if (["unavailable", "uncertain", "weak"].includes(policy)) {
            Object.defineProperty(window, "Worker", { value: undefined });
            const native = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function (type, ...args) {
              if (policy === "unavailable" && String(type).includes("webgl")) return null;
              const gl = native.call(this, type, ...args);
              if (gl && type === "webgl2" && this.dataset.graphicsProbe) {
                if (policy === "uncertain") gl.getShaderPrecisionFormat = () => null;
                if (policy === "weak") {
                  const get = gl.getParameter.bind(gl);
                  gl.getParameter = (p) => (p === gl.MAX_TEXTURE_SIZE ? 1024 : get(p));
                }
              }
              return gl;
            };
          }
        },
        { policy },
      );
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(new URL("/?debugGraphics=1", base).href, { waitUntil: "networkidle" });
      const quality =
        policy === "unavailable" || policy === "weak"
          ? "low"
          : policy === "uncertain" || policy === "cpu-medium"
            ? "medium"
            : "high";
      await expect(page.locator(".system-root")).toHaveAttribute("data-quality", quality);
      await expect(page.locator(".graphics-debug")).toBeVisible();
      if (quality === "low") await expect(page.locator(".core-fallback")).toBeVisible();
      else await expect(page.locator('[data-material-ready="true"]')).toBeVisible();
      if (["no-hover", "none-pointer"].includes(policy))
        await expect(page.locator("html")).not.toHaveClass(/custom-cursor-enabled/);
      if (policy === "normal") {
        await page.screenshot({
          path: `${output}/${engine.toLowerCase()}-graphics-debug.png`,
          scale: "css",
        });
        await page.locator(".graphics-debug summary").click();
        await page.evaluate(() => {
          window.__originalCoreCanvas = document.querySelector(".core-canvas canvas");
        });
        for (const width of [1919, 840, 768, 700, 640, 390, 840]) {
          await page.setViewportSize({ width, height: 849 });
          await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "high");
          await expect(page.locator(".system-root")).toHaveAttribute(
            "data-layout",
            width < 640
              ? "phone"
              : width < 1200
                ? "compact-desktop"
                : width >= 1800
                  ? "wide-desktop"
                  : "desktop",
          );
          await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
          assert.equal(
            await page.evaluate(
              () => window.__originalCoreCanvas === document.querySelector(".core-canvas canvas"),
            ),
            true,
          );
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            false,
            `${engine} width ${width}`,
          );
        }
        await page.evaluate(() => {
          Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 2 });
          dispatchEvent(new Event("resize"));
        });
        await expect(page.locator("canvas")).toHaveAttribute("data-actual-render-dpr", "1.5");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(page.locator(".core-canvas")).toHaveAttribute("data-core-mode", "frozen");
        await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "high");
      }
      if (policy === "unavailable") {
        await page.evaluate(() => history.pushState(null, "", "?quality=high&debugGraphics=1"));
        await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "high");
        await expect(page.locator(".core-fallback")).toBeVisible();
        await expect(page.locator(".core-canvas canvas")).toHaveCount(0);
      }
      assert.deepEqual(errors, []);
      report.push({ engine, policy, quality, passed: true, errors });
      await context.close();
      console.log(`${engine}: ${policy} passed`);
    }
  } finally {
    await browser.close();
    writeFileSync(`${output}/graphics-controls.json`, JSON.stringify(report, null, 2));
  }
}
console.log(`Graphics controls: ${report.length} policy checks passed`);
