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
const entry = (id: number) => ({
  post: {
    id,
    title: `History ${id}`,
    slug: `history-${id}`,
    category: null,
    views: 0,
    likesCount: 0,
  },
  progressPercent: 50,
  positionAnchor: "#chapter-one",
  lastReadAt: "2026-09-20T00:00:00Z",
});
const result = (list: ReturnType<typeof entry>[], page = 0, total = list.length) => ({
  list,
  page,
  size: 10,
  total,
  totalPages: Math.ceil(total / 10),
});
const firstPage = Array.from({ length: 10 }, (_, i) => entry(i + 1));
const endpoint = "**/api/v1/user/library/history?**";
const region = (page: Page) => page.getByRole("region", { name: "Reading history", exact: true });
const confirm = (page: Page) =>
  page.getByRole("alertdialog", { name: "Clear reading history?", exact: true });
const remove = (page: Page, id: number) =>
  region(page).getByRole("button", {
    name: `Remove History ${id} from reading history`,
    exact: true,
  });

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "history-test",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    )
  );
  // Intercept every API request, including deletes, to preserve real user data.
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown;
    if (path === "/api/v1/user/me") data = { id: 1, username: "reader" };
    else if (path.endsWith("/unread/count")) data = 0;
    else if (path.endsWith("/library/overview"))
      data = { continueReading: [], recentFavorites: [], recommendations: [] };
    else if (path.endsWith("/library/preferences"))
      data = { followedCategories: [], hiddenPostCount: 0 };
    else if (path.endsWith("/library/favorites")) data = result([]);
    else if (path.endsWith("/blog/facets")) data = { categories: [] };
    else if (path.endsWith("/library/collections")) data = [];
    else return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    await route.fulfill({ json: envelope(data) });
  });
});

