import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { parsePublicGitHub } from "../lib/github-data";
import { parseNumberInput, numberRepresentations } from "../lib/number-systems";
import { allocate, release, freeSegments, type MemoryBlock } from "../lib/memory";
import { runCommand } from "../lib/terminal";
import { fuzzyScore } from "../lib/fuzzy-search";
import { projects } from "../data/projects";
import { findPath } from "../lib/algorithms";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
});

test("GitHub projection rejects private data, invented statistics, and arbitrary upstream links", () => {
  const repo = {
    name: "real-public",
    private: false,
    visibility: "public",
    owner: { login: "owner" },
    updated_at: "2026-01-01T00:00:00Z",
    language: "C",
    description: "Public description",
    html_url: "https://evil.example",
    pushed_at: "2026-02-01T00:00:00Z",
  };
  const data = parsePublicGitHub(
    "owner",
    { login: "owner", public_repos: 1, private_repos: 999, token: "must-not-leak" },
    [
      repo,
      { ...repo, name: "secret", private: true },
      { ...repo, name: "other-owner", owner: { login: "someone" } },
    ],
    [
      {
        type: "PushEvent",
        public: false,
        repo: { name: "owner/secret" },
        created_at: "2026-02-01T00:00:00Z",
      },
    ],
  );
  expect(data.repositories.map((item) => item.name)).toEqual(["real-public"]);
  expect(data.repositories[0].url).toBe("https://github.com/owner/real-public");
  expect(data.publicRepos).toBe(1);
  expect(data.primaryLanguages).toEqual(["C"]);
  expect(data.recentPush).toBeNull();
  expect(data.signals).toEqual([]);
  expect(JSON.stringify(data)).not.toMatch(/must-not-leak|secret|contributions|commits|999|evil/);
  expect(() => parsePublicGitHub("owner", { login: "owner" }, [], [])).toThrow();
  expect(
    parsePublicGitHub("owner", { login: "owner", public_repos: 0 }, [], null).activityAvailable,
  ).toBe(false);
});

