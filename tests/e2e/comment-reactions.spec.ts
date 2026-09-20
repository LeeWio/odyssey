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

test.use({ locale: "en-US" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("reaction-test-guest")) return;
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "reaction-test",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    );
  });
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/user/me") {
      await route.fulfill({ json: envelope({ id: 1, username: "reader" }) });
    } else if (path.endsWith("/new-count") || path.endsWith("/unread/count")) {
      await route.fulfill({ json: envelope(0) });
    } else if (path === "/api/v1/public/guestbook/roots/cursor") {
      await route.fulfill({
        json: envelope({
          list: [100, 101].map((id) => ({
            id,
            content: `Discussion ${id}`,
            username: "author",
            likesCount: 4,
            likedByCurrentUser: false,
            createdAt: "2026-09-01T10:00:00Z",
          })),
          total: 2,
          nextCursor: null,
          hasMore: false,
        }),
      });
    } else {
      await route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    }
  });
  await page.goto("/guestbook");
  await expect(page.getByText("Discussion 100", { exact: true })).toBeVisible();
});

test("locks only the pending reaction and uses the server count when it completes", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  const requests: string[] = [];
  await page.route("**/api/v1/public/interactions/comments/*/*", async (route) => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    const id = path.includes("/100/") ? 100 : 101;
    if (id === 100 && path.endsWith("/like")) await response.promise;
    await route.fulfill({
      json: envelope({ commentId: id, liked: path.endsWith("/like"), likesCount: 12 }),
    });
  });
  try {
    const first = page.locator("#comment-100");
    const second = page.locator("#comment-101");
    await first.getByRole("button", { name: "Like comment", exact: true }).press("Enter");
    const pending = first.getByRole("button", { name: "Unlike comment", exact: true });
    await expect(pending).toBeDisabled();
    await expect(pending).toHaveAttribute("aria-pressed", "true");
    await expect(pending).toHaveAttribute("data-pending", "true");
    await expect(pending).toHaveText("5");
    await pending.press("Enter");
    await second.getByRole("button", { name: "Like comment", exact: true }).press("Enter");
    await expect(second.getByRole("button", { name: "Unlike comment", exact: true })).toBeEnabled();
    await expect(second.getByRole("button", { name: "Unlike comment", exact: true })).toHaveText(
      "12"
    );
    await expect(pending).toBeDisabled();
    expect(requests).toHaveLength(2);
    response.resolve();
    await expect(pending).toBeEnabled();
    await expect(pending).not.toHaveAttribute("data-pending", "true");
    await expect(pending).toHaveText("12");
    expect(requests.filter((path) => path.includes("/100/"))).toEqual([
      "/api/v1/public/interactions/comments/100/like",
    ]);
  } finally {
    response.resolve();
  }
});

test("restores the previous count after a failed like and permits retry", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  let attempts = 0;
  await page.route("**/api/v1/public/interactions/comments/100/like", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await response.promise;
      await route.fulfill({ status: 503, json: { message: "Offline" } });
    } else {
      await route.fulfill({ json: envelope({ commentId: 100, liked: true, likesCount: 7 }) });
    }
  });
  try {
    const card = page.locator("#comment-100");
    const like = card.getByRole("button", { name: "Like comment", exact: true });
    await like.press("Enter");
    await expect(card.getByRole("button", { name: "Unlike comment", exact: true })).toHaveText("5");
    response.resolve();
    await expect(
      page.getByText("Couldn't update comment reaction.", { exact: true })
    ).toBeVisible();
    await expect(like).toBeEnabled();
    await expect(like).toHaveText("4");
    await expect(like).toHaveAttribute("aria-pressed", "false");
    await like.press("Enter");
    await expect(card.getByRole("button", { name: "Unlike comment", exact: true })).toHaveText("7");
    expect(attempts).toBe(2);
  } finally {
    response.resolve();
  }
});

test("restores a liked comment after a failed unlike", async ({ page }) => {
  await page.route("**/api/v1/public/interactions/comments/100/like", async (route) => {
    await route.fulfill({ json: envelope({ commentId: 100, liked: true, likesCount: 8 }) });
  });
  const response = Promise.withResolvers<void>();
  await page.route("**/api/v1/public/interactions/comments/100/unlike", async (route) => {
    await response.promise;
    await route.fulfill({ status: 503, json: { message: "Offline" } });
  });
  try {
    const card = page.locator("#comment-100");
    await card.getByRole("button", { name: "Like comment", exact: true }).press("Enter");
    const unlike = card.getByRole("button", { name: "Unlike comment", exact: true });
    await expect(unlike).toBeEnabled();
    await expect(unlike).toHaveText("8");
    await unlike.press("Enter");
    const pending = card.getByRole("button", { name: "Like comment", exact: true });
    await expect(pending).toBeDisabled();
    await expect(pending).toHaveText("7");
    response.resolve();
    await expect(unlike).toBeEnabled();
    await expect(unlike).toHaveText("8");
    await expect(unlike).toHaveAttribute("aria-pressed", "true");
  } finally {
    response.resolve();
  }
});

test("opens login for a guest without changing the reaction or sending a write", async ({
  page,
}) => {
  await page.evaluate(() => {
    sessionStorage.removeItem("odyssey_auth");
    sessionStorage.setItem("reaction-test-guest", "1");
  });
  let writes = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/interactions/comments/"))
      writes += 1;
  });
  await page.reload();
  const like = page
    .locator("#comment-100")
    .getByRole("button", { name: "Like comment", exact: true });
  // Wait for the reloaded comment to be visible, stable, and receive events.
  await like.click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Log In" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(like).toHaveText("4");
  await expect(like).toHaveAttribute("aria-pressed", "false");
  expect(writes).toBe(0);
});
