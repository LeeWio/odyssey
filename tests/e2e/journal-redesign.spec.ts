import { expect, test } from "@playwright/test";
import messages from "../../messages/en.json";
import { story } from "./fixtures/journal";

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const categories = [
  { id: 1, name: "Engineering", slug: "engineering", count: 12 },
  { id: 2, name: "Design", slug: "design", count: 9 },
  { id: 3, name: "Loose Thoughts", slug: "loose-thoughts", count: 4 },
];
const topicGrid = (page: import("@playwright/test").Page) => page.getByTestId("journal-topics");
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

test.use({
  locale: "en-US",
  timezoneId: "Asia/Shanghai",
  contextOptions: { reducedMotion: "reduce" },
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    let data: unknown;
    if (url.pathname.endsWith("/blog/facets")) {
      data = {
        totalPublishedCount: 13,
        categories,
        tags: [{ id: 1, name: "Design", slug: "design", count: 8 }],
        archives: [{ year: 2026, month: 10, count: 13 }],
      };
    } else if (url.pathname.endsWith("/blog/discovery")) {
      data = {
        trending: [story(1), story(2)],
        mostRead: [story(3)],
      };
    } else if (url.pathname.endsWith("/posts/digest") && url.searchParams.get("size") === "2") {
      const id = Number(url.searchParams.get("categoryId"));
      data = {
        list: [story(id * 2 + 3), story(id * 2 + 4)],
        total: 2,
        page: 0,
        size: 2,
        totalPages: 1,
      };
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

test("topic library adapts across screens without overflowing or losing content", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/single");
  const heading = page.getByRole("heading", {
    name: messages.Journal.title,
    level: 1,
    exact: true,
  });
  const topics = topicGrid(page);
  const topicCards = topics.getByRole("article");
  const readingPicks = topics.getByTestId("journal-reading-picks");
  const list = page.getByTestId("journal-latest-list");
  const toolbar = page.getByRole("search", { name: messages.Journal.searchArticles });
  const search = toolbar.getByRole("searchbox");
  const filter = toolbar.getByRole("button", { name: /Filter articles by topic/ });
  await expect(heading).toBeVisible();
  await expect(list.getByRole("article")).toHaveCount(12);
  await expect(topicCards).toHaveCount(3);
  await expect(readingPicks).toBeVisible();
  await expect(filter).toBeEnabled();
  await expect(
    topicCards.first().getByRole("link", { name: "Browse Engineering" })
  ).toHaveAttribute("href", "/single/categories/engineering");
  await expect(topicCards.first().getByRole("link", { name: story(5).title })).toHaveAttribute(
    "href",
    "/single/design-story-5"
  );

  for (const width of [320, 390, 820, 1024, 1152, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const boxes = await topics.evaluate((grid) =>
      Array.from(grid.children, (card) => {
        const { x, y, width, height } = card.getBoundingClientRect();
        return { x, y, width, height };
      })
    );
    expect(boxes).toHaveLength(4);
    const firstRow = boxes.filter(({ y }) => y === boxes[0].y);
    expect(firstRow).toHaveLength(width >= 1152 ? 4 : width >= 640 ? 2 : 1);
    expect(boxes[0].width).toBeLessThanOrEqual(448);
    for (const [index, box] of firstRow.entries()) {
      expect(box.height).toBeCloseTo(firstRow[0].height);
      if (index > 0) {
        const preceding = firstRow[index - 1];
        expect(box.x - preceding.x - preceding.width).toBeCloseTo(16);
      }
    }
    if (width >= 1152) {
      const last = firstRow.at(-1)!;
      expect(last.x + last.width).toBeGreaterThan(width - 40);
    }
    expect((await list.boundingBox())!.y).toBeGreaterThan(
      (await topics.boundingBox())!.y + (await topics.boundingBox())!.height
    );
    const [searchBox, filterBox] = [(await search.boundingBox())!, (await filter.boundingBox())!];
    expect(filterBox.x).toBeGreaterThan(searchBox.x + searchBox.width);
    expect(Math.abs(filterBox.y - searchBox.y)).toBeLessThan(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    expect(
      await list.evaluate((element) =>
        [...element.querySelectorAll('[role="article"]')].every((article) => {
          const box = article.getBoundingClientRect();
          return [...article.querySelectorAll("h3, a, button")].every((item) => {
            const bounds = item.getBoundingClientRect();
            return bounds.left >= box.left - 1 && bounds.right <= box.right + 1;
          });
        })
      )
    ).toBe(true);
    const pagination = page.getByRole("navigation", { name: messages.Journal.indexPagination });
    const paginationBox = (await pagination.boundingBox())!;
    const listBox = (await list.boundingBox())!;
    expect(paginationBox.y).toBeGreaterThanOrEqual(listBox.y + listBox.height);
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: testInfo.outputPath(`journal-${width}.png`) });
    }
  }
  const pagination = page.getByRole("navigation", { name: messages.Journal.indexPagination });
  await pagination.scrollIntoViewIfNeeded();
  const columnsSection = page.getByRole("region", { name: messages.Journal.indexColumns });
  await expect(columnsSection).toBeVisible();
  const columnsBox = (await columnsSection.boundingBox())!;
  const paginationBox = (await pagination.boundingBox())!;
  expect(columnsBox.y).toBeGreaterThanOrEqual(paginationBox.y + paginationBox.height);
  await columnsSection.getByRole("radio", { name: "Working systems" }).click();
  await expect(
    columnsSection.getByRole("link", { name: messages.Journal.viewColumn })
  ).toHaveAttribute("href", "/columns/series-2");
  await expect(
    page.getByRole("link", { name: messages.Journal.viewArchive, exact: true })
  ).toHaveAttribute("href", "/archive");
});

test("search prioritizes results and reset restores the topic library", async ({ page }) => {
  await page.goto("/single");
  const search = page.getByRole("searchbox", {
    name: messages.Journal.searchArticles,
    exact: true,
  });
  await expect(topicGrid(page)).toHaveCount(1);
  await search.fill("no-matching-entry");
  await expect(topicGrid(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: messages.Journal.noResultsTitle })).toBeVisible();
  await expect(page.locator('section[aria-labelledby="columns-title"]')).toHaveCount(0);
  await page.getByRole("button", { name: messages.Journal.clearFilters, exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page).toHaveURL(/\/single$/);
  await expect(topicGrid(page)).toHaveCount(1);
  await expect(page.getByTestId("journal-latest-list").getByRole("article")).toHaveCount(12);
  await page.getByRole("button", { name: messages.Journal.next, exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(topicGrid(page)).toHaveCount(0);
  await expect(page.getByTestId("journal-latest-list").getByRole("article")).toHaveCount(1);
  await page.getByRole("button", { name: messages.Journal.previous, exact: true }).click();
  await expect(page).toHaveURL(/\/single$/);
  await expect(topicGrid(page)).toBeVisible();
});

test("topic and article text remain readable in every theme and authored thumbnails retain their dimensions", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/single");
  await expect(topicGrid(page).getByRole("article")).toHaveCount(3);
  const cover = page.getByTestId("journal-latest-list").getByRole("article").first().locator("img");
  await expect(cover).toHaveAttribute("src", "/IMG_5332.JPG");
  await expect
    .poll(() => cover.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
  for (const variant of ["default", "mouve", "glass", "brutalism"]) {
    for (const mode of ["light", "dark"]) {
      await page.evaluate(
        ({ variant, mode }) => {
          const root = document.documentElement;
          const themeName = variant === "default" ? mode : `${variant}-${mode}`;
          root.dataset.theme = themeName;
          for (const className of [
            "mouve-light",
            "mouve-dark",
            "glass-light",
            "glass-dark",
            "brutalism-light",
            "brutalism-dark",
          ]) {
            root.classList.remove(className);
          }
          root.classList.add(themeName);
          root.classList.toggle("dark", mode === "dark");
          root.classList.toggle("light", mode === "light");
        },
        { variant, mode }
      );
      const measureContrast = () =>
        page.evaluate(() => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const context = canvas.getContext("2d")!;
          const paint = (color: string) => {
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
          };
          const brightness = () => {
            const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
            const [r, g, b] = channels.map((channel) => {
              const value = channel / 255;
              return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
          };
          const articles = [
            document.querySelector('[data-testid="journal-topics"] [role="article"]')!,
            document.querySelector('[data-testid="journal-latest-list"] [role="article"]')!,
          ];
          return Math.min(
            ...articles.flatMap((article) =>
              Array.from(
                article.querySelectorAll('h3, a, time, [data-slot="typography"]'),
                (text) => {
                  context.clearRect(0, 0, 1, 1);
                  paint(getComputedStyle(document.body).backgroundColor);
                  paint(getComputedStyle(article).backgroundColor);
                  const background = brightness();
                  paint(getComputedStyle(text).color);
                  const foreground = brightness();
                  return (
                    (Math.max(background, foreground) + 0.05) /
                    (Math.min(background, foreground) + 0.05)
                  );
                }
              )
            )
          );
        });
      await expect
        .poll(measureContrast, { message: `${variant}-${mode}` })
        .toBeGreaterThanOrEqual(4.5);
      const bounds = (await cover.boundingBox())!;
      expect(bounds.width / bounds.height).toBeCloseTo(1.5, 1);
      await page.screenshot({ path: testInfo.outputPath(`journal-${variant}-${mode}.png`) });
    }
  }
});

test("a story without a cover uses topic artwork and keeps its reading link and date @smoke", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/single");
  const card = page
    .getByTestId("journal-latest-list")
    .getByRole("article", { name: story(3).title, exact: true });
  const link = card.getByRole("link", { name: story(3).title, exact: true });
  await expect(card.locator("img")).toHaveAttribute("src", /topic-engineering/);
  await expect(link).toHaveAttribute("href", "/single/design-story-3");
  await link.focus();
  await expect(link).toBeFocused();
  await expect(card.locator("time")).toHaveAttribute("datetime", story(3).publishedAt);
  await expect(card.locator("time")).toHaveText("Oct 1, 2026");
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("journal-topic-artwork.png") });
});
