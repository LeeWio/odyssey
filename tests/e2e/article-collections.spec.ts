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
const collectionsEndpoint = "**/api/v1/user/library/collections";
const saveEndpoint = "**/api/v1/user/library/collections/42/posts/123";
const collection = {
  id: 42,
  name: "Reading notes",
  description: "Useful essays",
  itemCount: 0,
  createdAt: "2026-09-20T00:00:00Z",
  updatedAt: "2026-09-20T00:00:00Z",
};

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "article-collection-test",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    )
  );
  // No real collections are created and no articles are saved by these tests.
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/user/me") {
      await route.fulfill({ json: envelope({ id: 1, username: "reader" }) });
    } else if (path.endsWith("/unread/count")) {
      await route.fulfill({ json: envelope(0) });
    } else if (path === "/api/v1/user/library/collections" && route.request().method() === "GET") {
      await route.fulfill({ json: envelope([]) });
    } else if (path === "/api/v1/public/blog/posts/collection-test") {
      await route.fulfill({
        json: envelope({
          id: 123,
          slug: "collection-test",
          title: "Collection test article",
          contentType: "JSON",
          content: JSON.stringify({
            type: "doc",
            content: Array.from({ length: 30 }, (_, i) => ({
              type: "paragraph",
              content: [
                { type: "text", text: `Paragraph ${i + 1}. Notes for the reading collection.` },
              ],
            })),
          }),
          status: "PUBLISHED",
          isFeatured: false,
          views: 0,
          likesCount: 0,
          favoritesCount: 0,
          category: null,
          series: null,
          seriesOrder: null,
          createdAt: "2026-09-20T00:00:00Z",
          updatedAt: "2026-09-20T00:00:00Z",
        }),
      });
    } else {
      await route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    }
  });
});

async function openCreate(page: Page) {
  await page.goto("/single/collection-test");
  await expect(
    page.getByRole("heading", { name: "Collection test article", exact: true })
  ).toBeVisible();
  await expect(page.locator('.ProseMirror[contenteditable="false"]')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.getByRole("button", { name: "More article actions", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Create collection", exact: true }).press("Enter");
  const dialog = page.getByRole("dialog", { name: "Create collection", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: /Name/ }).fill("Reading notes");
  await dialog.getByRole("textbox", { name: "Description", exact: true }).fill("Useful essays");
  return dialog;
}

test("creation and saving stay pending as one operation and block duplicate submits and dismissal", async ({
  page,
}) => {
  const create = Promise.withResolvers<void>();
  const save = Promise.withResolvers<void>();
  let creations = 0;
  let saves = 0;
  await page.route(collectionsEndpoint, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    creations += 1;
    expect(route.request().postDataJSON()).toEqual({
      name: "Reading notes",
      description: "Useful essays",
    });
    await create.promise;
    await route.fulfill({ json: envelope(collection) });
  });
  await page.route(saveEndpoint, async (route) => {
    expect(route.request().method()).toBe("POST");
    saves += 1;
    await save.promise;
    await route.fulfill({ json: envelope(null) });
  });
  try {
    const dialog = await openCreate(page);
    // Two submit events in the same task exercise the synchronous guard before render.
    await dialog.locator("form").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
      (form as HTMLFormElement).requestSubmit();
    });
    await expect.poll(() => creations).toBe(1);
    await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("textbox", { name: /Name/ })).not.toBeEditable();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    create.resolve();
    await expect.poll(() => saves).toBe(1);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("status")).toHaveText("Saving article…");
    await expect(
      dialog.getByRole("button", { name: "Saving article…", exact: true })
    ).toHaveAttribute("data-pending", "true");
    await dialog.locator("form").evaluate((form) => (form as HTMLFormElement).requestSubmit());
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    save.resolve();
    await expect(dialog).toHaveCount(0);
    expect(creations).toBe(1);
    expect(saves).toBe(1);
  } finally {
    create.resolve();
    save.resolve();
  }
});

test("a failed save retries the existing collection without creating a duplicate", async ({
  page,
}) => {
  let creations = 0;
  let saves = 0;
  await page.route(collectionsEndpoint, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    creations += 1;
    await route.fulfill({ json: envelope(collection) });
  });
  await page.route(saveEndpoint, async (route) => {
    saves += 1;
    await route.fulfill(
      saves === 1
        ? { status: 503, json: { message: "Save temporarily unavailable" } }
        : { json: envelope(null) }
    );
  });
  const dialog = await openCreate(page);
  await dialog.getByRole("button", { name: "Create and save", exact: true }).press("Enter");
  await expect(dialog.getByRole("alert")).toContainText(
    "was created, but the article could not be saved"
  );
  await expect(dialog.getByRole("textbox", { name: /Name/ })).toHaveValue("Reading notes");
  await expect(dialog.getByRole("textbox", { name: /Name/ })).not.toBeEditable();
  await expect(dialog.getByRole("button", { name: "Close", exact: true }).first()).toBeEnabled();
  await dialog.getByRole("button", { name: "Retry saving article", exact: true }).press("Enter");
  await expect(dialog).toHaveCount(0);
  expect(creations).toBe(1);
  expect(saves).toBe(2);
});

test("creation failure preserves editable details and retry completes both steps", async ({
  page,
}) => {
  let creations = 0;
  let saves = 0;
  await page.route(collectionsEndpoint, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    creations += 1;
    await route.fulfill(
      creations === 1
        ? { status: 503, json: { message: "Creation temporarily unavailable" } }
        : { json: envelope({ ...collection, name: "Updated notes" }) }
    );
  });
  await page.route(saveEndpoint, async (route) => {
    saves += 1;
    await route.fulfill({ json: envelope(null) });
  });
  const dialog = await openCreate(page);
  const name = dialog.getByRole("textbox", { name: /Name/ });
  await name.fill("   ");
  await dialog.getByRole("button", { name: "Create and save", exact: true }).press("Enter");
  await expect(dialog.getByText("Enter a collection name.", { exact: true })).toBeVisible();
  expect(creations).toBe(0);
  await name.fill("Reading notes");
  await dialog.getByRole("button", { name: "Create and save", exact: true }).press("Enter");
  await expect(dialog.getByRole("alert")).toContainText("The collection could not be created");
  await expect(name).toHaveValue("Reading notes");
  await expect(name).toBeEditable();
  await expect(dialog.getByRole("textbox", { name: "Description", exact: true })).toHaveValue(
    "Useful essays"
  );
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeEnabled();
  expect(saves).toBe(0);
  await name.fill("Updated notes");
  await dialog.getByRole("button", { name: "Create and save", exact: true }).press("Enter");
  await expect(dialog).toHaveCount(0);
  expect(creations).toBe(2);
  expect(saves).toBe(1);
});
