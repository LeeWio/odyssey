import { expect, test } from "@playwright/test";
import messages from "../../messages/en.json";
import { story } from "./fixtures/journal";

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const category = { id: 1, name: "Engineering", slug: "engineering", count: 12 };
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
        categories: [category],
        tags: [{ id: 1, name: "Design", slug: "design", count: 8 }],
        archives: [{ year: 2026, month: 10, count: 13 }],
      };
    } else if (url.pathname.endsWith("/blog/discovery")) {
      data = {
        trending: [story(1), story(2)],
        mostRead: [story(3)],
        categoryGroups: [{ category, heroPost: story(5), supportingPosts: [story(6)] }],
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
  const list = page.getByTestId("journal-latest-list");
  const toolbar = page.getByRole("search", { name: messages.Journal.searchArticles });
  const search = toolbar.getByRole("searchbox");
  const filter = toolbar.getByRole("button", { name: /Filter articles by topic/ });
  await expect(heading).toBeVisible();
  await expect(list.getByRole("article")).toHaveCount(12);
  await expect(companions).toHaveCount(2);
  await expect(filter).toBeEnabled();
  await expect(lead.getByRole("link")).toHaveAttribute("href", "/single/design-story-22");

  for (const width of [320, 390, 820, 1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const leadBox = (await lead.boundingBox())!;
    const secondaryBox = (await companions.first().boundingBox())!;
    if (width >= 1024) {
      expect(secondaryBox.x).toBeGreaterThanOrEqual(leadBox.x + leadBox.width);
      expect(secondaryBox.y).toBeLessThan(leadBox.y + leadBox.height);
    } else {
      expect(secondaryBox.y).toBeGreaterThanOrEqual(leadBox.y + leadBox.height);
    }
    if (width === 390) await expect(page.getByRole("heading", { name: "Latest" })).toBeInViewport();
    const title = await lead.getByRole("heading").evaluate((element) => {
      const style = getComputedStyle(element);
      return { size: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight) };
    });
    expect(title.lineHeight).toBeGreaterThan(title.size);
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
  const archive = page.getByRole("region", { name: messages.Journal.fromTheArchive });
  const shelf = archive.getByRole("button", { name: "Engineering" });
  await shelf.press("Enter");
  await expect(shelf).toHaveAttribute("aria-expanded", "true");
  await expect(archive.getByRole("link", { name: /Browse Engineering/ })).toHaveAttribute(
    "href",
    "/single/categories/engineering"
  );
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
  await expect(page.getByTestId("journal-latest-list").getByRole("article")).toHaveCount(12);
  await page.getByRole("button", { name: messages.Journal.next, exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByTestId("journal-lead")).toHaveCount(0);
  await expect(page.getByTestId("journal-latest-list").getByRole("article")).toHaveCount(1);
  await page.getByRole("button", { name: messages.Journal.previous, exact: true }).click();
  await expect(page).toHaveURL(/\/single$/);
  await expect(page.getByTestId("journal-lead")).toBeVisible();
});

test("editorial text remains readable in every theme and authored thumbnails retain their dimensions", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/single");
  const lead = page.getByTestId("journal-lead").first();
  await expect(lead).toBeVisible();
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
            document.querySelector('[data-testid="journal-lead"]')!,
            document.querySelector('[data-testid="journal-latest-list"] [role="article"]')!,
          ];
          return Math.min(
            ...articles.flatMap((article) =>
              Array.from(
                article.querySelectorAll('h3 a, time, [data-slot="card-description"]'),
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

test("a text-only lead keeps dates and reading links stable after hydration @smoke", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/single");
  const lead = page.getByTestId("journal-lead");
  await expect(lead).toBeVisible();
  await expect(lead.locator("canvas")).toHaveCount(0);
  await expect(lead.locator("img")).toHaveCount(0);
  await expect(lead).toHaveCSS("opacity", "1");
  await expect(lead.getByRole("heading")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const link = lead.getByRole("link");
  const filter = page.getByRole("button", { name: /Filter articles by topic/ });
  await expect(filter).toBeEnabled();
  await filter.focus();
  await expect(filter).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  await expect(lead.locator("time")).toHaveAttribute("datetime", story(22).publishedAt);
  await expect(lead.locator("time")).toHaveText("Oct 1, 2026");
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("journal-text-only-lead.png") });
});
