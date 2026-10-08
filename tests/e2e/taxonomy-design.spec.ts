import { expect, test, type Locator, type Page } from "@playwright/test";
import messages from "../../messages/en.json";

const entries = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: index === 0 ? "AnUnbrokenTaxonomyLabel".repeat(4) : `Topic ${index + 1}`,
  slug: `topic-${index + 1}`,
  description: "Notes, experiments and practical engineering decisions.",
  createdAt: "2026-10-01T00:00:00Z",
}));
const posts = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  title: index === 0 ? "AnUnbrokenEssayTitle".repeat(4) : `Essay ${index + 1}`,
  slug: `taxonomy-essay-${index + 1}`,
  summary: "A published essay with a short introduction.",
  status: "PUBLISHED",
  isFeatured: false,
  views: 10,
  likesCount: 0,
  favoritesCount: 0,
  category: null,
  series: null,
  seriesOrder: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
}));
const envelope = (data: unknown) => ({ code: 200, message: "OK", data });

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });

async function checkGrid(page: Page, grid: Locator, columns: number, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await expect
    .poll(() =>
      grid.evaluate((element) => {
        const boxes = [...element.children].map((child) => child.getBoundingClientRect());
        return boxes.filter((box) => Math.abs(box.top - boxes[0]!.top) < 1).length;
      })
    )
    .toBe(columns);
  const container = grid.locator("..");
  await expect(container).toHaveCSS("max-width", "none");
  expect((await container.boundingBox())!.width).toBe(width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await grid.evaluate((element) =>
      [...element.children].every((child) => {
        const card = child.getBoundingClientRect();
        return [...child.querySelectorAll("a")].every((link) => {
          const bounds = link.getBoundingClientRect();
          return bounds.left >= card.left && bounds.right <= card.right;
        });
      })
    )
  ).toBe(true);
}

for (const kind of ["categories", "tags"] as const) {
  test(`${kind} retains navigation and adapts directory and essay density`, async ({
    page,
  }, testInfo) => {
    const requests: string[] = [];
    await page.route("**/api/v1/**", (route) => {
      const url = new URL(route.request().url());
      requests.push(url.pathname + url.search);
      if (url.pathname === `/api/v1/public/${kind}`) {
        return route.fulfill({ json: envelope(entries) });
      }
      if (url.pathname === "/api/v1/public/blog/facets") {
        return route.fulfill({
          json: envelope({ [kind]: entries.map((entry) => ({ ...entry, count: 16 })) }),
        });
      }
      if (url.pathname === "/api/v1/public/blog/posts") {
        expect(url.searchParams.get(kind === "categories" ? "categoryId" : "tagId")).toBe("1");
        expect(url.searchParams.get("size")).toBe("8");
        const pageIndex = Number(url.searchParams.get("page"));
        return route.fulfill({
          json: envelope({
            list:
              pageIndex === 0
                ? posts
                : [{ ...posts[0], id: 9, title: "Second-page essay", slug: "second-page-essay" }],
            page: pageIndex,
            size: 8,
            total: 9,
            totalPages: 2,
          }),
        });
      }
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/single/${kind}`);
    const directory = page.getByTestId("taxonomy-grid");
    await expect(directory.locator(":scope > li")).toHaveCount(12);
    for (const [index, width] of [390, 820, 1440, 1920, 2560].entries()) {
      await checkGrid(page, directory, [1, 2, 4, 6, 8][index]!, width);
      await page.screenshot({ path: testInfo.outputPath(`${kind}-${width}.png`) });
    }
    expect(requests.filter((url) => url.startsWith(`/api/v1/public/${kind}`))).toHaveLength(1);
    await directory.getByRole("link", { name: entries[0]!.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/single/${kind}/topic-1$`));
    const grid = page.getByTestId("essay-grid");
    await expect(grid.locator(":scope > li")).toHaveCount(8);
    for (const [index, width] of [390, 820, 1440, 1920, 2560].entries()) {
      await checkGrid(page, grid, [1, 2, 3, 5, 6][index]!, width);
      await page.screenshot({ path: testInfo.outputPath(`${kind}-essays-${width}.png`) });
    }
    expect(requests.filter((url) => url.startsWith("/api/v1/public/blog/posts?"))).toHaveLength(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: messages.Journal.next, exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(grid.getByRole("link", { name: "Second-page essay", exact: true })).toBeVisible();
    await expect(grid.locator(":scope > li")).toHaveCount(1);
    await page.setViewportSize({ width: 2560, height: 900 });
    expect((await grid.locator(":scope > li").first().boundingBox())!.width).toBeLessThan(500);
    await page
      .getByRole("link", {
        name: kind === "categories" ? messages.Journal.allCategories : messages.Journal.allTags,
        exact: true,
      })
      .click();
    await expect(directory.locator(":scope > li")).toHaveCount(12);
  });

  test(`${kind} loading, failure recovery and empty states keep the page usable`, async ({
    page,
  }) => {
    const pending = Promise.withResolvers<void>();
    let mode: "loading" | "error" | "empty" = "loading";
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === `/api/v1/public/${kind}` || path === "/api/v1/public/blog/facets") {
        if (mode === "loading") await pending.promise;
        if (mode === "error")
          return route.fulfill({ status: 503, json: { message: "Unavailable" } });
        return route.fulfill({ json: envelope(path.endsWith("facets") ? { [kind]: [] } : []) });
      }
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    });
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/single/${kind}`);
      await expect(page.locator('[aria-busy="true"]')).toBeVisible();
      mode = "error";
      pending.resolve();
      await expect(
        page.getByRole("heading", { name: messages.Journal.latestFailed, exact: true })
      ).toBeVisible();
      mode = "empty";
      await page.getByRole("button", { name: messages.Journal.tryAgain, exact: true }).click();
      await expect(
        page.getByRole("heading", { name: messages.Journal.emptyTitle, exact: true })
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
    } finally {
      pending.resolve();
    }
  });
}
