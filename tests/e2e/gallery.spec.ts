import { previewShots } from "../../src/lib/fixtures/catalog";
import { expect, test } from "./fixtures";

test("preview gallery lists every screen", async ({ page }) => {
  await page.goto("/preview");
  await expect(page.getByRole("heading", { name: "Preview gallery" })).toBeVisible();
  for (const shot of previewShots) {
    await expect(page.getByRole("link", { name: shot.title, exact: true })).toBeVisible();
  }
});

for (const shot of previewShots) {
  test(`screenshot ${shot.id}`, async ({ page }, info) => {
    await page.goto(`/preview/${shot.id}`);
    await expect(page.locator(`[data-shot="${shot.id}"]`)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, shot.id).toBeLessThanOrEqual(1);
    const short = await page.locator("button, a, span").evaluateAll((elements) =>
      elements
        .filter((element) => element.className.toString().split(/\s+/).includes("h-11"))
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && box.height < 44;
        })
        .map((element) => element.textContent?.trim() ?? ""),
    );
    expect(short, shot.id).toEqual([]);
    await page.screenshot({ path: info.outputPath(`${shot.id}.png`), fullPage: true });
  });
}

test("preview billing cards share one baseline", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Stacked cards are a column on a phone.");
  await page.goto("/preview/billing");
  await expect(page.locator("[data-shot='billing']")).toBeVisible();
  const metrics = await page.locator("[data-plan-card]").evaluateAll((cards) =>
    cards.map((card) => {
      const action = card.querySelector("[data-plan-action] button, [data-plan-action] span");
      const cardBox = card.getBoundingClientRect();
      const actionBox = action?.getBoundingClientRect();
      return {
        top: Math.round(cardBox.top),
        bottom: Math.round(cardBox.bottom),
        actionTop: actionBox ? Math.round(actionBox.top) : -1,
        actionHeight: actionBox ? Math.round(actionBox.height) : 0,
      };
    }),
  );
  expect(metrics).toHaveLength(3);
  const tops = metrics.map((item) => item.top);
  const bottoms = metrics.map((item) => item.bottom);
  const actionTops = metrics.map((item) => item.actionTop);
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1);
  expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(1);
  expect(Math.max(...actionTops) - Math.min(...actionTops)).toBeLessThanOrEqual(1);
  for (const item of metrics) expect(item.actionHeight).toBeGreaterThanOrEqual(44);
});
