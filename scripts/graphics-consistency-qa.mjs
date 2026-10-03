import { chromium, webkit } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const base = process.argv[2] || "http://localhost:3000";
const output = process.argv[3] || "artifacts/v1.5.1";
mkdirSync(output, { recursive: true });
const report = [];
const routes = [
  "/",
  "/projects",
  "/projects/vision-navigation",
  "/projects/airpocket",
  "/projects/swordsmith-notebook",
  "/projects/gomoku-ai",
  "/lab",
];
const viewports = [
  [390, 844],
  [768, 1024],
  [840, 849],
  [1024, 768],
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1536, 864],
  [1920, 1080],
  [1920, 1568],
  [2560, 1440],
];
const browsers = [];
async function capture(browser, engine, options) {
  const {
    width,
    height,
    dpr = 1,
    quality = "auto",
    touch = false,
    fineTouch = false,
    motion = "no-preference",
    name,
    routeQA = false,
    group = "viewport-dpr",
  } = options;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    hasTouch: touch,
    isMobile: engine === "Chromium" && touch && !fineTouch,
    reducedMotion: motion,
  });
  await context.addInitScript(
    ({ fineTouch }) => {
      sessionStorage.setItem("marcell:booted", "1");
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
      Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
      if (fineTouch) {
        const native = matchMedia.bind(window);
        window.matchMedia = (query) => {
          const m = native(query);
          if (query.includes("pointer:") || query.includes("hover:"))
            Object.defineProperty(m, "matches", {
              value: query.includes("fine") || query.includes("hover: hover"),
            });
          return m;
        };
      }
    },
    { fineTouch },
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const query = quality === "auto" ? "" : `?quality=${quality}`;
  for (const route of routeQA ? routes : ["/"]) {
    const response = await page.goto(new URL(route + query, base).href, {
      waitUntil: "networkidle",
    });
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(
      () => document.querySelector(".system-root")?.dataset.graphicsReady === "true",
    );
    if (route === "/") {
      const mode = await page.locator(".core-canvas").getAttribute("data-core-mode");
      if (mode !== "static") await page.locator('[data-material-ready="true"]').waitFor();
    }
    await page.waitForTimeout(name ? 1600 : 150);
    const state = await page.evaluate(() => {
      const root = document.querySelector(".system-root");
      const canvas = document.querySelector(".core-canvas canvas");
      const box = canvas?.getBoundingClientRect();
      return {
        layout: root.dataset.layout,
        quality: root.dataset.quality,
        pointer: root.dataset.pointer,
        hover: root.dataset.hover,
        reducedMotion: root.dataset.reducedMotion,
        phonePolicy: root.dataset.mobileStaticCore,
        coreMode: document.querySelector(".core-canvas")?.dataset.coreMode || "absent",
        optics: document.querySelector("[data-optics-mode]")?.dataset.opticsMode || "static",
        material:
          document.querySelector("[data-material-quality]")?.dataset.materialQuality || "static",
        deviceDpr: devicePixelRatio,
        renderDpr: canvas?.dataset.actualRenderDpr || null,
        canvasSize: canvas ? [canvas.width, canvas.height] : null,
        canvasCss: box ? [box.width, box.height] : null,
        overflow: document.documentElement.scrollWidth > innerWidth,
        viewport: [innerWidth, innerHeight],
        screenCss: [screen.width, screen.height],
      };
    });
    assert.equal(response.status(), 200);
    assert.equal(state.overflow, false, `${engine} ${width} ${dpr} ${route} overflow`);
    assert.deepEqual(errors, [], `${engine} ${width} ${dpr} ${route}`);
    assert.equal(
      state.quality,
      quality === "auto" ? (touch && !fineTouch && width < 640 ? "medium" : "high") : quality,
      `${engine} auto capability budget`,
    );
    if (route === "/" && !(touch && !fineTouch && width < 640) && quality !== "low") {
      assert.equal(state.optics, "optics");
      assert.equal(state.material, quality === "auto" ? "high" : quality);
      assert.equal(Number(state.renderDpr), Math.min(dpr, quality === "medium" ? 1.25 : 1.5));
    }
    if (name) {
      const stem = route === "/" ? name : `${name}-${route.slice(1).replaceAll("/", "-")}`;
      await page.screenshot({ path: `${output}/${stem}.png`, scale: "css" });
      if (route === "/")
        await page
          .locator(".core-canvas")
          .screenshot({ path: `${output}/${stem}-core.png`, scale: "css" });
    }
    report.push({
      engine,
      group,
      requested: { width, height, dpr, quality, touch, fineTouch, motion },
      route,
      ...state,
      errors: [...errors],
    });
  }
  await context.close();
}
try {
  const chrome = await chromium.launch({
    channel: "msedge",
    args: ["--enable-unsafe-swiftshader"],
  });
  browsers.push(chrome);
  for (const [width, height] of viewports)
    for (const dpr of [1, 1.25, 1.5, 1.75, 2]) {
      const name =
        width === 840 && dpr === 1.75
          ? "840x849-dpr1.75-auto"
          : width === 1920 && height === 1080 && dpr === 1
            ? "1920x1080-dpr1-auto"
            : width === 1440 && dpr === 1.25
              ? "1440x900-dpr1.25-auto"
              : undefined;
      await capture(chrome, "Chromium", { width, height, dpr, name });
      console.log(`Chromium ${width}×${height} @ ${dpr}: passed`);
    }
  for (const options of [
    {
      width: 840,
      height: 849,
      dpr: 1.75,
      quality: "high",
      name: "840x849-dpr1.75-high",
      routeQA: true,
    },
    {
      width: 840,
      height: 849,
      dpr: 1.75,
      quality: "medium",
      name: "840x849-dpr1.75-medium",
      routeQA: true,
    },
    { width: 1440, height: 900, dpr: 1.25, quality: "high", name: "desktop-high" },
    {
      width: 1440,
      height: 900,
      dpr: 1.25,
      quality: "medium",
      name: "desktop-medium",
      routeQA: true,
    },
    { width: 840, height: 849, dpr: 1.75, quality: "low", name: "compact-low" },
    { width: 1919, height: 1568, dpr: 1, name: "1919x1568-dpr1-auto", routeQA: true },
    { width: 390, height: 844, dpr: 2, touch: true, name: "mobile-390x844", routeQA: true },
    { width: 390, height: 844, dpr: 2, touch: true, quality: "high", name: "mobile-high" },
    { width: 768, height: 1024, dpr: 2, touch: true, name: "tablet-touch" },
    { width: 840, height: 849, dpr: 1.75, touch: true, fineTouch: true, name: "touch-laptop" },
    { width: 840, height: 849, dpr: 1.75, motion: "reduce", name: "compact-reduced-motion" },
  ])
    await capture(chrome, "Chromium", { ...options, group: "feature-policy" });
  // Model the CSS viewport/DPR changes caused by OS scaling, not actual OS settings.
  for (const scale of [1, 1.25, 1.5, 1.75, 2])
    await capture(chrome, "Chromium", {
      width: Math.round(1920 / scale),
      height: Math.round(1080 / scale),
      dpr: scale,
      group: `Windows scaling simulation ${scale * 100}%`,
    });
  for (const zoom of [0.8, 0.9, 1, 1.1, 1.25])
    await capture(chrome, "Chromium", {
      width: Math.round(1440 / zoom),
      height: Math.round(900 / zoom),
      dpr: 1.25 * zoom,
      group: `browser zoom simulation ${zoom * 100}%`,
    });
  const wk = await webkit.launch();
  browsers.push(wk);
  for (const options of [
    {
      width: 840,
      height: 849,
      dpr: 2,
      quality: "high",
      name: "webkit-compact-high",
      routeQA: true,
    },
    {
      width: 840,
      height: 849,
      dpr: 2,
      quality: "medium",
      name: "webkit-compact-medium",
      routeQA: true,
    },
    { width: 1440, height: 900, dpr: 2, name: "webkit-desktop-auto" },
    { width: 390, height: 844, dpr: 2, touch: true, name: "webkit-mobile", routeQA: true },
    { width: 840, height: 849, dpr: 2, motion: "reduce", name: "webkit-reduced" },
    { width: 840, height: 849, dpr: 2, quality: "low", name: "webkit-low" },
  ])
    await capture(wk, "WebKit", { ...options, group: "WebKit policies" });
} finally {
  for (const browser of browsers) await browser.close();
  writeFileSync(
    `${output}/graphics-matrix.json`,
    JSON.stringify(
      {
        caveats: [
          "Headless GPU may use software rendering.",
          "Windows scaling and browser zoom are CSS viewport / DPR simulations, not actual OS or browser UI changes.",
          "Screenshots use CSS-pixel dimensions for comparison; renderer DPR is recorded separately.",
        ],
        cases: report,
      },
      null,
      2,
    ),
  );
}
console.log(`Graphics consistency: ${report.length} cases passed`);