test("page changes hide previous rows and totals, retain a way back on failure, and retry successfully", async ({
  page,
}) => {
  const pending = Promise.withResolvers<void>();
  let attempts = 0;
  await page.route(endpoint, async (route) => {
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    if (!index) return route.fulfill({ json: envelope(result(firstPage, 0, 11)) });
    attempts += 1;
    if (attempts === 1) await pending.promise;
    await route.fulfill(
      attempts <= 2
        ? { status: 503, json: { message: "Unavailable" } }
        : { json: envelope(result([entry(11)], 1, 11)) }
    );
  });
  try {
    await page.goto("/library");
    const history = region(page);
    await expect(history.getByRole("article")).toHaveCount(10);
    await expect(history.getByRole("link", { name: "History 1", exact: true })).toHaveAttribute(
      "href",
      "/single/history-1#chapter-one"
    );
    await history.getByRole("button", { name: "Next", exact: true }).press("Enter");
    await expect.poll(() => attempts).toBe(1);
    await expect(history.getByRole("article")).toHaveCount(0);
    await expect(history.getByText("11 articles visited", { exact: true })).toHaveCount(0);
    await expect(history.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    await expect(history.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    pending.resolve();
    await expect(
      history.getByText("Reading history is unavailable", { exact: true })
    ).toBeVisible();
    await history.getByRole("button", { name: "Previous", exact: true }).press("Enter");
    await expect(history.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
    await history.getByRole("button", { name: "Next", exact: true }).press("Enter");
    await expect.poll(() => attempts).toBe(2);
    await history.getByRole("button", { name: "Try again", exact: true }).press("Enter");
    await expect(history.getByRole("link", { name: "History 11", exact: true })).toBeVisible();
    await expect(history.getByText("Page 2 of 2", { exact: true })).toBeVisible();
    expect(attempts).toBe(3);
  } finally {
    pending.resolve();
  }
});

test("removing the last record on a final page returns to a refreshed valid page", async ({
  page,
}) => {
  let removed = false;
  const reads: number[] = [];
  await page.route(endpoint, async (route) => {
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    reads.push(index);
    await route.fulfill({
      json: envelope(
        result(index === 0 ? firstPage : removed ? [] : [entry(11)], index, removed ? 10 : 11)
      ),
    });
  });
  await page.route("**/api/v1/user/library/history/11", async (route) => {
    expect(route.request().method()).toBe("DELETE");
    removed = true;
    await route.fulfill({ json: envelope(null) });
  });
  await page.goto("/library");
  await region(page).getByRole("button", { name: "Next", exact: true }).press("Enter");
  await remove(page, 11).press("Enter");
  await expect(region(page).getByRole("article")).toHaveCount(10);
  await expect(region(page).getByText("10 articles visited", { exact: true })).toBeVisible();
  await expect(region(page).getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
  expect(reads).toEqual([0, 1, 1, 0]);
});

test("concurrent removals keep independent locks and block clearing until all requests settle", async ({
  page,
}) => {
  const first = Promise.withResolvers<void>();
  const second = Promise.withResolvers<void>();
  const deleted = new Set<number>();
  const calls: number[] = [];
  await page.route(endpoint, (route) =>
    route.fulfill({
      json: envelope(
        result([entry(1), entry(2), entry(3)].filter(({ post }) => !deleted.has(post.id)))
      ),
    })
  );
  await page.route("**/api/v1/user/library/history/*", async (route) => {
    const id = Number(new URL(route.request().url()).pathname.split("/").at(-1));
    expect(route.request().method()).toBe("DELETE");
    calls.push(id);
    await (id === 1 ? first.promise : second.promise);
    const fails = id === 2 && calls.filter((value) => value === 2).length === 1;
    if (!fails) deleted.add(id);
    await route.fulfill(
      fails ? { status: 503, json: { message: "Removal unavailable" } } : { json: envelope(null) }
    );
  });
  try {
    await page.goto("/library");
    await remove(page, 1).press("Enter");
    await remove(page, 2).press("Enter");
    await expect.poll(() => calls).toEqual([1, 2]);
    await expect(remove(page, 1)).toBeDisabled();
    await expect(remove(page, 2)).toBeDisabled();
    await expect(
      region(page).getByRole("button", { name: "Clear history", exact: true })
    ).toBeDisabled();
    await remove(page, 1).press("Enter");
    second.resolve();
    await expect(remove(page, 2)).toBeEnabled();
    await expect(remove(page, 1)).toBeDisabled();
    await remove(page, 2).press("Enter");
    await expect.poll(() => calls).toEqual([1, 2, 2]);
    first.resolve();
    await expect(region(page).getByRole("article")).toHaveCount(1);
    await expect(
      region(page).getByRole("button", { name: "Clear history", exact: true })
    ).toBeEnabled();
    expect(calls.filter((id) => id === 1)).toHaveLength(1);
  } finally {
    first.resolve();
    second.resolve();
  }
});

test("clearing locks dismissal and duplicate requests, retries failure, and resets later pages and overview", async ({
  page,
}) => {
  const pending = Promise.withResolvers<void>();
  let cleared = false;
  let attempts = 0;
  let overviewReads = 0;
  await page.route("**/api/v1/user/library/overview", (route) => {
    overviewReads += 1;
    return route.fulfill({
      json: envelope({
        continueReading: cleared ? [] : [entry(1)],
        recentFavorites: [],
        recommendations: [],
      }),
    });
  });
  await page.route(endpoint, (route) => {
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    return route.fulfill({
      json: envelope(
        result(cleared ? [] : index === 0 ? firstPage : [entry(11)], index, cleared ? 0 : 11)
      ),
    });
  });
  await page.route("**/api/v1/user/library/history", async (route) => {
    expect(route.request().method()).toBe("DELETE");
    attempts += 1;
    if (attempts === 1) {
      await pending.promise;
      return route.fulfill({ status: 503, json: { message: "Clear unavailable" } });
    }
    cleared = true;
    await route.fulfill({ json: envelope(null) });
  });
  try {
    await page.goto("/library");
    await region(page).getByRole("button", { name: "Next", exact: true }).press("Enter");
    await region(page).getByRole("button", { name: "Clear history", exact: true }).press("Enter");
    const dialog = confirm(page);
    const clear = dialog.getByRole("button", { name: "Clear history", exact: true });
    await clear.press("Enter");
    await expect.poll(() => attempts).toBe(1);
    await expect(clear).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeDisabled();
    await expect(
      page.locator('button[aria-label="Remove History 11 from reading history"]')
    ).toBeDisabled();
    await clear.press("Enter");
    await page.keyboard.press("Escape");
    await page.mouse.click(5, 5);
    await expect(dialog).toBeVisible();
    expect(attempts).toBe(1);
    pending.resolve();
    await expect(dialog.getByRole("alert")).toContainText("could not be cleared");
    await expect(clear).toBeEnabled();
    await clear.press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(region(page).getByText("No reading history yet", { exact: true })).toBeVisible();
    await expect(region(page).getByText("0 articles visited", { exact: true })).toBeVisible();
    await expect(region(page).getByRole("button", { name: "Previous", exact: true })).toHaveCount(
      0
    );
    await expect(
      page
        .getByRole("region", { name: "Continue reading", exact: true })
        .getByText("Nothing in progress", { exact: true })
    ).toBeVisible();
    expect(attempts).toBe(2);
    expect(overviewReads).toBeGreaterThan(1);
  } finally {
    pending.resolve();
  }
});

test("cancelling clear sends no request and reopening after failure resets its error", async ({
  page,
}) => {
  let attempts = 0;
  await page.route(endpoint, (route) => route.fulfill({ json: envelope(result([entry(1)])) }));
  await page.route("**/api/v1/user/library/history", async (route) => {
    attempts += 1;
    await route.fulfill({ status: 503, json: { message: "Clear unavailable" } });
  });
  await page.goto("/library");
  await region(page).getByRole("button", { name: "Clear history", exact: true }).press("Enter");
  await confirm(page).getByRole("button", { name: "Cancel", exact: true }).press("Enter");
  await expect(confirm(page)).toHaveCount(0);
  expect(attempts).toBe(0);
  await region(page).getByRole("button", { name: "Clear history", exact: true }).press("Enter");
  await confirm(page).getByRole("button", { name: "Clear history", exact: true }).press("Enter");
  await expect(confirm(page).getByRole("alert")).toBeVisible();
  await expect(
    confirm(page).getByRole("button", { name: "Clear history", exact: true })
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(confirm(page)).toHaveCount(0);
  await expect(
    region(page).getByRole("button", { name: "Clear history", exact: true })
  ).toBeEnabled();
  await region(page).getByRole("button", { name: "Clear history", exact: true }).press("Enter");
  await expect(confirm(page).getByRole("alert")).toHaveCount(0);
  await confirm(page).getByRole("button", { name: "Cancel", exact: true }).press("Enter");
  await expect(region(page).getByRole("article")).toHaveCount(1);
  expect(attempts).toBe(1);
});
