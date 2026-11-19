import { expect, test } from "@playwright/test";

test.use({ locale: "en-US" });

test("shows the route fallback for an unknown article", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/single/missing-article");

  await expect(page.getByRole("heading", { name: "This page isn't here." })).toBeVisible();
  await page.getByRole("link", { name: "Read essays and notes" }).click();
  await expect(page).toHaveURL(/\/single$/);
});
