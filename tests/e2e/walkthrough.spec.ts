import { expect, test } from "./fixtures";

test("a visitor can read the offer, check a URL shape, and reach signup", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Monthly reports that keep the retainer");
  await page.getByRole("link", { name: "See a sample report" }).click();
  await expect(page.getByRole("heading", { name: "Harbor Goods" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("demo.png"), fullPage: true });

  await page.goto("/health");
  await page.locator("#health-url").fill("http://127.0.0.1/secret");
  await page.getByRole("button", { name: "Check this site" }).click();
  await expect(page.locator("p[role='alert']")).toContainText("private");

  await page.goto("/pricing");
  await page.getByRole("link", { name: "Choose Studio" }).click();
  await expect(page).toHaveURL(/\/signup/);
  await expect(page.getByRole("heading", { name: "Create your studio" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("signup.png"), fullPage: true });

  await page.goto("/login");
  await page.getByLabel("Email").first().fill("ada@example.com");
  await page.getByLabel("Password").fill("correcthorse");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("p[role='alert']")).toContainText("Sign-in is not available yet");
  await expect(page.locator("p[role='alert']")).not.toContainText("NEXT_PUBLIC_");
});

test("the app explains which keys are missing", async ({ page }, info) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/setup/);
  await expect(page.getByRole("heading", { name: "Add the Supabase keys to start" })).toBeVisible();
  await expect(page.getByText("NEXT_PUBLIC_SUPABASE_URL")).toBeVisible();
  await expect(page.getByText("SUPABASE_SERVICE_ROLE_KEY")).toBeVisible();
  await page.screenshot({ path: info.outputPath("setup.png"), fullPage: true });
});
