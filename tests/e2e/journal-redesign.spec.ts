import { expect, test } from "@playwright/test";
import messages from "../../messages/en.json";

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const story = (id: number) => ({
  id,
  title:
    id === 4 ? "AnUnbrokenArticleTitle".repeat(4) : `Notes on building thoughtful software ${id}`,
  slug: `design-story-${id}`,
  summary: "A closer look at the decisions, experiments and small details behind the work.",
  coverImage: id % 3 === 0 ? "" : "/IMG_5332.JPG",
  authorName: "Odyssey",
  status: "PUBLISHED",
  isFeatured: id > 20,
  views: 124,
  likesCount: 8,
  favoritesCount: 0,
  isInReadingList: false,
  category: { id: 1, name: "Engineering", slug: "engineering", createdAt: "2026-10-01T00:00:00Z" },
  series: null,
  seriesOrder: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
});
const stories = Array.from({ length: 12 }, (_, index) => story(index + 1));
const featured = [story(22), story(23), story(24), story(25)];
const columns = ["Field notes", "Working systems"].map((name, index) => ({
  id: index + 1,
  name,
  slug: `series-${index + 1}`,
  description: "An ongoing collection of ideas and practical observations.",
  isPublished: true,
  postsCount: 2,
  posts: [story(index + 31), story(index + 33)],
  createdAt: "2026-10-01T00:00:00Z",
}));

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    let data: unknown;
    if (url.pathname.endsWith("/posts/featured")) {
      data = { list: featured, page: 0, size: 8, total: 4, totalPages: 1 };
    } else if (url.pathname.endsWith("/blog/posts")) {
      expect(url.searchParams.get("size")).toBe("12");
      const noResults = url.searchParams.get("keyword") === "no-matching-entry";
      const index = Number(url.searchParams.get("page"));
      data = {
        list: noResults ? [] : index > 0 ? [story(13)] : stories,
        page: index,
        size: 12,
        total: noResults ? 0 : 13,
        totalPages: noResults ? 0 : 2,
      };
    } else if (url.pathname.endsWith("/blog/facets")) {
      data = {
        totalPublishedCount: 13,
        categories: [{ id: 1, name: "Engineering", slug: "engineering", count: 13 }],
        tags: [{ id: 1, name: "Design", slug: "design", count: 8 }],
        archives: [{ year: 2026, month: 10, count: 13 }],
      };
    } else if (url.pathname.endsWith("/blog/discovery")) {
      data = { trending: [story(1), story(2)], mostRead: [story(3)], categoryGroups: [] };
    } else if (url.pathname.endsWith("/columns")) {
      data = columns;
    } else if (url.pathname.includes("/columns/series-")) {
      data = columns.find((column) => url.pathname.endsWith(column.slug));
    } else {
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    }
    return route.fulfill({ json: envelope(data) });
  });
});

