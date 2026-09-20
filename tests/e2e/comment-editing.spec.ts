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
const original = "Original comment";

async function openEditor(page: Page, id = 100) {
  await page
    .locator(`#comment-${id}`)
    .getByRole("button", { name: "More comment actions" })
    .press("Enter");
  await page.getByRole("menuitem", { name: "Edit", exact: true }).press("Enter");
  return page.getByRole("textbox", { name: "Edit comment" });
}

test.use({ locale: "en-US" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "editing-test",
        username: "editor",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    );
  });
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/user/me") {
      await route.fulfill({ json: envelope({ id: 1, username: "editor" }) });
    } else if (path.endsWith("/new-count") || path.endsWith("/unread/count")) {
      await route.fulfill({ json: envelope(0) });
    } else if (path === "/api/v1/public/guestbook/roots/cursor") {
      await route.fulfill({
        json: envelope({
          list: [
            {
              id: 100,
              content: original,
              username: "editor",
              authorUserId: 1,
              viewerCanEdit: true,
              viewerCanDelete: true,
              createdAt: "2026-09-01T10:00:00Z",
            },
          ],
          total: 1,
          nextCursor: null,
          hasMore: false,
        }),
      });
    } else {
      await route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    }
  });
  await page.goto("/guestbook");
  await expect(page.getByText(original, { exact: true })).toBeVisible();
});

test("keeps saved edits in accumulated pages when the editor is reopened", async ({ page }) => {
  let content = "Older comment";
  await page.route("**/api/v1/public/guestbook/roots/cursor?**", async (route) => {
    const older = new URL(route.request().url()).searchParams.has("cursor");
    await route.fulfill({
      json: envelope({
        list: [
          {
            id: older ? 90 : 100,
            content: older ? content : original,
            username: "editor",
            authorUserId: 1,
            viewerCanEdit: true,
            createdAt: "2026-09-01T10:00:00Z",
          },
        ],
        total: 2,
        nextCursor: older ? null : 95,
        hasMore: !older,
      }),
    });
  });
  await page.route("**/api/v1/user/comments/90", async (route) => {
    expect(route.request().method()).toBe("PUT");
    content = route.request().postDataJSON().content;
    await route.fulfill({ status: 204 });
  });
  await page.reload();
  await page.getByRole("button", { name: "Load more", exact: true }).press("Enter");
  const editor = await openEditor(page, 90);
  await editor.fill("Updated older comment");
  const card = page.locator("#comment-90");
  await card.getByRole("button", { name: "Save", exact: true }).press("Enter");
  await expect(editor).toHaveCount(0);
  await expect(card).toContainText("Updated older comment");
  await expect(page.locator("#comment-100")).toContainText(original);
  await openEditor(page, 90);
  await expect(editor).toHaveValue("Updated older comment");
});

test("keeps saved edits in newly submitted pending comments", async ({ page }) => {
  await page.route("**/api/v1/public/guestbook", async (route) => {
    await route.fulfill({ json: envelope({ id: 200, status: "PENDING" }) });
  });
  await page.route("**/api/v1/user/comments/200", async (route) => {
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toEqual({ content: "Corrected contribution" });
    await route.fulfill({ status: 204 });
  });
  await page.getByRole("textbox", { name: "Add a comment" }).fill("Pending contribution");
  await page.getByRole("button", { name: "Send comment" }).press("Enter");
  const card = page.locator("#comment-200");
  await expect(card).toContainText("Awaiting review");
  const editor = await openEditor(page, 200);
  await editor.fill("Corrected contribution");
  await card.getByRole("button", { name: "Save", exact: true }).press("Enter");
  await expect(editor).toHaveCount(0);
  await expect(card).toContainText("Corrected contribution");
  await expect(card).toContainText("Awaiting review");
  await openEditor(page, 200);
  await expect(editor).toHaveValue("Corrected contribution");
});

test("starts a fresh edit from the current comment after cancelling", async ({ page }) => {
  const editor = await openEditor(page);
  await expect(editor).toHaveValue(original);
  await editor.fill("Discard these changes");
  await page.locator("#comment-100").getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await openEditor(page);
  await expect(editor).toHaveValue(original);
});

