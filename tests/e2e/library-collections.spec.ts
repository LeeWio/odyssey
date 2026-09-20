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
const date = "2026-09-20T00:00:00Z";
const entry = (id: number, title = `Article ${id}`) => ({
  addedAt: date,
  post: { id, title, slug: `article-${id}`, category: null, views: 0, likesCount: 0 },
});
const result = (list: ReturnType<typeof entry>[], page = 0, total = list.length) => ({
  list,
  page,
  size: 20,
  total,
  totalPages: Math.ceil(total / 20),
});
const collectionFixtures = () =>
  ["Alpha", "Beta"].map((name, i) => ({
    id: i + 1,
    name,
    description: "Reading notes",
    itemCount: 21,
    createdAt: date,
    updatedAt: date,
  }));
const firstPage = Array.from({ length: 20 }, (_, i) => entry(i + 1));
const postsEndpoint = "**/api/v1/user/library/collections/*/posts?**";
const contents = (page: Page, name = "Alpha") =>
  page.getByRole("region", { name: `Articles in ${name}`, exact: true });
const select = (page: Page, name: string) =>
  page.getByRole("button", { name: `View collection: ${name}`, exact: true }).press("Enter");

async function openAlpha(page: Page) {
  await page.goto("/library");
  await select(page, "Alpha");
  await expect(contents(page)).toBeVisible();
}

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "library-test",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    )
  );
  // All library reads and writes are mocked; no real user data is changed.
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown;
    if (path === "/api/v1/user/me") data = { id: 1, username: "reader" };
    else if (path.endsWith("/unread/count")) data = 0;
    else if (path.endsWith("/library/overview"))
      data = { continueReading: [], recentFavorites: [], recommendations: [] };
    else if (path.endsWith("/library/preferences"))
      data = { followedCategories: [], hiddenPostCount: 0 };
    else if (path.endsWith("/library/favorites") || path.endsWith("/library/history"))
      data = result([]);
    else if (path.endsWith("/blog/facets")) data = { categories: [] };
    else if (path.endsWith("/library/collections") && route.request().method() === "GET")
      data = collectionFixtures();
    else return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    await route.fulfill({ json: envelope(data) });
  });
});