test("editorial hierarchy adapts across screens without overlapping text or losing content", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/single");
  const heading = page.getByRole("heading", {
    name: messages.Journal.title,
    level: 1,
    exact: true,
  });
  const lead = page.getByTestId("journal-lead").first();
  const companions = page.getByTestId("journal-feature-layout").getByTestId("journal-companion");
  const grid = page.getByTestId("journal-latest-grid");
  await expect(heading).toBeVisible();
  await expect(grid.getByRole("article")).toHaveCount(12);
  await expect(companions).toHaveCount(2);
  await expect
    .poll(() => lead.locator("img").evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);

  for (const width of [390, 820, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const leadBox = (await lead.boundingBox())!;
    const secondaryBox = (await companions.first().boundingBox())!;
    if (width >= 1024) {
      expect(leadBox.width).toBeGreaterThan(secondaryBox.width * 1.5);
      expect(secondaryBox.x).toBeGreaterThan(leadBox.x + leadBox.width);
    } else {
      expect(secondaryBox.y).toBeGreaterThanOrEqual(leadBox.y + leadBox.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    expect(
      await grid.evaluate((element) =>
        [...element.querySelectorAll("article")].every((article) => {
          const box = article.getBoundingClientRect();
          return [...article.querySelectorAll("a, button")].every((item) => {
            const bounds = item.getBoundingClientRect();
            return bounds.left >= box.left - 1 && bounds.right <= box.right + 1;
          });
        })
      )
    ).toBe(true);
    const paginationBox = (await page
      .locator('section[aria-labelledby="latest-title"] nav')
      .boundingBox())!;
    const gridBox = (await grid.boundingBox())!;
    expect(paginationBox.y).toBeGreaterThanOrEqual(gridBox.y + gridBox.height);
    const columnsBox = (await page
      .locator('section[aria-labelledby="columns-title"]')
      .boundingBox())!;
    expect(columnsBox.y).toBeGreaterThan(paginationBox.y);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`journal-${width}.png`) });
    await grid.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`journal-list-${width}.png`) });
  }
  await page.getByRole("button", { name: /Working systems/ }).click();
  await expect(page.getByRole("heading", { name: "Working systems", exact: true })).toBeVisible();
});

test("search prioritizes results and reset restores the editorial opening", async ({ page }) => {
  await page.goto("/single");
  const search = page.getByRole("searchbox", {
    name: messages.Journal.searchArticles,
    exact: true,
  });
  await expect(page.getByTestId("journal-lead")).toHaveCount(1);
  await search.fill("no-matching-entry");
  await expect(page.getByTestId("journal-lead")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: messages.Journal.noResultsTitle })).toBeVisible();
  await expect(page.locator('section[aria-labelledby="columns-title"]')).toHaveCount(0);
  await page.getByRole("button", { name: messages.Journal.clearFilters, exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page).toHaveURL(/\/single$/);
  await expect(page.getByTestId("journal-lead")).toHaveCount(1);
  await expect(page.getByTestId("journal-latest-grid").getByRole("article")).toHaveCount(12);
  await page.getByRole("button", { name: messages.Journal.next, exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByTestId("journal-lead")).toHaveCount(0);
  await expect(page.getByTestId("journal-latest-grid").getByRole("article")).toHaveCount(1);
});

test("featured text remains readable in every theme and media retains its dimensions", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/single");
  const lead = page.getByTestId("journal-lead").first();
  await expect(lead).toBeVisible();
  const bounds = (await lead.boundingBox())!;
  for (const variant of ["mouve", "glass", "brutalism"]) {
    for (const mode of ["light", "dark"]) {
      await page.evaluate(
        ({ variant, mode }) => {
          const root = document.documentElement;
          root.dataset.theme = `${variant}-${mode}`;
          root.dataset.themeVariant = variant;
          root.dataset.themeMode = mode;
          root.dataset.themeResolvedMode = mode;
          root.classList.toggle("dark", mode === "dark");
        },
        { variant, mode }
      );
      await expect(lead.getByRole("heading")).toHaveCSS("color", "rgb(255, 255, 255)");
      expect((await lead.boundingBox())!.height).toBe(bounds.height);
      await page.screenshot({ path: testInfo.outputPath(`journal-${variant}-${mode}.png`) });
    }
  }
});

test("text-only lead and normal motion keep reading links accessible", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/api/v1/public/blog/posts/featured?**", (route) =>
    route.fulfill({
      json: envelope({
        list: [{ ...story(24), summary: "" }],
        page: 0,
        size: 8,
        total: 1,
        totalPages: 1,
      }),
    })
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/single");
  const lead = page.getByTestId("journal-lead");
  await expect(lead).toBeVisible();
  await expect(lead.locator("img")).toHaveCount(0);
  await expect(lead).toHaveCSS("opacity", "1");
  await expect(lead.getByRole("heading")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const link = lead.getByRole("link");
  await link.focus();
  await expect(link).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("journal-text-only-lead.png") });
});
