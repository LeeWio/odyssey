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
const comment = (id: number, fields: Record<string, unknown> = {}) => ({
  id,
  content: `Comment ${id}`,
  username: "author",
  authorUserId: 1,
  viewerCanEdit: true,
  viewerCanDelete: true,
  createdAt: "2026-09-01T10:00:00Z",
  ...fields,
});
const pageResult = (list: unknown[], cursor: number | null = null) =>
  envelope({
    list,
    total: 2,
    nextCursor: cursor,
    hasMore: cursor !== null,
  });

async function openDelete(page: Page, id: number) {
  await page
    .locator(`#comment-${id}`)
    .getByRole("button", { name: "More comment actions" })
    .press("Enter");
  await page.getByRole("menuitem", { name: "Delete", exact: true }).press("Enter");
  const dialog = page.getByRole("alertdialog", { name: "Delete comment" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.use({ locale: "en-US" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "deletion-test",
        username: "author",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    );
  });
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/user/me") {
      await route.fulfill({ json: envelope({ id: 1, username: "author" }) });
    } else if (url.pathname.endsWith("/new-count") || url.pathname.endsWith("/unread/count")) {
      await route.fulfill({ json: envelope(0) });
    } else if (url.pathname === "/api/v1/public/guestbook/roots/cursor") {
      await route.fulfill({
        json: url.searchParams.has("cursor")
          ? pageResult([comment(90)])
          : pageResult([comment(100)], 95),
      });
    } else {
      await route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    }
  });
  await page.goto("/guestbook");
  await expect(page.getByText("Comment 100", { exact: true })).toBeVisible();
});

test("removes a deleted comment from an accumulated page without dropping the first page", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Load more", exact: true }).press("Enter");
  await expect(page.getByText("Comment 90", { exact: true })).toBeVisible();
  let deleted = false;
  await page.route("**/api/v1/user/comments/90", async (route) => {
    expect(route.request().method()).toBe("DELETE");
    deleted = true;
    await route.fulfill({ status: 204 });
  });
  await page.route("**/api/v1/public/guestbook/roots/cursor?**", async (route) => {
    const cursor = new URL(route.request().url()).searchParams.has("cursor");
    await route.fulfill({
      json: cursor ? pageResult(deleted ? [] : [comment(90)]) : pageResult([comment(100)], 95),
    });
  });
  const dialog = await openDelete(page, 90);
  await dialog.getByRole("button", { name: "Delete", exact: true }).press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#comment-90")).toHaveCount(0);
  await expect(page.getByText("Comment 100", { exact: true })).toBeVisible();
});

test("retains a deleted reply placeholder and its subsequent reply", async ({ page }) => {
  let deleted = false;
  await page.route("**/api/v1/public/guestbook/roots/cursor?**", async (route) => {
    await route.fulfill({ json: pageResult([comment(100, { replyCount: 1 })]) });
  });
  await page.route("**/api/v1/public/comments/100/replies/cursor?**", async (route) => {
    await route.fulfill({
      json: pageResult([
        comment(101, {
          parentId: 100,
          replyCount: 1,
          content: deleted ? "[deleted]" : "Reply to delete",
          deletedPlaceholder: deleted,
        }),
        comment(102, { parentId: 101, content: "Conversation to preserve" }),
      ]),
    });
  });
  await page.route("**/api/v1/user/comments/101", async (route) => {
    deleted = true;
    await route.fulfill({ status: 204 });
  });
  await page.reload();
  await page.getByRole("button", { name: "Show 1 reply", exact: true }).press("Enter");
  await expect(page.getByText("Conversation to preserve", { exact: true })).toBeVisible();
  const dialog = await openDelete(page, 101);
  await dialog.getByRole("button", { name: "Delete", exact: true }).press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#comment-101")).toContainText("This comment was deleted.");
  await expect(
    page.locator("#comment-101").getByRole("group", { name: "Comment actions" })
  ).toHaveCount(0);
  await expect(page.getByText("Reply to delete", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Conversation to preserve", { exact: true })).toBeVisible();
});

test("removes a newly submitted pending comment from the local list", async ({ page }) => {
  await page.route("**/api/v1/public/guestbook", async (route) => {
    await route.fulfill({ json: envelope({ id: 200, status: "PENDING" }) });
  });
  await page.route("**/api/v1/user/comments/200", async (route) => {
    await route.fulfill({ status: 204 });
  });
  await page.getByRole("textbox", { name: "Add a comment" }).fill("Pending contribution");
  await page.getByRole("button", { name: "Send comment" }).press("Enter");
  await expect(page.locator("#comment-200")).toContainText("Awaiting review");
  const dialog = await openDelete(page, 200);
  await dialog.getByRole("button", { name: "Delete", exact: true }).press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Pending contribution", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Comment 100", { exact: true })).toBeVisible();
});

