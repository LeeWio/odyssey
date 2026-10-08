import { expect, test } from "@playwright/test";

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const posts = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  title: index === 0 ? "AnUnbrokenArchiveTitle".repeat(5) : `Archive note ${index + 1}`,
  slug: `archive-note-${index + 1}`,
  summary: "A dated note with enough context to make the timeline useful at a glance.",
  category: { name: "Systems" },
  views: 100 + index,
  publishedAt: "2026-09-01T00:00:00Z",
}));

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });

test("archive uses a full-width editorial timeline with responsive controls", async ({
  page,
}, testInfo) => {
  await page.route("**/api/v1/public/blog/facets", (route) =>
    route.fulfill({
      json: envelope({
        archives: [
          { year: 2026, month: 9, count: 10 },
          { year: 2026, month: 8, count: 4 },
          { year: 2025, month: 12, count: 2 },
        ],
      }),
    })
  );
  await page.route("**/api/v1/public/blog/archive?**", (route) =>
    route.fulfill({
      json: envelope({ list: posts, page: 0, size: 10, total: 10, totalPages: 1 }),
    })
  );

  for (const width of [390, 820, 1440, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/archive?year=2026");
    const heading = page.getByRole("heading", { name: "Read the work in sequence.", exact: true });
    const list = page.getByTestId("archive-results-list");
    const container = page.locator("main > div").first();
    await expect(heading).toBeVisible();
    await expect(list.locator(":scope > article")).toHaveCount(10);
    await expect(page.getByRole("button", { name: /Year/ })).toBeVisible();
    await expect(page.locator('[aria-label^="Filter "]')).toBeVisible();
    await expect(container).toHaveCSS("max-width", "none");
    expect((await container.boundingBox())!.width).toBe(width);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
    }));
    expect(overflow.scrollWidth <= overflow.innerWidth).toBe(true);
    expect(
      await list.evaluate((element) =>
        [...element.querySelectorAll("article")].every((article) => {
          const listBounds = element.getBoundingClientRect();
          return [...article.querySelectorAll("a")].every((item) => {
            const bounds = item.getBoundingClientRect();
            return bounds.left >= listBounds.left - 1 && bounds.right <= listBounds.right + 1;
          });
        })
      )
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`archive-${width}.png`) });
  }
});

test("archive keeps period controls keyboard accessible", async ({ page }) => {
  await page.route("**/api/v1/public/blog/facets", (route) =>
    route.fulfill({ json: envelope({ archives: [{ year: 2026, month: 9, count: 1 }] }) })
  );
  await page.route("**/api/v1/public/blog/archive?**", (route) =>
    route.fulfill({
      json: envelope({ list: posts.slice(0, 1), page: 0, size: 10, total: 1, totalPages: 1 }),
    })
  );
  await page.goto("/archive");
  const year = page.getByRole("button", { name: /Year/ });
  await year.press("Enter");
  await expect(page.getByRole("option", { name: "2026", exact: true })).toBeVisible();
  await page.getByRole("option", { name: "2026", exact: true }).press("Enter");
  await expect(page).toHaveURL(/year=2026/);
  await expect(page.locator('[aria-label="Filter 2026 by month"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
