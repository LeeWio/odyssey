import { expect, test } from "@playwright/test";

import { designArticle } from "./fixtures/articles";

test.use({ locale: "en-US" });

test("guestbook renders the shared comment system shell", async ({ page }) => {
  await page.goto("/guestbook");

  const comments = page.getByRole("region", { name: "Comments" });
  await expect(comments.getByRole("heading", { name: "Guestbook" })).toBeVisible();
  await expect(comments.getByRole("button", { name: "Choose comment sort" })).toBeVisible();
});

test("article comment sheet opens from the reader toolbar", { tag: "@smoke" }, async ({ page }) => {
  await page.goto(`/single/${designArticle.slug}`);
  await expect(page.locator('.ProseMirror[contenteditable="false"]')).toBeVisible();
  await page.getByRole("button", { name: "Open comments", exact: true }).press("Enter");
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Comments", exact: true })
  ).toBeVisible();
});
