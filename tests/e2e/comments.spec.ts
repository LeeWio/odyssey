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
  const reply = "A reply to the article";
  const comment = {
    id: 100,
    content: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: reply }] }],
    }),
    replyCount: 0,
    username: "reader",
    createdAt: "2026-10-01T12:00:00Z",
  };
  const rootsPath = `/api/v1/public/comments/post/${designArticle.id}/roots`;
  await page.route(
    (url) => url.pathname === `${rootsPath}/cursor`,
    (route) =>
      route.fulfill({
        json: {
          code: 200,
          message: "OK",
          data: { list: [comment], nextCursor: null, hasMore: false, total: 1 },
        },
      })
  );
  await page.route(
    (url) => [rootsPath, `${rootsPath}/hot`].includes(url.pathname),
    (route) =>
      route.fulfill({
        json: {
          code: 200,
          message: "OK",
          data: { list: [comment], total: 1, page: 0, size: 20, totalPages: 1 },
        },
      })
  );

  await page.goto(`/single/${designArticle.slug}`);
  await expect(page.locator('.ProseMirror[contenteditable="false"]')).toBeVisible();
  await page.getByRole("button", { name: "Open comments", exact: true }).press("Enter");
  const sheet = page.getByRole("dialog", { name: /^Comments\b/ });
  await expect(sheet.getByRole("heading", { name: "Comments 1", exact: true })).toBeVisible();
  await expect(sheet.getByText(reply, { exact: true })).toBeVisible();
});
