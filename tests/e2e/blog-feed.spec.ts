import { expect, test as base } from "@playwright/test";

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const post = (id: number, title: string) => ({
  id,
  title,
  slug: `feed-${id}`,
  status: "PUBLISHED",
  isFeatured: false,
  views: 10,
  likesCount: 0,
  favoritesCount: 0,
  category: null,
  series: null,
  seriesOrder: null,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
});
const result = (list: unknown[], page = 0, total = list.length) =>
  envelope({
    list,
    page,
    size: 8,
    total,
    totalPages: Math.ceil(total / 8),
  });
const endpoint = "**/api/v1/public/blog/posts?**";

test.use({ locale: "en-US" });
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({ status: 503, json: { message: "Unmocked API request" } })
  );
  await page.route("**/api/v1/public/blog/posts/featured?**", (route) =>
    route.fulfill({ json: result([]) })
  );
  await page.route("**/api/v1/public/blog/facets", (route) =>
    route.fulfill({
      json: envelope({
        totalPublishedCount: 9,
        categories: [{ id: 1, name: "Systems", count: 9 }],
      }),
    })
  );
});

test("new search input removes old cards, counts, and pagination while waiting", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    const keyword = new URL(route.request().url()).searchParams.get("keyword");
    if (keyword) {
      await response.promise;
      await route.fulfill({ json: result([post(2, "Matching article")]) });
    } else {
      await route.fulfill({ json: result([post(1, "Original article")], 0, 9) });
    }
  });
  try {
    await page.goto("/blog");
    const results = page.locator("#all-writing");
    await expect(results.getByText("Original article", { exact: true })).toBeVisible();
    await page.getByRole("searchbox", { name: "Search articles" }).fill("matching");
    // Read immediately, without polling through an exit animation that retains stale links.
    expect(await results.locator('a[href="/single/feed-1"]').count()).toBe(0);
    await expect(results.getByRole("status", { name: "Loading articles" })).toBeVisible();
    await expect(results.getByText("9 articles", { exact: true })).toHaveCount(0);
    await expect(results.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
    await expect(results.getByText("No matching articles", { exact: true })).toHaveCount(0);
    response.resolve();
    await expect(results.getByText("Matching article", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Clear search", exact: true }).click();
    await expect(results.getByText("Original article", { exact: true })).toBeVisible();
    await expect(results.getByText("Matching article", { exact: true })).toHaveCount(0);
  } finally {
    response.resolve();
  }
});

test("topic selection resets pagination and an empty topic can return to all writing", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  const categoryPages: string[] = [];
  await page.route(endpoint, async (route) => {
    const params = new URL(route.request().url()).searchParams;
    if (params.get("categoryId")) {
      categoryPages.push(params.get("page")!);
      await response.promise;
      await route.fulfill({ json: result([]) });
    } else {
      const index = Number(params.get("page"));
      await route.fulfill({
        json: result([post(index + 1, `Page ${index + 1} article`)], index, 9),
      });
    }
  });
  try {
    await page.goto("/blog");
    const results = page.locator("#all-writing");
    await results.getByRole("button", { name: "Next", exact: true }).press("Enter");
    await expect(results.getByText("Page 2 article", { exact: true })).toBeVisible();
    await page.getByRole("row", { name: /Systems/ }).press("Space");
    await expect.poll(() => categoryPages).toEqual(["0"]);
    await expect(results.getByText("Page 2 article", { exact: true })).toHaveCount(0);
    await expect(results.getByRole("status", { name: "Loading articles" })).toBeVisible();
    response.resolve();
    await expect(results.getByText("No articles in this topic", { exact: true })).toBeVisible();
    await results.getByRole("button", { name: "View all topics", exact: true }).press("Enter");
    await expect(results.getByText("Page 1 article", { exact: true })).toBeVisible();
  } finally {
    response.resolve();
  }
});

test("a failed second page retains Previous without reusing the first page totals", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    if (new URL(route.request().url()).searchParams.get("page") === "1") {
      await response.promise;
      await route.fulfill({ status: 503, json: { message: "Temporarily unavailable" } });
    } else {
      await route.fulfill({ json: result([post(1, "First-page article")], 0, 9) });
    }
  });
  try {
    await page.goto("/blog");
    const results = page.locator("#all-writing");
    await results.getByRole("button", { name: "Next", exact: true }).press("Enter");
    await expect(results.getByRole("status", { name: "Loading articles" })).toBeVisible();
    await expect(results.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    await expect(results.getByText("First-page article", { exact: true })).toHaveCount(0);
    response.resolve();
    await expect(results.getByText("The chronicle is unavailable", { exact: true })).toBeVisible();
    await expect(results.getByText("9 articles", { exact: true })).toHaveCount(0);
    await expect(results.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await results.getByRole("button", { name: "Previous", exact: true }).press("Enter");
    await expect(results.getByText("First-page article", { exact: true })).toBeVisible();
  } finally {
    response.resolve();
  }
});

test("a late older keyword response cannot replace the current search", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  let started = false;
  await page.route(endpoint, async (route) => {
    const keyword = new URL(route.request().url()).searchParams.get("keyword");
    if (keyword === "alpha") {
      started = true;
      await response.promise;
    }
    await route.fulfill({
      json: result([post(keyword === "alpha" ? 1 : 2, `${keyword ?? "Initial"} article`)]),
    });
  });
  try {
    await page.goto("/blog");
    const input = page.getByRole("searchbox", { name: "Search articles" });
    const results = page.locator("#all-writing");
    await input.fill("alpha");
    await expect.poll(() => started).toBe(true);
    await input.fill("beta");
    await expect(results.getByText("beta article", { exact: true })).toBeVisible();
    const delivered = page.waitForResponse((value) => value.url().includes("keyword=alpha"));
    response.resolve();
    await delivered;
    await expect(results.getByText("alpha article", { exact: true })).toHaveCount(0);
    await expect(results.getByText("beta article", { exact: true })).toBeVisible();
  } finally {
    response.resolve();
  }
});

test("retrying a page after the list shrinks moves to the last available page", async ({
  page,
}) => {
  let attempts = 0;
  await page.route(endpoint, async (route) => {
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    if (index === 1) {
      attempts += 1;
      await route.fulfill(
        attempts === 1
          ? { status: 503, json: { message: "Temporarily unavailable" } }
          : { json: result([], 1, 1) }
      );
    } else {
      await route.fulfill({ json: result([post(1, "Remaining article")], 0, attempts ? 1 : 9) });
    }
  });
  await page.goto("/blog");
  const results = page.locator("#all-writing");
  await results.getByRole("button", { name: "Next", exact: true }).press("Enter");
  await expect(results.getByText("The chronicle is unavailable", { exact: true })).toBeVisible();
  await results.getByRole("button", { name: "Try again", exact: true }).press("Enter");
  await expect(results.getByText("Remaining article", { exact: true })).toBeVisible();
  await expect(results.getByText("1 article", { exact: true })).toBeVisible();
  await expect(results.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
  await expect(results.getByText("No articles yet", { exact: true })).toHaveCount(0);
  expect(attempts).toBe(2);
});
