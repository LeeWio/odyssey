import { expect, test } from "@playwright/test";

const moments = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  content: JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `Moment ${index + 1}. ${"A note with variable height. ".repeat((index % 5) + 1)}`,
          },
        ],
      },
    ],
  }),
  likesCount: 0,
  commentsCount: 0,
  visibility: "public",
  authorName: "Reader",
  images: [],
  topics: [],
  createdAt: "2026-09-20T06:12:26Z",
  updatedAt: "2026-09-20T06:12:26Z",
}));

for (const viewport of [
  { name: "mobile", width: 390, columns: 1 },
  { name: "tablet", width: 820, columns: 3 },
  { name: "desktop", width: 1440, columns: 4 },
]) {
  test(`This & That masonry renders without overlap on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/v1/public/moments") {
        return route.fulfill({
          json: {
            code: 200,
            message: "OK",
            data: { list: moments, total: moments.length, page: 0, size: 18, totalPages: 1 },
          },
        });
      }
      if (path.endsWith("/featured")) {
        return route.fulfill({
          json: {
            code: 200,
            message: "OK",
            data: { list: [], total: 0, page: 0, size: 5, totalPages: 0 },
          },
        });
      }
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    });

    await page.goto("/");
    const showcase = page.locator("#moments-showcase");
    await expect(showcase.locator("#moments-showcase-title")).toBeVisible();
    const cards = showcase.locator(".columns-1 > div");
    await expect(cards).toHaveCount(moments.length, { timeout: 10_000 });
    await expect(cards.first().locator('[data-slot="moment-content"]')).toBeVisible();

    const layout = await cards.evaluateAll((elements) => {
      const boxes = elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      const columns = Number.parseInt(
        getComputedStyle(elements[0]!.parentElement!).columnCount,
        10
      );
      const overlaps = boxes.some((box, index) =>
        boxes.slice(index + 1).some((other) => {
          const overlapX = Math.min(box.right, other.right) - Math.max(box.left, other.left);
          const overlapY = Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top);
          return overlapX > 1 && overlapY > 1;
        })
      );
      return { columns, overlaps };
    });

    expect(layout.columns).toBe(viewport.columns);
    expect(layout.overlaps).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });
}