test("locks the editor while saving and preserves the draft when saving fails", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  let attempts = 0;
  await page.route("**/api/v1/user/comments/100", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await response.promise;
      await route.fulfill({ status: 503, json: { message: "Edit temporarily unavailable" } });
    } else {
      await route.fulfill({ status: 204 });
    }
  });
  try {
    const editor = await openEditor(page);
    await editor.fill("Keep my changes");
    const card = page.locator("#comment-100");
    const save = card.getByRole("button", { name: "Save", exact: true });
    const cancel = card.getByRole("button", { name: "Cancel", exact: true });
    await save.click();
    await expect(save).toBeDisabled();
    await expect(cancel).toBeDisabled();
    await expect(editor).toHaveAttribute("readonly", "");
    await expect.poll(() => attempts).toBe(1);
    response.resolve();
    await expect(page.getByText("Edit temporarily unavailable", { exact: true })).toBeVisible();
    await expect(editor).toHaveValue("Keep my changes");
    await expect(save).toBeEnabled();
    await expect(cancel).toBeEnabled();
    await editor.fill("Updated retry");
    const request = page.waitForRequest((request) => request.method() === "PUT");
    await save.click();
    expect((await request).postDataJSON()).toEqual({ content: "Updated retry" });
    await expect(editor).toHaveCount(0);
    expect(attempts).toBe(2);
  } finally {
    response.resolve();
  }
});

test("disables saving empty or unchanged text and trims a successful edit", async ({ page }) => {
  let updatedContent = original;
  await page.route("**/api/v1/public/guestbook/roots/cursor?**", async (route) => {
    await route.fulfill({
      json: envelope({
        list: [
          {
            id: 100,
            content: updatedContent,
            username: "editor",
            authorUserId: 1,
            viewerCanEdit: true,
            viewerCanDelete: true,
            createdAt: "2026-09-01T10:00:00Z",
          },
        ],
        total: 1,
        nextCursor: null,
        hasMore: false,
      }),
    });
  });
  await page.route("**/api/v1/user/comments/100", async (route) => {
    updatedContent = route.request().postDataJSON().content;
    await route.fulfill({ status: 204 });
  });
  const editor = await openEditor(page);
  const save = page.locator("#comment-100").getByRole("button", { name: "Save", exact: true });
  await expect(save).toBeDisabled();
  await editor.fill("  \n");
  await expect(save).toBeDisabled();
  await editor.fill(`  ${original}  `);
  await expect(save).toBeDisabled();
  await editor.fill("  Published edit  ");
  await save.click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator("#comment-100")).toContainText("Published edit");
  expect(updatedContent).toBe("Published edit");
  await openEditor(page);
  await expect(editor).toHaveValue("Published edit");
});

test("keeps in-progress edits when another action refreshes the thread", async ({ page }) => {
  await page.route("**/api/v1/public/guestbook", async (route) => {
    await route.fulfill({ json: envelope({ id: 101, status: "PENDING" }) });
  });
  await page.route("**/api/v1/public/guestbook/roots/cursor?**", async (route) => {
    await route.fulfill({
      json: envelope({
        list: [
          {
            id: 100,
            content: "Updated on another device",
            username: "editor",
            nickname: "Refreshed author",
            authorUserId: 1,
            viewerCanEdit: true,
            createdAt: "2026-09-01T10:00:00Z",
          },
        ],
        total: 1,
        nextCursor: null,
        hasMore: false,
      }),
    });
  });
  const editor = await openEditor(page);
  await editor.fill("Work in progress");
  await page.getByRole("textbox", { name: "Add a comment" }).fill("Another contribution");
  await page.getByRole("button", { name: "Send comment" }).click();
  const card = page.locator("#comment-100");
  await expect(card.getByText("Refreshed author", { exact: true })).toBeVisible();
  await expect(editor).toHaveValue("Work in progress");
  await card.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(card).toContainText("Updated on another device");
  await openEditor(page);
  await expect(editor).toHaveValue("Updated on another device");
});