test("only actual public PushEvents populate recent push telemetry", () => {
  const data = parsePublicGitHub(
    "owner",
    { login: "owner", public_repos: 0 },
    [],
    [
      {
        type: "PushEvent",
        public: true,
        repo: { name: "owner/module" },
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
  );
  expect(data.recentPush).toBe("2026-01-01T00:00:00.000Z");
  expect(data.signals[0].type).toBe("PUSH");
});

test("binary conversion preserves sign, boundaries, octal, and 64-bit precision", () => {
  expect(parseNumberInput("-128", 10, 8, true)).toEqual({ bits: 128n });
  expect(numberRepresentations(255n, 8, true)).toEqual({
    2: "11111111",
    8: "377",
    10: "-1",
    16: "FF",
  });
  expect(parseNumberInput("128", 10, 8, true).error).toContain("signed 8-bit");
  expect(parseNumberInput("-1", 10, 8, false).error).toContain("unsigned 8-bit");
  expect(parseNumberInput("0o377", 8, 8, false)).toEqual({ bits: 255n });
  expect(parseNumberInput("0b102", 2, 8, false).error).toContain("valid");
  expect(parseNumberInput("18446744073709551615", 10, 64, false).bits).toBe(18446744073709551615n);
  expect(parseNumberInput("18446744073709551616", 10, 64, false).error).toBeTruthy();
});

test("heap simulation distinguishes total free space from contiguous capacity and reuses freed blocks", () => {
  let blocks: MemoryBlock[] = [];
  for (let id = 1; id <= 8; id++) blocks = allocate(blocks, 8, id)!;
  const original = blocks;
  for (const id of [1, 3, 5, 7]) blocks = release(blocks, id);
  expect(freeSegments(blocks).reduce((sum, block) => sum + block.size, 0)).toBe(32);
  expect(allocate(blocks, 9, 9)).toBeNull();
  blocks = release(blocks, 2);
  const next = allocate(blocks, 16, 10)!;
  expect(next.find((block) => block.id === 10)?.start).toBe(0);
  expect(original).toHaveLength(8);
  expect(allocate([], 0, 1)).toBeNull();
});

test("terminal commands remain a predefined navigation allowlist", () => {
  expect(runCommand("neofetch").lines.join(" ")).toContain("v1.5.1");
  expect(runCommand("neofetch").lines.join(" ")).not.toMatch(/uptime|age/i);
  expect(runCommand("projects --all").lines.join(" ")).toContain("CameraX");
  for (const project of projects)
    expect(runCommand(`open ${project.slug}`).path).toBe(`/projects/${project.slug}`);
  for (const command of [
    "rm -rf /",
    "open https://evil.example",
    "$(whoami)",
    "javascript:alert(1)",
  ])
    expect(runCommand(command).action).toBeUndefined();
  expect(runCommand("sudo rm -rf /").lines[0]).toContain("blocked");
  expect(runCommand("github").action).toBeUndefined();
  expect(runCommand("exit").action).toBe("close");
});

test("fuzzy search matches ordered abbreviations without accepting unrelated text", () => {
  expect(fuzzyScore("vsnnav", "Vision Navigation")).not.toBeNull();
  expect(fuzzyScore("vision", "Vision Navigation")!).toBeLessThan(
    fuzzyScore("vsnnav", "Vision Navigation")!,
  );
  expect(fuzzyScore("zzmissing", "Vision Navigation")).toBeNull();
});

test("pathfinding trace exposes a frontier and closes only explored nodes", () => {
  const result = findPath(3, 3, new Set([4]), 0, 8, "A*");
  expect(result.frames[0]).toEqual({ open: [1, 3], closed: [0], current: 0 });
  expect(result.frames.at(-1)?.current).toBe(8);
  expect(result.frames.flatMap((frame) => frame.open)).not.toContain(4);
  expect(result.frames.at(-1)?.closed).toEqual(result.visited);
});

test("terminal v2 supports neofetch, history, Ctrl+L, safe sudo, date, and exit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open interactive terminal" }).click();
  const input = page.getByRole("textbox", { name: "Terminal command" });
  for (const command of ["neofetch", "projects --all", "sudo rm -rf /", "history", "date"]) {
    await input.fill(command);
    await input.press("Enter");
  }
  const log = page.getByRole("log");
  await expect(log).toContainText("curiosity");
  await expect(log).toContainText("blocked by Marcell.OS safety layer");
  await expect(log).toContainText("CameraX");
  await input.press("Control+l");
  await expect(log.locator(".terminal-entry")).toHaveCount(0);
  await input.fill("exit");
  await input.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("fuzzy palette and compute core navigate to the flagship case study", async ({ page }) => {
  await page.goto("/");
  await page.locator(".core-project-node").first().hover();
  await expect(page.locator(".core-canvas")).toHaveAttribute("data-signal", "vision-navigation");
  await expect(page.locator(".core-bottom")).toContainText("SIGNAL ROUTING");
  await page.keyboard.press("Control+k");
  const input = page.getByRole("combobox");
  await input.fill("vsnnav");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/projects\/vision-navigation$/);
  await expect(page.getByText("~20 FPS", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "LEFT", exact: true }).click();
  await expect(page.locator(".corridor-panel [role=status]")).toContainText("LEFT:");
});

test("skill nodes link evidence while learning interests remain distinct", async ({ page }) => {
  await page.goto("/");
  await page.locator(".skill-node").filter({ hasText: /^C$/ }).click();
  await expect(
    page.locator(".skill-inspector").getByRole("link", { name: /Gomoku AI/ }),
  ).toHaveAttribute("href", "/projects/gomoku-ai");
  await page.locator(".skill-node").filter({ hasText: "Python" }).click();
  await expect(page.locator(".skill-inspector")).toContainText("NO PROJECT EVIDENCE CLAIMED");
});

test("GitHub telemetry recovers from signal loss and omits unconfigured contact links", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/github", (route) => {
    calls++;
    return route.fulfill({
      status: calls === 1 ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(
        calls === 1
          ? { status: "error", message: "Connection interrupted", retryAt: null }
          : {
              status: "connected",
              username: "test-owner",
              url: "https://github.com/test-owner",
              publicRepos: 0,
              repositories: [],
              primaryLanguages: [],
              recentPush: null,
              signals: [],
              activityAvailable: true,
              fetchedAt: new Date().toISOString(),
              repositorySampleSize: 0,
            },
      ),
    });
  });
  await page.goto("/");
  await page.locator("#telemetry").scrollIntoViewIfNeeded();
  await expect(page.locator("#telemetry")).toContainText("GITHUB SIGNAL LOST");
  await page.getByRole("button", { name: "Retry GitHub signal" }).click();
  await expect(page.locator("#telemetry")).toContainText("GITHUB CONNECTED");
  await expect(
    page.locator(".contact-links").getByRole("link", { name: "GitHub", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.locator("#contact").getByRole("link", { name: "LinkedIn", exact: false }),
  ).toHaveCount(0);
  await expect(page.locator("#contact")).not.toContainText("NEXT_PUBLIC");
});

