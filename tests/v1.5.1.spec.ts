import { test, expect } from "@playwright/test";
import { decideQuality, type GraphicsCapabilities } from "../lib/graphics/capabilities";
import { capRenderDpr, classifyLayout } from "../lib/graphics/profile";

const capable: GraphicsCapabilities = {
  webgl2: true,
  contextSuccess: true,
  maxTextureSize: 16384,
  maxRenderbufferSize: 16384,
  shaderPrecision: 23,
  hardwareConcurrency: 16,
  deviceMemory: 8,
};
test("capability policy treats uncertain support conservatively and genuinely weak support as LOW", () => {
  expect(decideQuality(capable).quality).toBe("high");
  expect(decideQuality({ ...capable, contextSuccess: null }).quality).toBe("medium");
  expect(decideQuality({ ...capable, hardwareConcurrency: null }).quality).toBe("medium");
  expect(decideQuality({ ...capable, shaderPrecision: null }).quality).toBe("medium");
  expect(decideQuality({ ...capable, hardwareConcurrency: 4 }).quality).toBe("medium");
  expect(decideQuality({ ...capable, deviceMemory: 2 }).quality).toBe("medium");
  expect(decideQuality({ ...capable, maxTextureSize: 1024 }).quality).toBe("low");
  expect(decideQuality({ ...capable, shaderPrecision: 10 }).quality).toBe("low");
  expect(decideQuality({ ...capable, webgl2: false }).quality).toBe("low");
  expect(classifyLayout(840, true, true)).toBe("compact-desktop");
  expect(classifyLayout(840, false, false)).toBe("tablet");
  for (const dpr of [1, 1.25, 1.5, 1.75, 2])
    expect(capRenderDpr(dpr, "high")).toBe(Math.min(dpr, 1.5));
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("marcell:booted", "1");
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
  });
});

test("high DPI compact laptop retains HIGH optics and its renderer across resize, DPR and motion changes", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 840, height: 849 },
    deviceScaleFactor: 1.75,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    sessionStorage.setItem("marcell:booted", "1");
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
    const native = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const value = native(query);
      if (query.includes("pointer:") || query.includes("hover:"))
        Object.defineProperty(value, "matches", {
          value: query.includes("fine") || query.includes("hover: hover"),
        });
      return value;
    };
  });
  const page = await context.newPage();
  await page.goto("/?debugGraphics=1");
  const root = page.locator(".system-root");
  await expect(root).toHaveAttribute("data-layout", "compact-desktop");
  await expect(root).toHaveAttribute("data-quality", "high");
  await expect(page.locator('[data-material-ready="true"]')).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute("data-actual-render-dpr", "1.5");
  await page.evaluate(() => {
    (window as Window & { originalCanvas?: Element | null }).originalCanvas =
      document.querySelector(".core-canvas canvas");
  });
  await page.setViewportSize({ width: 1919, height: 1568 });
  await expect(root).toHaveAttribute("data-layout", "wide-desktop");
  await expect(root).toHaveAttribute("data-quality", "high");
  await page.evaluate(() => {
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 1.25 });
    dispatchEvent(new Event("resize"));
  });
  await expect(page.locator("canvas")).toHaveAttribute("data-actual-render-dpr", "1.25");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".core-canvas")).toHaveAttribute("data-core-mode", "frozen");
  await expect(root).toHaveAttribute("data-quality", "high");
  expect(
    await page.evaluate(
      () =>
        (window as Window & { originalCanvas?: Element | null }).originalCanvas ===
        document.querySelector(".core-canvas canvas"),
    ),
  ).toBe(true);
  await context.close();
});

test("URL controls affect their own dimension and synchronize during client navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 840, height: 849 });
  await page.goto("/?quality=medium&layout=wide");
  const root = page.locator(".system-root");
  await expect(root).toHaveAttribute("data-quality", "medium");
  await expect(root).toHaveAttribute("data-layout", "compact-desktop");
  await expect(page.locator(".graphics-debug")).toHaveCount(0);
  await page.evaluate(() =>
    history.pushState(null, "", "?quality=low&debugGraphics=1&layout=tablet"),
  );
  await expect(root).toHaveAttribute("data-quality", "low");
  await expect(root).toHaveAttribute("data-layout", "tablet");
  await expect(page.locator(".core-fallback")).toBeVisible();
  await expect(page.locator(".graphics-debug")).toContainText("URL quality override");
  await page.evaluate(() =>
    history.pushState(null, "", "?quality=high&debugGraphics=1&layout=compact"),
  );
  await expect(root).toHaveAttribute("data-quality", "high");
  await expect(page.locator('[data-material-ready="true"]')).toBeVisible();
  await page.goBack();
  await expect(root).toHaveAttribute("data-quality", "low");
});

test("touch-primary phone policy remains separate from forced HIGH graphics", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/?quality=high&debugGraphics=1");
  await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "high");
  await expect(page.locator(".system-root")).toHaveAttribute("data-layout", "phone");
  await expect(page.locator(".core-canvas")).toHaveAttribute("data-static-policy", "touch-phone");
  await expect(page.locator(".core-canvas canvas")).toHaveCount(0);
  await expect(page.locator(".graphics-debug")).toContainText("product policy");
  await expect(page.locator("html")).not.toHaveClass(/custom-cursor-enabled/);
  await page.locator(".graphics-debug summary").click();
  await page.locator(".core-project-node").first().click();
  await expect(page.locator("h1")).toHaveText("Vision Navigation");
  await context.close();
});

test("static phone defers unused GPU startup and retains its conservative budget on rotation", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    sessionStorage.setItem("marcell:booted", "1");
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
  });
  const page = await context.newPage();
  const probes: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("graphics-capabilities.worker.js")) probes.push(request.url());
  });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await expect(page.locator(".system-root")).toHaveAttribute("data-graphics-probe", "deferred");
  await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "medium");
  expect(probes).toEqual([]);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('[data-material-ready="true"]')).toBeVisible();
  await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "medium");
  expect(probes).toHaveLength(1);
  await context.close();
});

test("unavailable WebGL keeps the composition and project navigation usable even with HIGH override", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "Worker", { value: undefined });
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof native>
    ) {
      return String(args[0]).includes("webgl") ? null : native.apply(this, args);
    } as typeof native;
  });
  await page.goto("/?quality=high&debugGraphics=1");
  await expect(page.locator(".core-fallback")).toBeVisible();
  await expect(page.locator(".core-canvas canvas")).toHaveCount(0);
  await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "high");
  await expect(page.locator(".graphics-debug")).toContainText("WebGL unavailable");
  await page.locator(".core-project-node").last().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toHaveText("Gomoku AI");
});
