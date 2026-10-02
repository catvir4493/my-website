import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const base = process.argv[2] || "http://localhost:3000";
const output = process.argv[3] || "artifacts/v1.4";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_BROWSER_PATH ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--enable-unsafe-swiftshader"],
});
const errors = [];
const report = {
  samples: [],
  errors,
  caveat:
    "Counts observe GL object lifetimes, not GPU memory bytes. Lost contexts are marked released. The probe retains JS references only for inspection.",
};
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem("marcell:booted", "1");
    window.__materialResources = [];
    window.__disableEmissive = false;
    let hardware = navigator.hardwareConcurrency;
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      get: () => hardware,
    });
    window.__setMaterialHardware = (value) => {
      hardware = value;
    };
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      const gl = getContext.call(this, type, ...args);
      if (!gl || !/webgl/.test(type) || gl.__materialProbed) return gl;
      gl.__materialProbed = true;
      const entry = {
        live: { Texture: new Set(), Buffer: new Set(), Program: new Set(), Framebuffer: new Set() },
        lost: false,
      };
      window.__materialResources.push(entry);
      this.addEventListener("webglcontextlost", () => {
        entry.lost = true;
      });
      for (const kind of Object.keys(entry.live)) {
        const create = gl[`create${kind}`].bind(gl);
        const destroy = gl[`delete${kind}`].bind(gl);
        gl[`create${kind}`] = (...values) => {
          const resource = create(...values);
          if (resource) entry.live[kind].add(resource);
          return resource;
        };
        gl[`delete${kind}`] = (resource) => {
          entry.live[kind].delete(resource);
          return destroy(resource);
        };
      }
      const locations = new WeakMap();
      const getLocation = gl.getUniformLocation.bind(gl);
      gl.getUniformLocation = (program, name) => {
        const location = getLocation(program, name);
        if (location) locations.set(location, name);
        return location;
      };
      const uniform = gl.uniform3f.bind(gl);
      gl.uniform3f = (location, x, y, z) =>
        uniform(
          location,
          ...(window.__disableEmissive &&
          /^(emissive|pointLights\[\d+\]\.color)$/.test(locations.get(location) || "")
            ? [0, 0, 0]
            : [x, y, z]),
        );
      const uniform4 = gl.uniform4f.bind(gl);
      gl.uniform4f = (location, x, y, z, w) =>
        uniform4(
          location,
          x,
          y,
          z,
          window.__disableEmissive && locations.get(location) === "lightChannels" ? 0 : w,
        );
      return gl;
    };
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const snapshot = async (label) => {
    const counts = await page.evaluate(() =>
      window.__materialResources.map((entry) => ({
        lost: entry.lost,
        live: Object.fromEntries(
          Object.entries(entry.live).map(([kind, values]) => [kind, entry.lost ? 0 : values.size]),
        ),
      })),
    );
    report.samples.push({ label, contexts: counts });
    return counts;
  };
  await page.goto(base);
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await expect(page.locator(".core-canvas [data-material-ready]")).toHaveAttribute(
    "data-material-ready",
    "true",
  );
  await page.waitForTimeout(2000);
  const initial = await snapshot("high initial");
  for (let index = 0; index < 3; index++) {
    for (const node of await page.locator(".core-project-node").all()) await node.hover();
  }
  const focused = await snapshot("high after 12 project signals");
  assert.ok(
    focused[0].live.Buffer <= initial[0].live.Buffer + 3,
    "project signals reuse their position buffer",
  );
  await page.mouse.move(20, 20);
  await page.evaluate(() => {
    window.__disableEmissive = true;
  });
  await page.waitForTimeout(500);
  await page.locator(".core-canvas").screenshot({ path: `${output}/core-emissive-disabled.png` });
  await page.evaluate(() => {
    window.__disableEmissive = false;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".core-fallback")).toBeVisible();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${output}/mobile-material-home.png` });
  const mobile = await snapshot("low / mobile releases WebGL");
  assert.ok(
    mobile.every((entry) => entry.lost || Object.values(entry.live).every((value) => value <= 2)),
    "old graphics resources are released",
  );
  await page.evaluate(() => window.__setMaterialHardware(4));
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "medium");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.waitForTimeout(1200);
  await page.locator(".core-canvas").screenshot({ path: `${output}/medium-material-core.png` });
  await snapshot("medium restored");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".core-fallback")).toBeVisible();
  await page.evaluate(() => window.__setMaterialHardware(16));
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".system-root")).toHaveAttribute("data-quality", "high");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.waitForTimeout(1600);
  const restored = await snapshot("high restored");
  const first = focused.findLast((entry) => !entry.lost);
  const last = restored.findLast((entry) => !entry.lost);
  for (const kind of ["Texture", "Buffer", "Program", "Framebuffer"])
    assert.ok(
      last.live[kind] <= first.live[kind] + 4,
      `${kind} resources stay bounded across quality changes`,
    );
  await page.locator(".core-project-node").first().click();
  await expect(page.locator("h1")).toHaveText("Vision Navigation");
  await page.waitForTimeout(1200);
  const detail = await snapshot("project route releases Core");
  assert.ok(
    detail.every((entry) => entry.lost || Object.values(entry.live).every((value) => value <= 2)),
  );
  assert.deepEqual(errors, []);
  report.passed = true;
} finally {
  writeFileSync(`${output}/material-resources.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
