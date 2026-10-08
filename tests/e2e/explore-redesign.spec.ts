import { expect, test } from "@playwright/test";

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const posts = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  slug: `explore-note-${index + 1}`,
  title: index === 0 ? "AnUnbrokenExploreTitle".repeat(4) : `Explore note ${index + 1}`,
  summary: "A short note for checking the responsive discovery grid.",
  createdAt: "2026-10-01T00:00:00Z",
  views: 20 + index,
  status: "PUBLISHED",
  isFeatured: false,
  likesCount: 0,
  favoritesCount: 0,
  category: null,
  series: null,
  seriesOrder: null,
  tags: [],
  updatedAt: "2026-10-01T00:00:00Z",
}));

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });

test("explore uses a full-width responsive discovery layout", async ({ page }) => {
  await page.route("**/api/v1/public/blog/facets", (route) =>
    route.fulfill({
      json: envelope({
        totalPublishedCount: 42,
        categories: [{ id: 1, name: "Systems", count: 9 }],
        tags: [{ id: 1, name: "web", count: 9 }],
      }),
    })
  );
  await page.route("**/api/v1/public/blog/posts?**", (route) =>
    route.fulfill({
      json: envelope({ list: posts, page: 0, size: 9, total: 9, totalPages: 1 }),
    })
  );

  for (const [index, width] of [390, 820, 1440, 1920].entries()) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/explore");
    const grid = page.getByTestId("explore-results-grid");
    await expect(grid.locator(":scope > div")).toHaveCount(9);
    const container = page.locator("main > div").first();
    await expect(container).toHaveCSS("max-width", "none");
    expect((await container.boundingBox())!.width).toBe(width);
    await expect
      .poll(() =>
        grid.evaluate((element) => {
          const boxes = [...element.children].map((child) => child.getBoundingClientRect());
          return boxes.filter((box) => Math.abs(box.top - boxes[0].top) < 1).length;
        })
      )
      .toBe([1, 2, 3, 5][index]);
    await expect(page.getByRole("grid", { name: "Filter writing by topic" })).toBeVisible();
    await expect(page.getByRole("grid", { name: "Filter writing by tag" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Find the thread to follow." })).toBeVisible();
    await expect(grid.getByRole("heading", { name: posts[0].title, exact: true })).toBeVisible();
    await expect(
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    ).resolves.toBe(true);
    await page.screenshot({ path: `test-results/explore-${index}-${width}.png` });
  }
});

test("explore keeps URL filters and empty-result recovery usable", async ({ page }) => {
  await page.route("**/api/v1/public/blog/facets", (route) =>
    route.fulfill({
      json: envelope({
        totalPublishedCount: 1,
        categories: [{ id: 1, name: "Systems", count: 1 }],
        tags: [{ id: 1, name: "web", count: 1 }],
      }),
    })
  );
  await page.route("**/api/v1/public/blog/posts?**", (route) => {
    const url = new URL(route.request().url());
    const empty = url.searchParams.get("keyword") === "nothing";
    return route.fulfill({
      json: envelope({
        list: empty ? [] : posts.slice(0, 1),
        page: 0,
        size: 9,
        total: empty ? 0 : 1,
        totalPages: 0,
      }),
    });
  });
  await page.goto("/explore");
  await page.getByRole("searchbox", { name: "Search the archive" }).fill("nothing");
  await expect(
    page.getByRole("heading", { name: "No writing matches these filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters", exact: true }).last().click();
  await expect(page).toHaveURL("/explore");
  await expect(page.getByRole("heading", { name: posts[0].title, exact: true })).toBeVisible();
  await page.getByRole("row", { name: "Systems", exact: true }).click();
  await expect(page).toHaveURL(/category=1/);
  await page.getByRole("row", { name: "web", exact: true }).click();
  await expect(page).toHaveURL(/tag=1/);
});
