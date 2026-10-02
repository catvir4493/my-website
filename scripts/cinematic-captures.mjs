import { chromium, expect } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const baseURL = process.argv[2] || "http://localhost:3000";
const output = process.argv[3] || "artifacts/v1.3";
mkdirSync(output, { recursive: true });
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({
  executablePath: existsSync(edge) ? edge : undefined,
  args: ["--enable-unsafe-swiftshader"],
});
const report = { errors: [], sections: [], phases: [], screenshots: 0 };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  const capture = async (name, locator = page) => {
    await locator.screenshot({ path: `${output}/cinematic-${name}.png` });
    report.screenshots++;
  };
  await page.goto(baseURL);
  await page.locator(".hero-startup").waitFor();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  await capture("intro");
  await expect(page.locator(".hero-startup")).toHaveCount(0, { timeout: 2000 });
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await capture("stable");
  for (const id of ["about", "projects", "skills", "telemetry", "timeline", "contact"]) {
    const section = page.locator(`#${id}`);
    await section.evaluate((element) =>
      scrollTo({
        top: element.getBoundingClientRect().top + scrollY - innerHeight * 0.4 + 36,
        behavior: "instant",
      }),
    );
    await expect(section).toHaveAttribute("data-attention", "focus");
    await page.waitForTimeout(400);
    await capture(`focus-${id}`);
    report.sections.push(id);
  }
  const card = page.locator('[data-project="vision-navigation"]').first();
  await card.hover();
  await expect(card).toHaveAttribute("data-emphasis", "focus");
  await page.waitForTimeout(400);
  await capture("project-focus");
  await card.click();
  await expect(page.locator("h1")).toHaveText("Vision Navigation");
  await capture("project-handoff");
  const hero = page.locator(".project-detail-visual");
  await hero.scrollIntoViewIfNeeded();
  for (let stage = 0; stage < 6; stage++) {
    await page.waitForTimeout(stage === 0 ? 200 : 650);
    await capture(`vision-stage-${stage}`, hero);
  }
  for (let phase = 0; phase < 4; phase++) {
    await page
      .locator(`[data-vision-phase="${phase}"]`)
      .evaluate((element) =>
        scrollTo({
          top: element.getBoundingClientRect().top + scrollY - innerHeight * 0.45 + 36,
          behavior: "instant",
        }),
      );
    await expect(page.locator(".vision-story")).toHaveAttribute("data-phase", String(phase));
    await page.waitForTimeout(550);
    await capture(`vision-story-${phase}`);
    report.phases.push(phase);
  }
  await page.getByRole("link", { name: "Marcell.OS home" }).click();
  await expect(page.locator("h1")).toContainText("Marcell.");
  await page.getByRole("button", { name: "Open interactive terminal" }).click();
  await page.waitForTimeout(450);
  await capture("shell-focus");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(450);
  await capture("command-focus");
  expect(report.errors).toEqual([]);
  writeFileSync(`${output}/cinematic-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await context.close();
} finally {
  await browser.close();
}
