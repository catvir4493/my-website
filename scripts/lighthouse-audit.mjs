import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { launch } from "chrome-launcher";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";

const url = process.argv[2] || "http://localhost:3000";
const output = process.argv[3] || "artifacts/v1.3";
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
mkdirSync(output, { recursive: true });
for (const mode of ["desktop", "mobile"]) {
  const probe = createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const chrome = await launch({
    port,
    chromePath: process.env.PLAYWRIGHT_BROWSER_PATH || (existsSync(edge) ? edge : undefined),
    chromeFlags: ["--headless=new", "--enable-unsafe-swiftshader"],
    logLevel: "silent",
  });
  try {
    const result = await lighthouse(
      url,
      {
        port: chrome.port,
        logLevel: "error",
        output: ["json", "html"],
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
      mode === "desktop" ? desktopConfig : undefined,
    );
    writeFileSync(`${output}/lighthouse-${mode}.json`, result.report[0]);
    writeFileSync(`${output}/lighthouse-${mode}.html`, result.report[1]);
    console.log(
      JSON.stringify({
        mode,
        scores: Object.fromEntries(
          Object.entries(result.lhr.categories).map(([name, category]) => [
            name,
            category.score * 100,
          ]),
        ),
        warnings: result.lhr.runWarnings,
        metrics: Object.fromEntries(
          [
            "first-contentful-paint",
            "largest-contentful-paint",
            "total-blocking-time",
            "cumulative-layout-shift",
          ].map((name) => [name, result.lhr.audits[name].numericValue]),
        ),
      }),
    );
  } finally {
    await chrome.kill();
  }
}
