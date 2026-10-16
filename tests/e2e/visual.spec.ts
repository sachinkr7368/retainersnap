import { expect, test } from "./fixtures";

const publicRoutes = ["/", "/pricing", "/health", "/demo", "/login", "/signup", "/forgot-password", "/setup"];

test("capture public pages", async ({ page }, info) => {
  for (const route of publicRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const name = (route === "/" ? "home" : route.slice(1)).replaceAll("/", "-");
    await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  }
});
