import { expect, test as base, type Page } from "@playwright/test";

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
  isInReadingList: false,
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

async function openFeed(page: Page, query = "") {
  await page.goto(`/chronicle${query}`);
  await page.getByRole("tab", { name: "Orbit Feed", exact: true }).click();
}

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

test("saves an article from the feed without navigating away", async ({ page }, testInfo) => {
  let saveCalls = 0;
  let removeCalls = 0;
  let saved = false;
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "blog-feed-reading-list-test",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    )
  );
  await page.route("**/api/v1/user/me", (route) =>
    route.fulfill({ json: envelope({ id: 1, username: "reader" }) })
  );
  await page.route("**/api/v1/user/library/reading-list/123", async (route) => {
    if (route.request().method() === "PUT") {
      saveCalls += 1;
      saved = true;
    }
    if (route.request().method() === "DELETE") {
      removeCalls += 1;
      saved = false;
    }
    await route.fulfill({ json: envelope(null) });
  });
  await page.route(endpoint, (route) =>
    route.fulfill({ json: result([{ ...post(123, "Saveable article"), isInReadingList: saved }]) })
  );

  await openFeed(page);
  const articleCard = page.getByRole("article", { name: "Saveable article", exact: true });
  const save = articleCard.getByRole("button", { name: "Save for later", exact: true });

  await save.press("Enter");
  await expect.poll(() => saveCalls).toBe(1);
  await expect(page).toHaveURL(/\/chronicle(?:\?.*)?$/);
  await expect(
    articleCard.getByRole("button", { name: "Saved for later", exact: true })
  ).toBeVisible();
  await expect(
    articleCard.getByRole("button", { name: "Saved for later", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    articleCard.getByRole("button", { name: "Saved for later", exact: true })
  ).toBeEnabled();

  await articleCard.getByRole("button", { name: "Saved for later", exact: true }).press("Enter");
  await expect.poll(() => removeCalls).toBe(1);
  await expect(
    articleCard.getByRole("button", { name: "Save for later", exact: true })
  ).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Orbit Feed", exact: true }).click();
  await expect(
    articleCard.getByRole("button", { name: "Save for later", exact: true })
  ).toBeVisible();
  await articleCard.scrollIntoViewIfNeeded();
  await articleCard.screenshot({ path: testInfo.outputPath("reading-list-desktop.png") });
});

test("a guest bookmark opens sign in without sending a mutation", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let writes = 0;
  await page.route(endpoint, (route) =>
    route.fulfill({ json: result([post(123, "Guest article")]) })
  );
  await page.route("**/api/v1/user/library/reading-list/**", (route) => {
    writes += 1;
    return route.fulfill({ json: envelope(null) });
  });
  await openFeed(page);
  const card = page.getByRole("article", { name: "Guest article", exact: true });
  await expect(card).toBeVisible();
  await expect(card.getByRole("link", { name: "Guest article", exact: true })).toHaveAttribute(
    "href",
    "/single/feed-123"
  );
  expect(await card.locator("a button").count()).toBe(0);
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: testInfo.outputPath("reading-list-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false
  );
  const save = card.getByRole("button", { name: "Save for later", exact: true });
  await expect(save).toBeEnabled();
  await save.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(/\/chronicle(?:\?.*)?$/);
  expect(writes).toBe(0);
});

test("pending saves prevent duplicates, and failed saves can be retried", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  let writes = 0;
  let saved = false;
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "pending-reading-list-test",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    )
  );
  await page.route("**/api/v1/user/me", (route) =>
    route.fulfill({ json: envelope({ id: 1, username: "reader" }) })
  );
  await page.route(endpoint, (route) =>
    route.fulfill({ json: result([{ ...post(123, "Retry article"), isInReadingList: saved }]) })
  );
  await page.route("**/api/v1/user/library/reading-list/123", async (route) => {
    expect(route.request().method()).toBe("PUT");
    writes += 1;
    if (writes === 1) {
      await response.promise;
      return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    }
    saved = true;
    return route.fulfill({ json: envelope(null) });
  });
  try {
    await openFeed(page);
    const card = page.getByRole("article", { name: "Retry article", exact: true });
    const button = card.getByRole("button", { name: "Save for later", exact: true });
    await button.click();
    await expect.poll(() => writes).toBe(1);
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await button.press("Enter");
    expect(writes).toBe(1);
    response.resolve();
    await expect(button).toBeEnabled();
    await button.press("Enter");
    await expect.poll(() => writes).toBe(2);
    await expect(
      card.getByRole("button", { name: "Saved for later", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/\/chronicle(?:\?.*)?$/);
  } finally {
    response.resolve();
  }
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
    await openFeed(page);
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
    await openFeed(page);
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

test("search filters and page are restored from the URL after reload", async ({ page }) => {
  const requests: string[] = [];
  await page.route(endpoint, async (route) => {
    const params = new URL(route.request().url()).searchParams;
    requests.push(`${params.get("keyword")}:${params.get("categoryId")}:${params.get("page")}`);
    await route.fulfill({ json: result([post(2, "Systems article")], 1, 9) });
  });

  await openFeed(page, "?keyword=systems&categoryId=1&page=2");
  const results = page.locator("#all-writing");
  await expect(page.getByRole("searchbox", { name: "Search articles" })).toHaveValue("systems");
  await expect(results.getByText("Systems article", { exact: true })).toBeVisible();
  await expect.poll(() => requests.at(-1)).toBe("systems:1:1");

  await page.reload();
  await page.getByRole("tab", { name: "Orbit Feed", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Search articles" })).toHaveValue("systems");
  await expect(results.getByText("Systems article", { exact: true })).toBeVisible();
  await expect.poll(() => requests.length).toBeGreaterThanOrEqual(2);
  expect(requests.at(-1)).toBe("systems:1:1");
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
    await openFeed(page);
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
    await openFeed(page);
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
  await openFeed(page);
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
