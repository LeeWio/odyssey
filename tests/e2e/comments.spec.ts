import { expect, test } from "@playwright/test";

test.use({ locale: "en-US" });

test("guestbook renders the shared comment system shell", async ({ page }) => {
  await page.goto("/guestbook");
  const comments = page.getByRole("region", { name: "Comments" });
  await expect(comments).toBeVisible({ timeout: 30_000 });
  await expect(comments.getByRole("heading", { name: "Comments" })).toBeVisible();
  await expect(comments.getByRole("button", { name: "Choose comment sort" })).toBeVisible();
});

test("article comment sheet opens from the comments query flag when an article exists", async ({
  page,
}) => {
  await page.goto("/blog");
  const firstArticle = page.locator('a[href^="/single/"]').first();
  const articleVisible = await firstArticle
    .waitFor({ state: "visible", timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!articleVisible, "No published articles available in this environment");

  const href = await firstArticle.getAttribute("href");
  expect(href).toBeTruthy();

  await page.goto(`${href}?comments=1`);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await expect(dialog.getByRole("heading", { name: "Comments" })).toBeVisible();
});
