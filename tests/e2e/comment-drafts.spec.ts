import { expect, test as base } from "@playwright/test";

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors, "The persisted session must hydrate without browser errors").toEqual([]);
    },
    { auto: true },
  ],
});

const draftKey = "odyssey:comment-draft:guestbook:root";
const envelope = (data: unknown) => ({ code: 200, message: "OK", data });

test.use({ locale: "en-US" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "comment-draft-test",
        refreshToken: "comment-draft-test-refresh",
        username: "draft-tester",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    );
  });
  // Keep browser tests independent of backend availability and prevent writes.
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/user/me") {
      await route.fulfill({ json: envelope({ id: 1, username: "draft-tester" }) });
    } else if (path.endsWith("/new-count") || path.endsWith("/unread/count")) {
      await route.fulfill({ json: envelope(0) });
    } else if (route.request().method() !== "GET") {
      await route.fulfill({ status: 503, json: { message: "Unmocked write" } });
    } else {
      await route.fulfill({
        json: envelope({
          list: [],
          total: 0,
          nextCursor: null,
          hasMore: false,
          page: 0,
          size: 20,
          totalPages: 0,
        }),
      });
    }
  });
  await page.goto("/guestbook");
  await expect(page.getByRole("textbox", { name: "Add a comment" })).toBeVisible();
});

test("restores an unfinished comment after reloading", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "Add a comment" });
  await input.fill("Keep my unfinished thought");
  await page.reload();
  await expect(input).toHaveValue("Keep my unfinished thought");
});

test("preserves edits made while a comment is being submitted", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  await page.route("**/api/v1/public/guestbook", async (route) => {
    await response.promise;
    await route.fulfill({ json: envelope({ id: 101, status: "PENDING" }) });
  });
  try {
    const input = page.getByRole("textbox", { name: "Add a comment" });
    await input.fill("First comment");
    const submitted = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        new URL(request.url()).pathname === "/api/v1/public/guestbook"
    );
    await page.getByRole("button", { name: "Send comment" }).click();
    expect((await submitted).postDataJSON()).toEqual({ content: "First comment" });
    await input.fill("A second thought written while waiting");
    response.resolve();
    await expect(page.getByRole("button", { name: "Send comment" })).toBeEnabled();
    await expect(input).toHaveValue("A second thought written while waiting");
    expect(await page.evaluate((key) => localStorage.getItem(key), draftKey)).toBe(
      "A second thought written while waiting"
    );
    await page.reload();
    await expect(input).toHaveValue("A second thought written while waiting");
  } finally {
    response.resolve();
  }
});

test("clears only the successfully submitted draft", async ({ page }) => {
  await page.route("**/api/v1/public/guestbook", async (route) => {
    await route.fulfill({ json: envelope({ id: 102, status: "PENDING" }) });
  });
  const input = page.getByRole("textbox", { name: "Add a comment" });
  await input.fill("  Ready to publish  ");
  await page.getByRole("button", { name: "Send comment" }).click();
  await expect(input).toHaveValue("");
  expect(await page.evaluate((key) => localStorage.getItem(key), draftKey)).toBeNull();
  await page.reload();
  await expect(input).toHaveValue("");
});

test("keeps the draft editable when publishing fails", async ({ page }) => {
  await page.route("**/api/v1/public/guestbook", async (route) => {
    await route.fulfill({ status: 503, json: { message: "Please try again" } });
  });
  const input = page.getByRole("textbox", { name: "Add a comment" });
  await input.fill("Do not lose this comment");
  await page.getByRole("button", { name: "Send comment" }).click();
  await expect(page.getByText("Please try again", { exact: true })).toBeVisible();
  await expect(input).toHaveValue("Do not lose this comment");
  await expect(page.getByRole("button", { name: "Send comment" })).toBeEnabled();
  await input.fill("Updated after the failed attempt");
  await page.reload();
  await expect(input).toHaveValue("Updated after the failed attempt");
});
