import { chromium, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

const output = process.argv[2] || "artifacts/v1.5";
const browser = await chromium.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(pathToFileURL(resolve(`${output}/comparison.html`)).href);
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  );
  await expect(page.locator("img")).toHaveCount(14);
  await expect(page.getByRole("slider")).toHaveCount(7);
  for (const range of await page.getByRole("slider").all()) {
    await range.fill("25");
    await expect(range).toHaveValue("25");
    await range.focus();
    await page.keyboard.press("End");
    await expect(range).toHaveValue("100");
  }
  const stage = page.locator(".comparison").first();
  await stage.scrollIntoViewIfNeeded();
  const box = await stage.boundingBox();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.4, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByRole("slider").first()).toHaveValue("80");
  const split = await stage.evaluate((element) => element.style.getPropertyValue("--split"));
  await expect(stage).toHaveCSS("--split", split);
  await page.getByRole("slider").first().fill("50");
  await page.screenshot({ path: `${output}/comparison-preview.png` });
  writeFileSync(
    `${output}/comparison-qa.json`,
    JSON.stringify(
      { images: 14, sliders: 7, keyboard: true, pointerDrag: true, passed: true },
      null,
      2,
    ),
  );
  console.log("Seven comparisons passed image, keyboard and pointer-drag checks");
} finally {
  await browser.close();
}
