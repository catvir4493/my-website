import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const output = "artifacts/v1.2";
mkdirSync(output, { recursive: true });
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH || (existsSync(edge) ? edge : undefined),
  args: ["--enable-unsafe-swiftshader"],
});
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem("marcell:booted", "1");
    window.__coreStats = { clears: 0, draws: 0, viewTransitions: 0 };
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      for (const name of ["clear", "drawArrays", "drawElements", "drawElementsInstanced"]) {
        const original = proto[name];
        if (!original) continue;
        proto[name] = function (...args) {
          window.__coreStats[name === "clear" ? "clears" : "draws"]++;
          return original.apply(this, args);
        };
      }
    }
    if (document.startViewTransition) {
      const original = document.startViewTransition.bind(document);
      document.startViewTransition = (...args) => {
        window.__coreStats.viewTransitions++;
        return original(...args);
      };
    }
  });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send("Performance.enable");
  await page.goto("http://localhost:3000");
  await page.locator(".core-canvas canvas").waitFor();
  // Let shader compilation and route arrival settle; Lighthouse covers cold startup separately.
  await page.waitForTimeout(2500);
  const metrics = async () => {
    const data = await session.send("Performance.getMetrics");
    return Object.fromEntries(data.metrics.map(({ name, value }) => [name, value]));
  };
  async function sample(label, duration = 1800) {
    const before = await page.evaluate(() => ({ ...window.__coreStats }));
    const start = await metrics();
    const measured = await page.evaluate(async (ms) => {
      const started = performance.now();
      const gaps = [];
      let last = started;
      await new Promise((resolve) => {
        function tick(now) {
          gaps.push(now - last);
          last = now;
          if (now - started >= ms) resolve();
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
      gaps.sort((a, b) => a - b);
      return {
        elapsed: (last - started) / 1000,
        uiFPS: gaps.length / ((last - started) / 1000),
        p95FrameGapMs: gaps[Math.floor(gaps.length * 0.95)],
      };
    }, duration);
    const after = await page.evaluate(() => ({ ...window.__coreStats }));
    const end = await metrics();
    return {
      label,
      ...measured,
      coreFramesPerSecond: (after.clears - before.clears) / measured.elapsed,
      drawsPerCoreFrame: (after.draws - before.draws) / Math.max(1, after.clears - before.clears),
      rendererMainThreadMsPerSecond:
        ((end.TaskDuration - start.TaskDuration) * 1000) / measured.elapsed,
    };
  }
  const samples = [];
  samples.push(await sample("visible idle core"));
  await page.locator(".core-project-node").first().hover();
  await page.waitForTimeout(600);
  samples.push(await sample("project hover / active core"));
  await page.mouse.move(10, 10);
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").waitFor();
  await page.waitForTimeout(600);
  samples.push(await sample("command mode / slowed core"));
  await page.keyboard.press("Escape");
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  samples.push(await sample("core offscreen"));
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector(".footer-controls button").click());
  await page.waitForTimeout(200);
  samples.push(await sample("user paused"));
  await page.evaluate(() => document.querySelector(".footer-controls button").click());
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(200);
  samples.push(await sample("simulated hidden-tab visibilitychange"));
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const beforeTransition = await page.evaluate(() => window.__coreStats.viewTransitions);
  await page.locator(".core-project-node").first().click();
  await page.locator("h1").filter({ hasText: "Vision Navigation" }).waitFor();
  await page.waitForTimeout(700);
  const transitions =
    (await page.evaluate(() => window.__coreStats.viewTransitions)) - beforeTransition;
  await page.goto("http://localhost:3000/projects");
  await page.locator(".project-card").first().click();
  await page.locator("h1").filter({ hasText: "Vision Navigation" }).waitFor();
  await page.waitForTimeout(700);
  const diagramTransitions = await page.evaluate(() => window.__coreStats.viewTransitions);
  await page.goto("http://localhost:3000");
  await page.locator(".core-canvas canvas").waitFor();
  await page.evaluate(() => scrollTo({ top: 1200, behavior: "smooth" }));
  samples.push(await sample("smooth scroll through content"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000");
  await page.locator(".core-fallback").waitFor();
  await page.waitForTimeout(600);
  samples.push(await sample("mobile static core"));
  const result = {
    browser: "Chromium / Edge headless",
    caveat:
      "WebGL may use software rendering. UI FPS measures browser RAF cadence; core frames measure actual GL clears. TaskDuration is renderer main-thread work, not total system CPU. Hidden visibility is simulated.",
    samples,
    viewTransitionsAfterCoreNavigation: transitions,
    sharedDiagramTransitionsObserved: diagramTransitions,
  };
  writeFileSync(`${output}/runtime-performance.json`, JSON.stringify(result, null, 2));
  for (const item of samples.filter((item) => /offscreen|paused|hidden/.test(item.label)))
    assert.equal(item.coreFramesPerSecond, 0, item.label);
  assert.ok(samples[0].coreFramesPerSecond <= 35, "core cadence remains capped");
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
