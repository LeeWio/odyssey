import { expect, test, type Page } from "@playwright/test";

const moments = Array.from({ length: 96 }, (_, index) => ({
  id: 96 - index,
  content: `Moment ${96 - index}. ${"A small observation worth keeping. ".repeat((index % 4) + 2)}`,
  likesCount: 0,
  commentsCount: 0,
  visibility: "public",
  authorName: "wei.li",
  images: [],
  topics: [],
  createdAt: "2026-10-20T06:00:00Z",
  updatedAt: "2026-10-20T06:00:00Z",
}));

async function prepare(page: Page, failNextPage = false) {
  const requests: number[] = [];
  let failed = false;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/public/moments") {
      const pageNumber = Number(url.searchParams.get("page") ?? 0);
      const size = Number(url.searchParams.get("size") ?? 12);
      requests.push(pageNumber);
      if (failNextPage && pageNumber === 1 && !failed) {
        failed = true;
        return route.fulfill({ status: 503, json: { message: "Unavailable" } });
      }
      return route.fulfill({
        json: {
          code: 200,
          message: "OK",
          data: {
            list: moments.slice(pageNumber * size, (pageNumber + 1) * size),
            total: moments.length,
            page: pageNumber,
            size,
            totalPages: Math.ceil(moments.length / size),
          },
        },
      });
    }
    return route.fulfill({ status: 503, json: { message: "Unavailable" } });
  });
  return requests;
}

for (const width of [390, 1440]) {
  test(`home card locates a second-page moment and survives refresh at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await prepare(page);
    await page.goto("/");
    const showcase = page.locator("#moments-showcase");
    await expect(showcase.getByRole("heading", { name: "This & That" })).toBeVisible();
    await expect(showcase.getByRole("link", { name: "This & That", exact: true })).toHaveAttribute(
      "href",
      "/moments"
    );
    const card = showcase.locator('a[href="/moments#moment-79"]');
    await card.click();
    await expect(page).toHaveURL(/\/moments#moment-79$/);
    const target = page.locator("#moment-79");
    await expect(target).toHaveAttribute("data-moment-target", "true");
    await expect(target).toBeFocused();
    await expect(target).toBeInViewport();
    await expect.poll(async () => (await target.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(96);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({ path: testInfo.outputPath(`moment-target-${width}.png`) });

    await page.reload();
    await expect(target).toHaveAttribute("data-moment-target", "true");
    await expect(target).toBeFocused();
    await expect(target).toBeInViewport();
    await expect.poll(async () => (await target.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(96);

    const loadMore = page.getByRole("button", { name: "Load more notes", exact: true });
    await loadMore.click();
    await expect(page.locator("#moment-61")).toBeAttached();
    await expect(loadMore).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test("a failed anchor lookup stops requesting until the reader retries", async ({ page }) => {
  const requests = await prepare(page, true);
  await page.goto("/moments#moment-79");
  await expect(
    page.getByRole("status").filter({ hasText: "Couldn't load the next page" })
  ).toBeVisible();
  expect(requests.filter((pageNumber) => pageNumber === 1)).toHaveLength(1);
  await page
    .getByRole("region", { name: "Moments feed" })
    .getByRole("button", { name: "Try again", exact: true })
    .click();
  await expect(page.locator("#moment-79")).toBeFocused();
  expect(requests.filter((pageNumber) => pageNumber === 1)).toHaveLength(2);
});

test("unknown anchors pause after five additional pages without scanning the whole archive", async ({
  page,
}) => {
  const requests = await prepare(page);
  await page.goto("/moments#moment-9999");
  await expect(
    page.getByRole("status").filter({ hasText: "This moment may be further back" })
  ).toBeVisible();
  expect(requests).toEqual([0, 1, 2, 3, 4, 5]);
  await page.getByRole("button", { name: "Keep looking", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "no longer in the public feed" })
  ).toBeVisible();
  expect(requests).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  await page.getByRole("button", { name: "Dismiss", exact: true }).click();
  await expect(
    page.getByText("This moment is no longer in the public feed.", { exact: true })
  ).toHaveCount(0);
});

test("hash navigation and browser back move focus without fetching unnecessary pages", async ({
  page,
}) => {
  const requests = await prepare(page);
  await page.goto("/moments#moment-96");
  await expect(page.locator("#moment-96")).toBeFocused();
  await page.evaluate(() => {
    window.location.hash = "moment-90";
  });
  await expect(page.locator("#moment-90")).toBeFocused();
  await page.goBack();
  await expect(page.locator("#moment-96")).toBeFocused();
  expect(requests).toEqual([0]);
});

test("malformed hashes do not trigger archive scanning", async ({ page }) => {
  const requests = await prepare(page);
  await page.goto("/moments#moment--1");
  await expect(page.locator("#moment-96")).toBeVisible();
  expect(requests).toEqual([0]);
  await expect(page.getByRole("button", { name: "Stop searching", exact: true })).toHaveCount(0);
});

test.describe("Chinese home", () => {
  test.use({ locale: "zh-CN" });

  test("uses distinct writing and moment names, with title-only map navigation", async ({
    page,
  }, testInfo) => {
    await prepare(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "所思所写", exact: true }).first()).toBeVisible();
    const showcase = page.locator("#moments-showcase");
    await expect(showcase.getByRole("heading", { name: "三言两语" })).toBeVisible();
    await expect(showcase.getByText("说说这个，聊聊那个。", { exact: true })).toBeVisible();
    const map = page.locator("#footprints-showcase");
    await expect(map.getByRole("link", { name: "记忆地图", exact: true })).toHaveAttribute(
      "href",
      "/footprints"
    );
    await expect(map.getByRole("link")).toHaveCount(1);
    await expect(page.getByText("Code is cheap. Show me the talk.", { exact: true })).toBeVisible();
    await showcase.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("moments-zh.png") });
  });
});