test("pagination hides old rows during loading and supports retry and returning from a failed page", async ({
  page,
}) => {
  const pending = Promise.withResolvers<void>();
  let attempts = 0;
  await page.route(postsEndpoint, async (route) => {
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    if (index === 0) return route.fulfill({ json: envelope(result(firstPage, 0, 21)) });
    attempts += 1;
    if (attempts === 1) await pending.promise;
    await route.fulfill(
      attempts <= 2
        ? { status: 503, json: { message: "Unavailable" } }
        : { json: envelope(result([entry(21)], 1, 21)) }
    );
  });
  try {
    await openAlpha(page);
    const region = contents(page);
    await expect(region.getByRole("article")).toHaveCount(20);
    await region.getByRole("button", { name: "Next", exact: true }).press("Enter");
    await expect.poll(() => attempts).toBe(1);
    await expect(region.getByRole("article")).toHaveCount(0);
    await expect(region.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    await expect(region.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await expect(region.getByText("Page 2", { exact: true })).toBeVisible();
    pending.resolve();
    await expect(region.getByText("Collection articles are unavailable")).toBeVisible();
    await region.getByRole("button", { name: "Previous", exact: true }).press("Enter");
    await expect(region.getByRole("article")).toHaveCount(20);
    // Cached rows appear immediately, while navigation waits for the refresh to finish.
    await expect(region.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
    await region.getByRole("button", { name: "Next", exact: true }).press("Enter");
    await expect.poll(() => attempts).toBe(2);
    await region.getByRole("button", { name: "Try again", exact: true }).press("Enter");
    await expect(region.getByRole("link", { name: "Article 21", exact: true })).toBeVisible();
    await expect(region.getByText("Page 2 of 2 · 21 articles", { exact: true })).toBeVisible();
    await expect(region.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    expect(attempts).toBe(3);
  } finally {
    pending.resolve();
  }
});

test("switching collections resets pagination and ignores a late response from the previous collection", async ({
  page,
}) => {
  const pending = Promise.withResolvers<void>();
  const requested: string[] = [];
  await page.route(postsEndpoint, async (route) => {
    const url = new URL(route.request().url());
    const index = Number(url.searchParams.get("page"));
    const alpha = url.pathname.includes("/collections/1/");
    requested.push(`${alpha ? "Alpha" : "Beta"}:${index}`);
    if (alpha && index === 1) await pending.promise;
    await route.fulfill({
      json: envelope(
        alpha
          ? result(index === 0 ? firstPage : [entry(21)], index, 21)
          : result([entry(101, "Beta article")])
      ),
    });
  });
  try {
    await openAlpha(page);
    await contents(page).getByRole("button", { name: "Next", exact: true }).press("Enter");
    await expect.poll(() => requested.includes("Alpha:1")).toBe(true);
    await select(page, "Beta");
    await expect(
      contents(page, "Beta").getByRole("link", { name: "Beta article", exact: true })
    ).toBeVisible();
    const response = page.waitForResponse(
      (r) =>
        r.url().includes("/collections/1/posts?") &&
        new URL(r.url()).searchParams.get("page") === "1"
    );
    pending.resolve();
    await response;
    await expect(contents(page)).toHaveCount(0);
    await expect(contents(page, "Beta").getByRole("article")).toHaveCount(1);
    expect(requested).toContain("Beta:0");
    expect(requested).not.toContain("Beta:1");
    await select(page, "Alpha");
    await expect(
      contents(page).getByText("Page 1 of 2 · 21 articles", { exact: true })
    ).toBeVisible();
    await expect(contents(page).getByRole("link", { name: "Article 21", exact: true })).toHaveCount(
      0
    );
  } finally {
    pending.resolve();
  }
});

test("removing the final item on the last page returns to the updated preceding page", async ({
  page,
}) => {
  let removed = false;
  const requested: number[] = [];
  await page.route(postsEndpoint, async (route) => {
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    requested.push(index);
    await route.fulfill({
      json: envelope(
        result(index === 0 ? firstPage : removed ? [] : [entry(21)], index, removed ? 20 : 21)
      ),
    });
  });
  await page.route("**/api/v1/user/library/collections/1/posts/21", async (route) => {
    expect(route.request().method()).toBe("DELETE");
    removed = true;
    await route.fulfill({ json: envelope(null) });
  });
  await openAlpha(page);
  const region = contents(page);
  await region.getByRole("button", { name: "Next", exact: true }).press("Enter");
  await region
    .getByRole("button", { name: "Remove Article 21 from Alpha", exact: true })
    .press("Enter");
  await expect(region.getByRole("article")).toHaveCount(20);
  await expect(region.getByRole("link", { name: "Article 1", exact: true })).toBeVisible();
  await expect(region.getByRole("link", { name: "Article 21", exact: true })).toHaveCount(0);
  await expect(region.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
  expect(requested).toEqual([0, 1, 1, 0]);
});

test("concurrent removals retain independent locks and failed removals can be retried", async ({
  page,
}) => {
  const first = Promise.withResolvers<void>();
  const second = Promise.withResolvers<void>();
  const removed = new Set<number>();
  const calls: number[] = [];
  await page.route(postsEndpoint, (route) =>
    route.fulfill({
      json: envelope(result([entry(1), entry(2)].filter(({ post }) => !removed.has(post.id)))),
    })
  );
  await page.route("**/api/v1/user/library/collections/1/posts/*", async (route) => {
    const id = Number(new URL(route.request().url()).pathname.split("/").at(-1));
    expect(route.request().method()).toBe("DELETE");
    calls.push(id);
    if (id === 1) await first.promise;
    else await second.promise;
    const fails = id === 2 && calls.filter((value) => value === 2).length === 1;
    if (!fails) removed.add(id);
    await route.fulfill(
      fails ? { status: 503, json: { message: "Removal unavailable" } } : { json: envelope(null) }
    );
  });
  try {
    await openAlpha(page);
    const one = contents(page).getByRole("button", {
      name: "Remove Article 1 from Alpha",
      exact: true,
    });
    const two = contents(page).getByRole("button", {
      name: "Remove Article 2 from Alpha",
      exact: true,
    });
    await one.press("Enter");
    await two.press("Enter");
    await expect.poll(() => calls.length).toBe(2);
    await expect(one).toBeDisabled();
    await expect(two).toBeDisabled();
    await one.press("Enter");
    second.resolve();
    await expect(two).toBeEnabled();
    await expect(one).toBeDisabled();
    await two.press("Enter");
    await expect.poll(() => calls).toEqual([1, 2, 2]);
    first.resolve();
    await expect(
      contents(page).getByText("This collection is empty", { exact: true })
    ).toBeVisible();
    expect(calls.filter((id) => id === 1)).toHaveLength(1);
  } finally {
    first.resolve();
    second.resolve();
  }
});

test("the same article in another collection has its own removal state and endpoint", async ({
  page,
}) => {
  const pending = Promise.withResolvers<void>();
  const calls: string[] = [];
  const removed = new Set<string>();
  await page.route(postsEndpoint, (route) => {
    const id = new URL(route.request().url()).pathname.split("/").at(-2)!;
    return route.fulfill({ json: envelope(result(removed.has(id) ? [] : [entry(1)])) });
  });
  await page.route("**/api/v1/user/library/collections/*/posts/1", async (route) => {
    const id = new URL(route.request().url()).pathname.split("/").at(-3)!;
    expect(route.request().method()).toBe("DELETE");
    calls.push(id);
    if (id === "1") await pending.promise;
    removed.add(id);
    await route.fulfill({ json: envelope(null) });
  });
  try {
    await openAlpha(page);
    await contents(page)
      .getByRole("button", { name: "Remove Article 1 from Alpha", exact: true })
      .press("Enter");
    await expect.poll(() => calls).toEqual(["1"]);
    await select(page, "Beta");
    const remove = contents(page, "Beta").getByRole("button", {
      name: "Remove Article 1 from Beta",
      exact: true,
    });
    await expect(remove).toBeEnabled();
    await remove.press("Enter");
    await expect.poll(() => calls).toEqual(["1", "2"]);
    pending.resolve();
    await expect(
      contents(page, "Beta").getByText("This collection is empty", { exact: true })
    ).toBeVisible();
    await expect(contents(page)).toHaveCount(0);
  } finally {
    pending.resolve();
  }
});

async function manageCollections(page: Page) {
  const state = { collections: collectionFixtures() };
  await page.route("**/api/v1/user/library/collections", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: envelope(state.collections) })
      : route.fallback()
  );
  await page.route(postsEndpoint, (route) => route.fulfill({ json: envelope(result([])) }));
  return state;
}

test("creating a collection validates names, locks submission and dismissal, and preserves failed drafts", async ({
  page,
}) => {
  const state = await manageCollections(page);
  const pending = Promise.withResolvers<void>();
  const bodies: unknown[] = [];
  await page.route("**/api/v1/user/library/collections", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    bodies.push(route.request().postDataJSON());
    if (bodies.length === 1) {
      await pending.promise;
      return route.fulfill({ status: 503, json: { message: "Creation unavailable" } });
    }
    const collection = {
      ...state.collections[0],
      id: 3,
      name: "New notes",
      description: "Essays",
      itemCount: 0,
    };
    state.collections.push(collection);
    await route.fulfill({ json: envelope(collection) });
  });
  try {
    await page.goto("/library");
    await page.getByRole("button", { name: "New collection", exact: true }).press("Enter");
    const dialog = page.getByRole("dialog", { name: "Create collection", exact: true });
    const name = dialog.getByRole("textbox", { name: /Name/ });
    const description = dialog.getByRole("textbox", { name: "Description", exact: true });
    await name.fill("   ");
    await dialog.getByRole("button", { name: "Create collection", exact: true }).press("Enter");
    await expect(dialog.getByText("Enter a collection name.", { exact: true })).toBeVisible();
    expect(bodies).toHaveLength(0);
    await name.fill("  New notes  ");
    await description.fill("  Essays  ");
    await dialog.locator("form").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
      (form as HTMLFormElement).requestSubmit();
    });
    await expect.poll(() => bodies.length).toBe(1);
    await expect(name).not.toBeEditable();
    await expect(description).not.toBeEditable();
    await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeDisabled();
    await expect(
      dialog.getByRole("button", { name: "Create collection", exact: true })
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await page.mouse.click(5, 5);
    await expect(dialog).toBeVisible();
    pending.resolve();
    await expect(dialog.getByRole("alert")).toContainText("Your details are still here");
    await expect(name).toBeEditable();
    await expect(name).toHaveValue("  New notes  ");
    await expect(description).toHaveValue("  Essays  ");
    await dialog.getByRole("button", { name: "Create collection", exact: true }).press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(contents(page, "New notes")).toBeVisible();
    expect(bodies).toEqual([
      { name: "New notes", description: "Essays" },
      { name: "New notes", description: "Essays" },
    ]);
  } finally {
    pending.resolve();
  }
});

test("editing locks the selected collection and retries the retained draft without creating a collection", async ({
  page,
}) => {
  const state = await manageCollections(page);
  const pending = Promise.withResolvers<void>();
  const bodies: unknown[] = [];
  await page.route("**/api/v1/user/library/collections/1", async (route) => {
    expect(route.request().method()).toBe("PUT");
    bodies.push(route.request().postDataJSON());
    if (bodies.length === 1) {
      await pending.promise;
      return route.fulfill({ status: 503, json: { message: "Update unavailable" } });
    }
    state.collections[0] = { ...state.collections[0], name: "Revised Alpha", description: "" };
    await route.fulfill({ json: envelope(state.collections[0]) });
  });
  try {
    await page.goto("/library");
    await page.getByRole("button", { name: "Edit Alpha", exact: true }).press("Enter");
    const dialog = page.getByRole("dialog", { name: "Edit collection", exact: true });
    const name = dialog.getByRole("textbox", { name: /Name/ });
    const description = dialog.getByRole("textbox", { name: "Description", exact: true });
    await expect(name).toHaveValue("Alpha");
    await expect(description).toHaveValue("Reading notes");
    await name.fill("Revised Alpha");
    await description.fill("");
    await dialog.locator("form").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
      (form as HTMLFormElement).requestSubmit();
    });
    await expect.poll(() => bodies.length).toBe(1);
    await expect(name).not.toBeEditable();
    await expect(description).not.toBeEditable();
    await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    pending.resolve();
    await expect(dialog.getByRole("alert")).toContainText("could not be saved");
    await expect(name).toHaveValue("Revised Alpha");
    await expect(description).toHaveValue("");
    await expect(name).toBeEditable();
    await dialog.getByRole("button", { name: "Save changes", exact: true }).press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(contents(page, "Revised Alpha")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "View collection: Beta", exact: true })
    ).toBeVisible();
    expect(bodies).toEqual([{ name: "Revised Alpha" }, { name: "Revised Alpha" }]);
  } finally {
    pending.resolve();
  }
});