test("not-connected and rate-limit states contain no invented telemetry", async ({ page }) => {
  await page.route("**/api/github", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ status: "not-connected" }),
    }),
  );
  await page.goto("/");
  await page.locator("#telemetry").scrollIntoViewIfNeeded();
  await expect(page.locator("#telemetry")).toContainText("NOT CONNECTED");
  await expect(page.locator("#telemetry")).not.toContainText("CONTRIBUTIONS");
  await page.unroute("**/api/github");
  await page.route("**/api/github", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        status: "error",
        message: "GitHub rate limit reached",
        retryAt: new Date(Date.now() + 60000).toISOString(),
      }),
    }),
  );
  await page.reload();
  await page.locator("#telemetry").scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: /Retry in/ })).toBeDisabled();
});

test("pathfinding steps a real frontier, measures execution, and resets before wall generation", async ({
  page,
}) => {
  await page.goto("/lab#pathfinding");
  await page.getByRole("button", { name: "Step", exact: true }).click();
  await expect(page.locator('.path-cell[data-current="true"]')).toHaveCount(1);
  await expect(page.locator('.path-cell[data-kind="open"]').first()).toBeVisible();
  await expect(page.locator(".experiment-metrics")).toContainText("ms");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator('.path-cell[data-current="true"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Generate walls" }).click();
  await expect(page.locator('.path-cell[data-kind="start"]')).toHaveCount(1);
  await expect(page.locator('.path-cell[data-kind="end"]')).toHaveCount(1);
});

test("binary playground synchronizes all four bases and signed interpretation", async ({
  page,
}) => {
  await page.goto("/lab#converter");
  await page.getByLabel("BIT WIDTH").selectOption("8");
  await page.getByLabel("HEXADECIMAL", { exact: true }).fill("FF");
  await expect(page.getByLabel("DECIMAL", { exact: true })).toHaveValue("255");
  await expect(page.getByLabel("OCTAL", { exact: true })).toHaveValue("377");
  await page.getByLabel("INTERPRETATION").selectOption("signed");
  await expect(page.getByLabel("DECIMAL", { exact: true })).toHaveValue("-1");
  await page.getByLabel("DECIMAL", { exact: true }).fill("-128");
  await expect(page.getByLabel("BINARY", { exact: true })).toHaveValue("10000000");
  await expect(page.locator('.bit-cell[data-sign="true"]')).toHaveCount(1);
});

test("memory lab allocates, frees, pushes and pops frames without claiming browser memory", async ({
  page,
}) => {
  await page.goto("/lab#memory");
  await expect(page.locator(".experiment-heading")).toContainText("SIMULATION");
  await page.getByRole("button", { name: "malloc", exact: true }).click();
  await expect(page.locator('.heap-cells [data-allocated="true"]')).toHaveCount(8);
  await page.getByRole("button", { name: "Call function", exact: true }).click();
  await expect(page.locator(".stack-frame")).toHaveCount(2);
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await expect(page.locator(".stack-frame")).toHaveCount(1);
  await page.getByRole("button", { name: "free block 1", exact: true }).click();
  await expect(page.locator('.heap-cells [data-allocated="true"]')).toHaveCount(0);
  for (const hash of ["#memory", "#converter", "#pathfinding"]) {
    await page.goto(`/lab${hash}`);
    await expect(page.locator(".experiment-panel")).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
        .violations,
    ).toEqual([]);
  }
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 900, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`all seven routes preserve readable layouts and metadata on ${viewport.name}`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of [
      "/",
      "/projects",
      ...projects.map((project) => `/projects/${project.slug}`),
      "/lab",
    ]) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
      if (route.includes("/projects/"))
        await expect(page.locator(".artifact-pending")).toContainText("NOT YET PUBLISHED");
    }
    expect(errors).toEqual([]);
  });
}
