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
const article = (id: number, title: string, saved = false) => ({
  id,
  title,
  slug: `journal-${id}`,
  status: "PUBLISHED",
  isFeatured: false,
  views: 10,
  likesCount: 0,
  favoritesCount: 0,
  isInReadingList: saved,
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
    size: 6,
    total,
    totalPages: Math.ceil(total / 6),
  });
const endpoint = "**/api/v1/public/blog/posts?**";
const latest = (page: Page) => page.getByRole("region", { name: "Search results", exact: true });
const signIn = (page: Page) =>
  page.addInitScript(() =>
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "journal-test",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    )
  );

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/user/me")
      return route.fulfill({ json: envelope({ id: 1, username: "reader" }) });
    if (path.endsWith("/unread/count")) return route.fulfill({ json: envelope(0) });
    if (path.endsWith("/library/overview"))
      return route.fulfill({
        json: envelope({ continueReading: [], recentFavorites: [], recommendations: [] }),
      });
    if (path.endsWith("/posts/featured")) return route.fulfill({ json: result([]) });
    if (path.endsWith("/blog/discovery"))
      return route.fulfill({ json: envelope({ trending: [], mostRead: [], categoryGroups: [] }) });
    if (path.endsWith("/blog/facets"))
      return route.fulfill({
        json: envelope({
          totalPublishedCount: 12,
          categories: [{ id: 1, name: "Systems", slug: "systems", count: 12 }],
        }),
      });
    if (path.endsWith("/columns")) return route.fulfill({ json: envelope([]) });
    return route.fulfill({ status: 503, json: { message: "Unmocked request" } });
  });
});

test("retired blog links permanently redirect to the journal with their filters", async ({
  page,
}) => {
  let parameters: URLSearchParams | undefined;
  await page.route(endpoint, (route) => {
    parameters = new URL(route.request().url()).searchParams;
    return route.fulfill({ json: result([article(1, "Migrated article")], 1, 12) });
  });
  const response = await page.request.get("/blog", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/single");
  await page.goto("/blog?keyword=notes&categoryId=1&page=2&source=old-link");
  await expect(
    latest(page).getByRole("link", { name: "Migrated article", exact: true })
  ).toBeVisible();
  const url = new URL(page.url());
  expect(url.pathname).toBe("/single");
  expect(url.searchParams.get("q")).toBe("notes");
  expect(url.searchParams.get("category")).toBe("1");
  expect(url.searchParams.get("page")).toBe("2");
  expect(url.searchParams.get("source")).toBe("old-link");
  expect(parameters?.get("keyword")).toBe("notes");
  expect(parameters?.get("categoryId")).toBe("1");
  expect(parameters?.get("page")).toBe("1");
});

test("journal bookmarks save, remove and restore state on reload", async ({ page }) => {
  await signIn(page);
  let saved = false;
  const methods: string[] = [];
  await page.route(endpoint, (route) =>
    route.fulfill({ json: result([article(1, "Reading article", saved)]) })
  );
  await page.route("**/api/v1/user/library/reading-list/1", (route) => {
    methods.push(route.request().method());
    saved = route.request().method() === "PUT";
    return route.fulfill({ json: envelope(null) });
  });
  await page.goto("/single?q=reading");
  const card = latest(page).getByRole("article", { name: "Reading article", exact: true });
  const save = card.getByRole("button", { name: "Save for later", exact: true });
  await save.press("Enter");
  const remove = card.getByRole("button", { name: "Saved for later", exact: true });
  await expect(remove).toBeEnabled();
  await expect(remove).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/\/single\?q=reading$/);
  await page.reload();
  await expect(remove).toBeEnabled();
  await remove.click();
  await expect(save).toBeEnabled();
  await expect(save).toHaveAttribute("aria-pressed", "false");
  expect(methods).toEqual(["PUT", "DELETE"]);
});