test("closing a failed edit resets errors and drafts for subsequent edit and create actions", async ({
  page,
}) => {
  await manageCollections(page);
  await page.route("**/api/v1/user/library/collections/1", (route) =>
    route.fulfill({ status: 503, json: { message: "Update unavailable" } })
  );
  await page.goto("/library");
  await page.getByRole("button", { name: "Edit Alpha", exact: true }).press("Enter");
  const edit = page.getByRole("dialog", { name: "Edit collection", exact: true });
  await edit.getByRole("textbox", { name: /Name/ }).fill("Unfinished Alpha");
  await edit.getByRole("button", { name: "Save changes", exact: true }).press("Enter");
  await expect(edit.getByRole("alert")).toBeVisible();
  await edit.getByRole("button", { name: "Cancel", exact: true }).press("Enter");
  await expect(edit).toHaveCount(0);
  await page.getByRole("button", { name: "Edit Beta", exact: true }).press("Enter");
  await expect(edit.getByRole("textbox", { name: /Name/ })).toHaveValue("Beta");
  await expect(edit.getByRole("alert")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(edit).toHaveCount(0);
  await page.getByRole("button", { name: "New collection", exact: true }).press("Enter");
  const create = page.getByRole("dialog", { name: "Create collection", exact: true });
  await expect(create.getByRole("textbox", { name: /Name/ })).toHaveValue("");
  await expect(create.getByRole("textbox", { name: "Description", exact: true })).toHaveValue("");
  await expect(create.getByRole("alert")).toHaveCount(0);
  await create.getByRole("button", { name: "Close", exact: true }).press("Enter");
  await expect(create).toHaveCount(0);
});

test("deletion blocks repeated actions and dismissal, then allows retry and clears the deleted selection", async ({
  page,
}) => {
  const state = await manageCollections(page);
  const pending = Promise.withResolvers<void>();
  let attempts = 0;
  await page.route("**/api/v1/user/library/collections/1", async (route) => {
    expect(route.request().method()).toBe("DELETE");
    attempts += 1;
    if (attempts === 1) {
      await pending.promise;
      return route.fulfill({ status: 503, json: { message: "Deletion unavailable" } });
    }
    state.collections = state.collections.filter(({ id }) => id !== 1);
    await route.fulfill({ json: envelope(null) });
  });
  try {
    await openAlpha(page);
    await page.getByRole("button", { name: "Delete Alpha", exact: true }).press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Delete collection?", exact: true });
    await expect(dialog).toContainText("Alpha");
    const remove = dialog.getByRole("button", { name: "Delete collection", exact: true });
    await remove.press("Enter");
    await expect.poll(() => attempts).toBe(1);
    await expect(remove).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeDisabled();
    await remove.press("Enter");
    await page.keyboard.press("Escape");
    await page.mouse.click(5, 5);
    await expect(dialog).toBeVisible();
    expect(attempts).toBe(1);
    pending.resolve();
    await expect(dialog.getByRole("alert")).toContainText("could not be deleted");
    await expect(remove).toBeEnabled();
    await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeEnabled();
    await remove.press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(contents(page)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "View collection: Alpha", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "View collection: Beta", exact: true })
    ).toBeVisible();
    expect(attempts).toBe(2);
  } finally {
    pending.resolve();
  }
});

test("cancelled deletion leaves data intact and deleting another collection preserves the current selection", async ({
  page,
}) => {
  const state = await manageCollections(page);
  const deleted: number[] = [];
  await page.route("**/api/v1/user/library/collections/*", async (route) => {
    const id = Number(new URL(route.request().url()).pathname.split("/").at(-1));
    expect(route.request().method()).toBe("DELETE");
    deleted.push(id);
    state.collections = state.collections.filter((collection) => collection.id !== id);
    await route.fulfill({ json: envelope(null) });
  });
  await openAlpha(page);
  await page.getByRole("button", { name: "Delete Alpha", exact: true }).press("Enter");
  const dialog = page.getByRole("alertdialog", { name: "Delete collection?", exact: true });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).press("Enter");
  await expect(dialog).toHaveCount(0);
  expect(deleted).toEqual([]);
  await page.getByRole("button", { name: "Delete Beta", exact: true }).press("Enter");
  await expect(dialog).toContainText("Beta");
  await dialog.getByRole("button", { name: "Delete collection", exact: true }).press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(contents(page)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View collection: Beta", exact: true })
  ).toHaveCount(0);
  expect(deleted).toEqual([2]);
});
