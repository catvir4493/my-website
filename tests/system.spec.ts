import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  findPath,
  initialCpu,
  sortingFrames,
  stepCpu,
  type SortAlgorithm,
} from "../lib/algorithms";

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.startsWith("first-visit boot")) return;
  await page.addInitScript(() => sessionStorage.setItem("marcell:booted", "1"));
});

test("first-visit boot is brief, skippable, and session-scoped", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero-startup")).toBeVisible();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  await page.getByRole("button", { name: /skip boot sequence/i }).click();
  await expect(page.locator(".hero-startup")).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.reload();
  await expect(page.locator(".header-time")).not.toContainText("--:--:--");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("matrix and Konami commands start and stop their effects", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open interactive terminal" }).click();
  const input = page.getByRole("textbox", { name: "Terminal command" });
  await input.fill("matrix");
  await input.press("Enter");
  await expect(page.locator(".matrix-effect")).toBeVisible();
  await input.fill("matrix --stop");
  await input.press("Enter");
  await expect(page.locator(".matrix-effect")).toHaveCount(0);
  await page.keyboard.press("Escape");
  for (const key of [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ])
    await page.keyboard.press(key);
  await expect(page.getByText("DEV MODE ACTIVATED", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close developer mode" }).click();
  await expect(page.locator(".debug-grid")).toHaveCount(0);
});

test("all sorting algorithms handle duplicate and negative values without mutating input", () => {
  const input = [8, -2, 3, 3, 0, 9, -5];
  for (const algorithm of ["Bubble sort", "Quick sort", "Merge sort"] as SortAlgorithm[]) {
    const frames = sortingFrames(input, algorithm);
    expect(frames.at(-1)?.values).toEqual([-5, -2, 0, 3, 3, 8, 9]);
    expect(frames.at(-1)?.done).toBe(true);
    expect(sortingFrames([], algorithm).at(-1)?.values).toEqual([]);
  }
  expect(input).toEqual([8, -2, 3, 3, 0, 9, -5]);
});

test("A* and Dijkstra return shortest paths and detect blocked boards", () => {
  for (const algorithm of ["A*", "Dijkstra"] as const) {
    const result = findPath(5, 5, new Set([7, 12, 17]), 10, 14, algorithm);
    expect(result.found).toBe(true);
    expect(result.path).toHaveLength(9);
    expect(result.path[0]).toBe(10);
    expect(result.path.at(-1)).toBe(14);
    expect(result.path.some((node) => [7, 12, 17].includes(node))).toBe(false);
    expect(findPath(3, 3, new Set([1, 4, 7]), 0, 2, algorithm).found).toBe(false);
  }
});

test("CPU executes the full program and preserves the previous memory state", () => {
  const first = initialCpu();
  let cpu = first;
  for (let i = 0; i < 30 && !cpu.halted; i++) cpu = stepCpu(cpu);
  expect(cpu.halted).toBe(true);
  expect(cpu.acc).toBe(15);
  expect(cpu.memory[4]).toBe(12);
  expect(cpu.memory[8]).toBe(15);
  expect(cpu.cycles).toBe(21);
  expect(first.memory).toEqual(Array(16).fill(0));
});

test("home renders WebGL without page errors and navigation opens a real project", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Marcell.");
  await expect(page.locator(".core-canvas canvas")).toBeVisible();
  await page.locator("a.project-card").first().click();
  await expect(page).toHaveURL(/projects\/vision-navigation/);
  await expect(page.locator("h1")).toHaveText("Vision Navigation");
  expect(errors).toEqual([]);
});

test("terminal executes commands, supports history, traps focus, and opens projects", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open interactive terminal" }).click();
  const input = page.getByRole("textbox", { name: "Terminal command" });
  await expect(input).toBeFocused();
  await input.fill("whoami");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText("Budapest University");
  await input.fill("sudo");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText("Nice try.");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("sudo");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("whoami");
  await input.fill("open airp");
  await input.press("Tab");
  await expect(input).toHaveValue("open airpocket");
  await input.press("Enter");
  await expect(page).toHaveURL(/projects\/airpocket/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Open interactive terminal" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open interactive terminal" })).toBeFocused();
});

test("command palette supports filtering, keyboard selection, and empty results", async ({
  page,
}) => {
  await page.goto("/");
  // Native shortcuts attach after hydration; the live clock is an existing readiness signal.
  await expect(page.locator(".header-time")).toHaveText(/\d{2}:\d{2}:\d{2}/);
  await page.keyboard.press("Control+k");
  const input = page.getByRole("combobox");
  await expect(input).toBeFocused();
  await input.fill("zzmissing");
  await expect(page.getByText("No matching modules.", { exact: false })).toBeVisible();
  await input.fill("> open lab");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/lab/);
});

test("sorting experiment completes all three algorithms", async ({ page }) => {
  await page.goto("/lab");
  const speed = page.getByRole("slider", { name: "Sorting animation speed" });
  await speed.fill("100");
  for (const algorithm of ["Quick sort", "Bubble sort", "Merge sort"]) {
    await page.getByRole("combobox", { name: "ALGORITHM", exact: true }).selectOption(algorithm);
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Sorted.", { timeout: 15000 });
  }
});

test("pathfinding board edits once per click and keyboard input updates the board", async ({
  page,
}) => {
  await page.goto("/lab");
  await page.getByRole("tab", { name: /Pathfinding Lab/ }).click();
  const cell = page.getByRole("button", { name: "Row 1, column 1, empty", exact: true });
  await cell.click();
  await expect(
    page.getByRole("button", { name: "Row 1, column 1, wall", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Row 1, column 1, wall", exact: true }).click();
  await expect(cell).toBeVisible();
  await cell.focus();
  await cell.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Row 1, column 2, wall", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Target reached", { timeout: 15000 });
});

test("converter preserves 64-bit precision and reports invalid input", async ({ page }) => {
  await page.goto("/lab");
  await page.getByRole("tab", { name: /Binary Playground/ }).click();
  await page.getByLabel("BIT WIDTH").selectOption("64");
  const input = page.getByLabel("DECIMAL", { exact: true });
  await input.fill("18446744073709551615");
  await expect(page.getByLabel("HEXADECIMAL", { exact: true })).toHaveValue("FFFFFFFFFFFFFFFF");
  await input.fill("18446744073709551616");
  await expect(page.getByRole("status")).toContainText("unsigned 64-bit");
  await page.getByLabel("BINARY", { exact: true }).fill("102");
  await expect(page.getByRole("status")).toContainText("valid for the selected base");
});

test("mobile layouts fit the viewport and use the lightweight hero", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/projects", "/projects/vision-navigation", "/lab"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
  }
  await page.goto("/");
  await expect(page.locator(".core-fallback")).toBeVisible();
  await expect(page.locator(".core-canvas canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Lab", exact: false }).click();
  await expect(page).toHaveURL(/\/lab/);
});

test("reduced motion disables WebGL and boot animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".core-fallback")).toBeVisible();
  await expect(page.locator(".core-canvas canvas")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("primary pages and interactive dialogs pass WCAG AA automated checks", async ({ page }) => {
  for (const route of ["/", "/projects", "/projects/airpocket", "/lab"]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  await page.getByRole("button", { name: "Open interactive terminal" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
});