test("guest journal bookmarks prompt login without nested controls or mobile overflow", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(endpoint, (route) =>
    route.fulfill({ json: result([article(1, "Mobile reading article")]) })
  );
  let writes = 0;
  await page.route("**/api/v1/user/library/reading-list/**", (route) => {
    writes += 1;
    return route.fulfill({ json: envelope(null) });
  });
  await page.goto("/single?q=reading");
  const card = latest(page).getByRole("article", { name: "Mobile reading article", exact: true });
  await expect(card).toBeVisible();
  expect(await card.locator("a button").count()).toBe(0);
  await card.screenshot({ path: info.outputPath("journal-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false
  );
  await card.getByRole("button", { name: "Save for later", exact: true }).press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(writes).toBe(0);
});

test("journal saves block duplicate writes and allow retry after failure", async ({ page }) => {
  await signIn(page);
  const release = Promise.withResolvers<void>();
  let writes = 0;
  let saved = false;
  await page.route(endpoint, (route) =>
    route.fulfill({ json: result([article(1, "Retry article", saved)]) })
  );
  await page.route("**/api/v1/user/library/reading-list/1", async (route) => {
    writes += 1;
    if (writes === 1) {
      await release.promise;
      return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    }
    saved = true;
    return route.fulfill({ json: envelope(null) });
  });
  try {
    await page.goto("/single?q=retry");
    const button = latest(page).getByRole("button", { name: "Save for later", exact: true });
    await button.click();
    await expect.poll(() => writes).toBe(1);
    await expect(button).toBeDisabled();
    await button.press("Enter");
    expect(writes).toBe(1);
    release.resolve();
    await expect(button).toBeEnabled();
    await button.press("Enter");
    await expect(
      latest(page).getByRole("button", { name: "Saved for later", exact: true })
    ).toBeEnabled();
    expect(writes).toBe(2);
  } finally {
    release.resolve();
  }
});

test("search immediately hides stale cards through debounce and delayed results", async ({
  page,
}) => {
  const release = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    const keyword = new URL(route.request().url()).searchParams.get("keyword");
    if (keyword === "beta") await release.promise;
    return route.fulfill({
      json: result([article(keyword === "beta" ? 2 : 1, `${keyword} article`)]),
    });
  });
  try {
    await page.goto("/single?q=alpha");
    await expect(
      latest(page).getByRole("link", { name: "alpha article", exact: true })
    ).toBeVisible();
    await page.getByRole("searchbox", { name: "Search articles", exact: true }).fill("beta");
    expect(await page.getByRole("link", { name: "alpha article", exact: true }).count()).toBe(0);
    await expect(page.getByRole("status", { name: "Loading stories", exact: true })).toBeVisible();
    await expect(page.getByText("No published stories yet", { exact: true })).toHaveCount(0);
    release.resolve();
    await expect(
      latest(page).getByRole("link", { name: "beta article", exact: true })
    ).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search articles", exact: true })).toHaveValue(
      "beta"
    );
  } finally {
    release.resolve();
  }
});

test("a delayed topic change displays loading rather than empty results", async ({ page }) => {
  const release = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    const category = new URL(route.request().url()).searchParams.get("categoryId");
    if (category) await release.promise;
    return route.fulfill({
      json: result([article(category ? 2 : 1, category ? "Systems article" : "Original article")]),
    });
  });
  try {
    await page.goto("/single?q=reading");
    await expect(
      latest(page).getByRole("link", { name: "Original article", exact: true })
    ).toBeVisible();
    await page
      .getByRole("row", { name: /Systems/ })
      .first()
      .press("Space");
    await expect(page.getByRole("status", { name: "Loading stories", exact: true })).toBeVisible();
    await expect(page.getByText("No published stories yet", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Original article", exact: true })).toHaveCount(0);
    release.resolve();
    await expect(page.getByRole("link", { name: "Systems article", exact: true })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("category")).toBe("1");
  } finally {
    release.resolve();
  }
});

test("returning to an earlier URL restores its input rather than a stale search draft", async ({
  page,
}) => {
  await page.route(endpoint, (route) => {
    const keyword = new URL(route.request().url()).searchParams.get("keyword");
    return route.fulfill({ json: result([article(1, `${keyword} article`)]) });
  });
  await page.goto("/single?q=alpha");
  const input = page.getByRole("searchbox", { name: "Search articles", exact: true });
  await expect(
    latest(page).getByRole("link", { name: "alpha article", exact: true })
  ).toBeVisible();
  await input.fill("beta");
  await expect(latest(page).getByRole("link", { name: "beta article", exact: true })).toBeVisible();
  await page.evaluate(() => window.history.pushState(null, "", "/single?q=alpha"));
  await expect(input).toHaveValue("alpha");
  await expect(
    latest(page).getByRole("link", { name: "alpha article", exact: true })
  ).toBeVisible();
});

test("a failed later journal page offers Previous without discarding the search", async ({
  page,
}) => {
  await page.route(endpoint, (route) => {
    const pageIndex = new URL(route.request().url()).searchParams.get("page");
    return pageIndex === "1"
      ? route.fulfill({ status: 503, json: { message: "Unavailable" } })
      : route.fulfill({ json: result([article(1, "First page article")], 0, 12) });
  });
  await page.goto("/single?q=reading&page=2");
  await expect(page.getByText("Latest stories could not be loaded", { exact: true })).toBeVisible();
  await latest(page).getByRole("button", { name: "Previous", exact: true }).press("Enter");
  await expect(
    latest(page).getByRole("link", { name: "First page article", exact: true })
  ).toBeVisible();
  await expect(page).toHaveURL(/\/single\?q=reading$/);
});
