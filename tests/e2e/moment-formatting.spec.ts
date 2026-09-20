import { expect, test } from "@playwright/test";

import multilineMoment from "../../features/moment/__tests__/fixtures/multiline-moment.json";

const content = JSON.stringify(multilineMoment);

for (const scenario of [
  { name: "regular cards", path: "/moments", imageCount: 0 },
  { name: "stacked image cards", path: "/moments", imageCount: 4 },
  { name: "home previews", path: "/", imageCount: 0 },
]) {
  test(`${scenario.name} retain authored line breaks and paragraph spacing`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/v1/public/moments") {
        return route.fulfill({
          json: {
            code: 200,
            message: "OK",
            data: {
              list: [
                {
                  id: 43,
                  content,
                  likesCount: 0,
                  commentsCount: 0,
                  visibility: "public",
                  authorName: "reader",
                  images: Array.from({ length: scenario.imageCount }, (_, index) => ({
                    id: index + 1,
                    fileId: index + 1,
                    originalName: "moment-formatting-test.svg",
                    thumbnailUrl: null,
                    width: 80,
                    height: 80,
                    fileUrl: "/assets/moment-formatting-test.svg",
                    altText: `Test image ${index + 1}`,
                    sortOrder: index,
                  })),
                  topics: [],
                  createdAt: "2026-09-20T06:12:26",
                  updatedAt: "2026-09-20T06:12:26",
                },
              ],
              total: 1,
              page: 0,
              size: 10,
              totalPages: 1,
            },
          },
        });
      }
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    });
    await page.route("**/assets/moment-formatting-test.svg", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="gray"/></svg>',
      })
    );
    await page.goto(scenario.path);
    const contentView = page.locator('[data-slot="moment-content"]').first();
    // The home showcase and masonry are loaded as separate dynamic chunks.
    await expect(contentView).toBeVisible({ timeout: 15_000 });
    await expect(contentView.locator("p")).toHaveCount(7);
    await expect(contentView.locator("br")).toHaveCount(9);
    expect(await contentView.locator("p").nth(1).innerText()).toBe(
      "有牵挂，就会有期待；\n有期待，就难免有评价。"
    );
    await expect(contentView.locator("p").last()).toHaveText("就已经很好了。");
    await expect(contentView).toHaveCSS("white-space", "pre-wrap");
    const paragraphGap = await contentView
      .locator("p")
      .nth(1)
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return { margin: parseFloat(style.marginTop), line: parseFloat(style.lineHeight) };
      });
    expect(paragraphGap.margin).toBeGreaterThanOrEqual(paragraphGap.line);
    await expect(contentView.locator("[contenteditable]")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
