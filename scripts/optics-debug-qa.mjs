import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const base = process.argv[2] || "http://localhost:3000";
const output = process.argv[3] || "artifacts/v1.5/debug";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--enable-unsafe-swiftshader"],
});
const report = { cameras: [], lights: [], materials: [], lod: [], errors: [] };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem("marcell:booted", "1");
    window.__failedOpticsLinks = 0;
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const get = proto.getProgramParameter;
      proto.getProgramParameter = function (program, parameter) {
        const result = get.call(this, program, parameter);
        if (parameter === this.LINK_STATUS && result === false) window.__failedOpticsLinks++;
        return result;
      };
    }
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.errors.push(message.text());
  });
  await page.goto(`${base}/?debugLighting=1&debugMaterials=1`);
  const canvas = page.locator(".core-canvas [data-material-ready]");
  await expect(canvas).toHaveAttribute("data-material-ready", "true", { timeout: 60000 });
  await expect(canvas).toHaveAttribute("data-optics-mode", "optics");
  const panel = page.locator(".optics-debug");
  await expect(panel).toBeVisible();
  await page.getByLabel("Fixed overview pose").check();
  const capture = async (name) => {
    await panel.evaluate((element) => {
      element.style.visibility = "hidden";
    });
    await page.locator(".core-canvas").screenshot({ path: `${output}/${name}.png` });
    await panel.evaluate((element) => {
      element.style.visibility = "";
    });
  };
  for (const fov of [35, 40, 45, 50]) {
    await page.getByLabel("Camera FOV").selectOption(String(fov));
    await page.waitForTimeout(400);
    await capture(`fov-${fov}`);
    report.cameras.push({ fov, telemetry: await panel.locator("output").innerText() });
  }
  await page.getByLabel("Camera FOV").selectOption("40");
  for (const height of [240, 420, 654]) {
    await page.locator(".core-canvas").evaluate((element, value) => {
      element.style.height = `${value}px`;
    }, height);
    await page.waitForTimeout(500);
    const telemetry = await panel.locator("output").innerText();
    report.lod.push({ height, detail: Number(telemetry.match(/LOD ([\d.]+)/)[1]) });
  }
  assert.equal(report.lod[0].detail, 0, "small projected surfaces skip micro detail");
  assert.ok(
    report.lod[1].detail > 0 && report.lod[1].detail < 1,
    "detail fades between screen-space thresholds",
  );
  assert.equal(report.lod[2].detail, 1);
  await page.locator(".core-canvas").evaluate((element) => {
    element.style.height = "";
  });
  for (const light of ["key", "rim", "fill", "internal", "all"]) {
    await page.getByLabel("Light solo").selectOption(light);
    await page.waitForTimeout(350);
    await capture(`light-${light}`);
    report.lights.push(light);
  }
  for (const material of ["metal", "glass", "pcb", "emissive", "all"]) {
    await page.getByLabel("Material solo").selectOption(material);
    await page.waitForTimeout(350);
    await capture(`material-${material}`);
    report.materials.push(material);
  }
  await page.addStyleTag({ content: ".core-canvas { filter: grayscale(1); }" });
  await capture("core-grayscale");
  await page.reload();
  await expect(canvas).toHaveAttribute("data-material-ready", "true", { timeout: 60000 });
  await page.waitForTimeout(1600);
  await page.addStyleTag({
    content:
      ".hero-visual .floating-label,.hero-visual .core-project-nodes,.hero-visual .core-label,.core-bottom,.core-environment-label { visibility:hidden!important; }",
  });
  await capture("core-without-hud");
  report.normalFailedLinks = await page.evaluate(() => window.__failedOpticsLinks);
  assert.equal(report.normalFailedLinks, 0);
  await page.goto(`${base}/?debugLighting=1&shaderFault=1`);
  await expect(canvas).toHaveAttribute("data-optics-mode", "legacy", { timeout: 60000 });
  await expect(canvas).toHaveAttribute("data-material-ready", "true", { timeout: 60000 });
  report.injectedFailedLinks = await page.evaluate(() => window.__failedOpticsLinks);
  assert.ok(report.injectedFailedLinks > 0, "a real shader link failure triggered recovery");
  await capture("recovered-v1.4-materials");
  await page.locator(".core-project-node").first().click();
  await expect(page.locator("h1")).toHaveText("Vision Navigation");
  assert.deepEqual(report.errors, []);
  report.passed = true;
} finally {
  writeFileSync(`${output}/debug-report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
