import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const publicRoutes = ["/", "/pricing", "/health", "/demo", "/login", "/signup", "/forgot-password", "/setup"];

async function tops(page: Page, selector: string): Promise<number[]> {
  return page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().top)),
  );
}

function spread(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

async function open(page: Page, route: string) {
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
}

test("public pages do not overflow sideways", async ({ page }) => {
  for (const route of publicRoutes) {
    await open(page, route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
});

test("pricing cards and buttons share one baseline", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Stacked cards are a column on a phone.");
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: "Simple plans for a retainer practice" })).toBeVisible();

  const cardTops = await tops(page, "[data-plan-card]");
  const cardBottoms = await page.locator("[data-plan-card]").evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().bottom)),
  );
  const featureTops = await tops(page, "[data-plan-features]");
  const actionTops = await tops(page, "[data-plan-action] a");
  const actionHeights = await page.locator("[data-plan-action] a").evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().height)),
  );

  expect(cardTops).toHaveLength(3);
  expect(spread(cardTops)).toBeLessThanOrEqual(1);
  expect(spread(cardBottoms)).toBeLessThanOrEqual(1);
  expect(spread(featureTops)).toBeLessThanOrEqual(1);
  expect(spread(actionTops)).toBeLessThanOrEqual(1);
  expect(spread(actionHeights)).toBeLessThanOrEqual(1);
  expect(actionHeights[0]).toBeGreaterThanOrEqual(44);

  await page.screenshot({ path: info.outputPath("pricing-desktop.png"), fullPage: true });
});

test("pricing buttons fill the card on a phone", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Desktop checks the shared baseline.");
  await open(page, "/pricing");
  const insets = await page.locator("[data-plan-card]").evaluateAll((cards) =>
    cards.map((card) => {
      const button = card.querySelector("[data-plan-action] a");
      if (!button) return -1;
      const cardBox = card.getBoundingClientRect();
      const buttonBox = button.getBoundingClientRect();
      return Math.round(cardBox.width - buttonBox.width);
    }),
  );
  expect(insets).toHaveLength(3);
  for (const inset of insets) {
    expect(inset).toBeGreaterThanOrEqual(44);
    expect(inset).toBeLessThanOrEqual(52);
  }
  await page.screenshot({ path: info.outputPath("pricing-mobile.png"), fullPage: true });
});

test("header logo and sign-in sit on one line", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "The phone header is allowed to wrap.");
  await open(page, "/");
  const centers = await page.evaluate(() => {
    const logo = document.querySelector("header a");
    const signIn = [...document.querySelectorAll("header a")].find((node) => node.textContent?.trim() === "Sign in");
    if (!logo || !signIn) return [];
    const logoBox = logo.getBoundingClientRect();
    const signInBox = signIn.getBoundingClientRect();
    return [
      Math.round(logoBox.top + logoBox.height / 2),
      Math.round(signInBox.top + signInBox.height / 2),
    ];
  });
  expect(centers).toHaveLength(2);
  expect(Math.abs(centers[0] - centers[1])).toBeLessThanOrEqual(2);
});

async function controlPair(page: Page) {
  return page.evaluate(() => {
    const input = document.querySelector("#health-url");
    const button = input?.parentElement?.querySelector("button");
    if (!input || !button) return null;
    const inputBox = input.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    return {
      heights: [Math.round(inputBox.height), Math.round(buttonBox.height)],
      tops: [Math.round(inputBox.top), Math.round(buttonBox.top)],
      widths: [Math.round(inputBox.width), Math.round(buttonBox.width)],
    };
  });
}

test("health field and button are the same height", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "The phone form stacks the button.");
  for (const route of ["/", "/health"]) {
    await open(page, route);
    const pair = await controlPair(page);
    expect(pair, route).not.toBeNull();
    expect(pair?.heights, route).toEqual([44, 44]);
    expect(Math.abs((pair?.tops[0] ?? 0) - (pair?.tops[1] ?? 0)), route).toBeLessThanOrEqual(1);
  }
  await page.screenshot({ path: info.outputPath("health-desktop.png"), fullPage: true });
});

test("health button matches the field width on a phone", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Desktop keeps the button beside the field.");
  await open(page, "/health");
  const pair = await controlPair(page);
  expect(pair).not.toBeNull();
  expect(Math.abs((pair?.widths[0] ?? 0) - (pair?.widths[1] ?? 0))).toBeLessThanOrEqual(1);
  expect(pair?.heights[0]).toBeGreaterThanOrEqual(44);
  expect(pair?.heights[1]).toBeGreaterThanOrEqual(44);
});

test("home actions and cards share a line", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Phone cards stack in one column.");
  await open(page, "/");
  const hero = await tops(page, "[data-band='hero'] a");
  const heroHeights = await page.locator("[data-band='hero'] a").evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().height)),
  );
  expect(hero).toHaveLength(2);
  expect(spread(hero)).toBeLessThanOrEqual(1);
  expect(heroHeights).toEqual([44, 44]);

  const checkHeights = await page.locator("[data-band='checks'] article").evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().height)),
  );
  expect(checkHeights).toHaveLength(6);
  expect(spread(checkHeights.slice(0, 3))).toBeLessThanOrEqual(1);
  expect(spread(checkHeights.slice(3))).toBeLessThanOrEqual(1);

  const stepHeights = await page.locator("[data-band='steps'] li").evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().height)),
  );
  expect(stepHeights).toHaveLength(3);
  expect(spread(stepHeights)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath("home-desktop.png"), fullPage: true });
});

test("home actions stack to the same width on a phone", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Desktop keeps the two actions on one line.");
  await open(page, "/");
  const widths = await page.locator("[data-band='hero'] a").evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().width)),
  );
  expect(widths).toHaveLength(2);
  expect(Math.abs(widths[0] - widths[1])).toBeLessThanOrEqual(1);
  expect(widths[0]).toBeGreaterThan(240);
});

test("sample report actions share a line", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "The phone lets the actions wrap.");
  await open(page, "/demo");
  const actionTops = await tops(page, "[data-band='demo-actions'] a, [data-band='demo-actions'] button");
  const actionHeights = await page.locator("[data-band='demo-actions'] a, [data-band='demo-actions'] button").evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().height)),
  );
  expect(actionTops).toHaveLength(2);
  expect(spread(actionTops)).toBeLessThanOrEqual(1);
  expect(spread(actionHeights)).toBeLessThanOrEqual(1);
  expect(actionHeights[0]).toBeGreaterThanOrEqual(44);
});
