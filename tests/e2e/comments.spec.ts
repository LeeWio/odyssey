import { expect, test, type CDPSession } from "@playwright/test";

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
  await expect(page.locator("[data-article-body]")).toBeVisible();
  await page.getByRole("button", { name: "Open comments", exact: true }).press("Enter");
  const sheet = page.getByRole("dialog", { name: /^Comments\b/ });
  await expect(sheet.getByRole("heading", { name: "Comments 1", exact: true })).toBeVisible();
  await expect(sheet.getByText(reply, { exact: true })).toBeVisible();
  const close = sheet.getByRole("button", { name: "Close", exact: true });
  await expect(close).toBeVisible();
  await close.click();
  await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveAttribute("data-exiting", "true");
});

async function swipe(input: CDPSession, x: number, fromY: number, toY: number) {
  await input.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y: fromY }],
  });
  try {
    for (let step = 1; step <= 8; step++) {
      await input.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: Math.round(fromY + ((toY - fromY) * step) / 8) }],
      });
    }
  } finally {
    await input.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
}

test.describe("Moment comments on touch screens", () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const width of [320, 390]) {
    test(`handle drag closes the sheet and the body scrolls at ${width}px`, async ({
      page,
      context,
    }) => {
      await page.setViewportSize({ width, height: 664 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const comments = Array.from({ length: 16 }, (_, index) => ({
        id: index + 100,
        content: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: `Comment ${index + 1} for the scrolling fixture.` }],
            },
          ],
        }),
        replyCount: 0,
        username: "reader",
        createdAt: "2026-10-01T12:00:00Z",
      }));
      const rootsPath = "/api/v1/public/comments/moment/809/roots";
      await page.route(
        (url) => [rootsPath, `${rootsPath}/cursor`, `${rootsPath}/hot`].includes(url.pathname),
        (route) =>
          route.fulfill({
            json: {
              code: 200,
              message: "OK",
              data: {
                list: comments,
                total: comments.length,
                page: 0,
                size: 20,
                totalPages: 1,
                nextCursor: null,
                hasMore: false,
              },
            },
          })
      );

      await page.goto("/moments/entry/809");
      const trigger = page.getByRole("button", { name: "Open 0 comments" });
      await trigger.focus();
      const initialScroll = await page.evaluate(() => scrollY);
      await trigger.press("Enter");
      const sheet = page.getByRole("dialog", { name: /^Comments\b/ });
      await expect(sheet.getByText("Comment 1 for the scrolling fixture.")).toBeVisible();
      const handle = sheet.locator('[data-slot="sheet-handle"]');
      const body = sheet.locator('[data-slot="sheet-body"]');
      await expect(handle).toHaveCSS("touch-action", "none");

      const input = await context.newCDPSession(page);
      try {
        const bounds = (await body.boundingBox())!;
        const center = Math.round(bounds.x + bounds.width / 2);
        await swipe(
          input,
          center,
          Math.round(bounds.y + bounds.height * 0.8),
          Math.round(bounds.y + bounds.height * 0.2)
        );
        await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
        await expect(sheet).toBeVisible();

        const handleBounds = (await handle.boundingBox())!;
        await swipe(input, width / 2, Math.round(handleBounds.y + handleBounds.height / 2), 644);
        await expect(sheet).toBeHidden();
      } finally {
        await input.detach();
      }
      await expect(trigger).toBeFocused();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(initialScroll);

      await trigger.press("Enter");
      await expect(sheet.getByRole("button", { name: "Close", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  }
});