test("keeps a failed deletion available for retry and removes the row after success", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Load more", exact: true }).press("Enter");
  await expect(page.locator("#comment-90")).toBeVisible();
  let attempts = 0;
  await page.route("**/api/v1/user/comments/90", async (route) => {
    attempts += 1;
    await route.fulfill(
      attempts === 1
        ? { status: 503, json: { message: "Delete temporarily unavailable" } }
        : { status: 204 }
    );
  });
  await page.route("**/api/v1/public/guestbook/roots/cursor?**", async (route) => {
    await route.fulfill({ json: pageResult([comment(100)]) });
  });
  const dialog = await openDelete(page, 90);
  const confirm = dialog.getByRole("button", { name: "Delete", exact: true });
  await confirm.press("Enter");
  await expect(page.getByText("Delete temporarily unavailable", { exact: true })).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(page.locator("#comment-90")).toContainText("Comment 90");
  await expect(confirm).toBeEnabled();
  await confirm.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#comment-90")).toHaveCount(0);
  expect(attempts).toBe(2);
});

test("keeps deletion confirmation open while the request is pending", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  let attempts = 0;
  await page.route("**/api/v1/user/comments/100", async (route) => {
    attempts += 1;
    await response.promise;
    await route.fulfill({ status: 204 });
  });
  await page.route("**/api/v1/public/guestbook/roots/cursor?**", async (route) => {
    await route.fulfill({ json: pageResult([]) });
  });
  try {
    const dialog = await openDelete(page, 100);
    const confirm = dialog.getByRole("button", { name: "Delete", exact: true });
    await confirm.press("Enter");
    await expect.poll(() => attempts).toBe(1);
    await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeDisabled();
    await expect(confirm).toBeDisabled();
    await expect(confirm).toHaveAttribute("data-pending", "true");
    await expect(dialog.getByRole("status")).toHaveText("Deleting comment…");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    // Repeated activation must not send another request while the first is in flight.
    await page.keyboard.press("Enter");
    response.resolve();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("#comment-100")).toHaveCount(0);
    expect(attempts).toBe(1);
  } finally {
    response.resolve();
  }
});

test("restores dismissal after a delayed deletion fails", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  let attempts = 0;
  await page.route("**/api/v1/user/comments/100", async (route) => {
    attempts += 1;
    await response.promise;
    await route.fulfill({ status: 503, json: { message: "Deletion delayed and failed" } });
  });
  try {
    const dialog = await openDelete(page, 100);
    await dialog.getByRole("button", { name: "Delete", exact: true }).press("Enter");
    await expect.poll(() => attempts).toBe(1);
    const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
    await expect(cancel).toBeDisabled();
    response.resolve();
    await expect(page.getByText("Deletion delayed and failed", { exact: true })).toBeVisible();
    await expect(cancel).toBeEnabled();
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeEnabled();
    await expect(dialog.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
    await expect(dialog.getByRole("status")).toHaveCount(0);
    await cancel.press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("#comment-100")).toContainText("Comment 100");
    await openDelete(page, 100);
    await dialog.getByRole("button", { name: "Close", exact: true }).press("Enter");
    await expect(dialog).toHaveCount(0);
    expect(attempts).toBe(1);
  } finally {
    response.resolve();
  }
});

test("can cancel or close before confirming without sending a delete request", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/v1/user/comments/100", async (route) => {
    attempts += 1;
    await route.fulfill({ status: 204 });
  });
  const dialog = await openDelete(page, 100);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).press("Enter");
  await expect(dialog).toHaveCount(0);
  await openDelete(page, 100);
  await dialog.getByRole("button", { name: "Close", exact: true }).press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#comment-100")).toContainText("Comment 100");
  expect(attempts).toBe(0);
});
