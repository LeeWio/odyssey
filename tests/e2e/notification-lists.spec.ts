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
const notification = (id: number, title: string, read = false) => ({
  id,
  title,
  content: `Details for ${title}`,
  type: "SYSTEM",
  read,
  saved: false,
  createdAt: "2026-09-20T00:00:00Z",
  link: null,
});
const pageResult = (list: unknown[], page = 0, totalPages = 1) =>
  envelope({
    list,
    page,
    size: 20,
    totalPages,
    total: totalPages > 1 ? 21 : list.length,
  });
const endpoint = "**/api/v1/user/notifications?**";
test.use({ locale: "en-US" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "notification-list-test",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    )
  );
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/user/me") {
      await route.fulfill({ json: envelope({ id: 1, username: "reader" }) });
    } else if (path.endsWith("/unread/count")) {
      await route.fulfill({ json: envelope(1) });
    } else {
      await route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    }
  });
});

test("switching views hides the previous list and pagination while loading", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    const view = new URL(route.request().url()).searchParams.get("view");
    if (view === "saved") {
      await response.promise;
      await route.fulfill({ json: pageResult([]) });
    } else {
      await route.fulfill({ json: pageResult([notification(1, "Inbox message")], 0, 2) });
    }
  });
  try {
    await page.goto("/notifications");
    await expect(page.getByText("Inbox message", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Saved", exact: true }).press("Enter");
    await expect(page.getByText("Inbox message", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("status", { name: "Loading notifications" })).toBeVisible();
    await expect(page.getByText("Page 1 of 2", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
    response.resolve();
    await expect(page.getByText("No saved notifications", { exact: true })).toBeVisible();
    await expect(page.getByRole("status", { name: "Loading notifications" })).toHaveCount(0);
  } finally {
    response.resolve();
  }
});

test("a failed page load can return to the previous page without stale rows or totals", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    if (index === 1) {
      await response.promise;
      await route.fulfill({ status: 503, json: { message: "Page unavailable" } });
    } else {
      await route.fulfill({ json: pageResult([notification(1, "First page message")], 0, 2) });
    }
  });
  try {
    await page.goto("/notifications");
    await page.getByRole("button", { name: "Next", exact: true }).press("Enter");
    await expect(page.getByRole("status", { name: "Loading notifications" })).toBeVisible();
    await expect(page.getByText("First page message", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Page 2 of 2", { exact: true })).toHaveCount(0);
    response.resolve();
    await expect(page.getByText("Notifications are unavailable", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Previous", exact: true }).press("Enter");
    await expect(page.getByText("First page message", { exact: true })).toBeVisible();
    await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  } finally {
    response.resolve();
  }
});

test("deleting the last item of the final page returns to the remaining page", async ({ page }) => {
  let deleted = false;
  await page.route(endpoint, async (route) => {
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    await route.fulfill({
      json: pageResult(
        index === 0
          ? [notification(1, "Remaining message")]
          : deleted
            ? []
            : [notification(21, "Last page message")],
        index,
        deleted ? 1 : 2
      ),
    });
  });
  await page.route("**/api/v1/user/notifications/21", async (route) => {
    expect(route.request().method()).toBe("DELETE");
    deleted = true;
    await route.fulfill({ json: envelope(null) });
  });
  await page.goto("/notifications");
  await page.getByRole("button", { name: "Next", exact: true }).press("Enter");
  await expect(page.getByText("Last page message", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Delete notification: Last page message", exact: true })
    .press("Enter");
  await expect(page.getByText("Remaining message", { exact: true })).toBeVisible();
  await expect(page.getByText("Last page message", { exact: true })).toHaveCount(0);
  await expect(page.getByText("No notifications yet", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
});

test("the popover unread filter hides read messages and previous totals until its query completes", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    const unreadOnly = new URL(route.request().url()).searchParams.get("unreadOnly") === "true";
    if (unreadOnly) {
      await response.promise;
      await route.fulfill({ json: pageResult([notification(2, "Unread message")]) });
    } else {
      await route.fulfill({ json: pageResult([notification(1, "Read message", true)], 0, 2) });
    }
  });
  try {
    await page.goto("/notifications");
    await page.getByRole("button", { name: "1 unread notifications", exact: true }).press("Enter");
    const dialog = page.getByRole("dialog", { name: "Notifications", exact: true });
    await expect(dialog.getByText("Read message", { exact: true })).toBeVisible();
    await dialog.getByRole("tab", { name: /Unread/ }).press("Enter");
    await expect(dialog.getByText("Read message", { exact: true })).toHaveCount(0);
    await expect(dialog.getByRole("status", { name: "Loading notifications" })).toBeVisible();
    await expect(dialog.getByText("21 total updates", { exact: true })).toHaveCount(0);
    response.resolve();
    await expect(dialog.getByText("Unread message", { exact: true })).toBeVisible();
    await expect(dialog.getByText("1 total updates", { exact: true })).toBeVisible();
  } finally {
    response.resolve();
  }
});

test("a failed view can retry and display its own empty state", async ({ page }) => {
  let attempts = 0;
  await page.route(endpoint, async (route) => {
    const view = new URL(route.request().url()).searchParams.get("view");
    if (view === "done") {
      attempts += 1;
      await route.fulfill(
        attempts === 1
          ? { status: 503, json: { message: "Done view unavailable" } }
          : { json: pageResult([]) }
      );
    } else {
      await route.fulfill({ json: pageResult([notification(1, "Inbox message")]) });
    }
  });
  await page.goto("/notifications");
  await expect(page.getByText("Inbox message", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Done", exact: true }).press("Enter");
  await expect(page.getByText("Notifications are unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText("Inbox message", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Try again", exact: true }).press("Enter");
  await expect(page.getByText("No completed notifications", { exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});

test("row actions stay independent and a failed save unlocks only its own row", async ({
  page,
}) => {
  const first = Promise.withResolvers<void>();
  const second = Promise.withResolvers<void>();
  const attempts = [0, 0];
  await page.route(endpoint, async (route) => {
    await route.fulfill({
      json: pageResult([notification(1, "First message"), notification(2, "Second message")]),
    });
  });
  await page.route("**/api/v1/user/notifications/*/saved?**", async (route) => {
    const id = Number(new URL(route.request().url()).pathname.split("/").at(-2));
    attempts[id - 1] += 1;
    if (id === 1 && attempts[0] === 1) {
      await first.promise;
      await route.fulfill({ status: 503, json: { message: "Save temporarily unavailable" } });
    } else {
      if (id === 2) await second.promise;
      await route.fulfill({ json: envelope(null) });
    }
  });
  try {
    await page.goto("/notifications");
    const firstRow = page
      .getByRole("article")
      .filter({ has: page.getByText("First message", { exact: true }) });
    const secondRow = page
      .getByRole("article")
      .filter({ has: page.getByText("Second message", { exact: true }) });
    const saveFirst = firstRow.getByRole("button", { name: "Save notification", exact: true });
    const saveSecond = secondRow.getByRole("button", { name: "Save notification", exact: true });
    await saveFirst.press("Enter");
    await expect.poll(() => attempts[0]).toBe(1);
    await expect(
      firstRow.getByRole("button", { name: "Complete notification: First message" })
    ).toBeDisabled();
    await expect(
      firstRow.getByRole("button", { name: "Delete notification: First message" })
    ).toBeDisabled();
    await expect(saveSecond).toBeEnabled();
    await expect(page.getByRole("button", { name: "Mark all read", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Clear read", exact: true })).toBeDisabled();
    await saveSecond.press("Enter");
    await expect.poll(() => attempts[1]).toBe(1);
    await expect(saveFirst).toHaveAttribute("data-pending", "true");
    await expect(saveSecond).toHaveAttribute("data-pending", "true");
    first.resolve();
    await expect(page.getByText("Save temporarily unavailable", { exact: true })).toBeVisible();
    await expect(saveFirst).toBeEnabled();
    await expect(saveSecond).toBeDisabled();
    await expect(page.getByRole("button", { name: "Mark all read", exact: true })).toBeDisabled();
    await expect(saveSecond).toHaveAttribute("data-pending", "true");
    await saveFirst.press("Enter");
    await expect.poll(() => attempts[0]).toBe(2);
    await expect(saveFirst).toBeEnabled();
    await expect(saveSecond).toBeDisabled();
    second.resolve();
    await expect(saveSecond).toBeEnabled();
    await expect(page.getByRole("button", { name: "Mark all read", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Clear read", exact: true })).toBeEnabled();
    expect(attempts).toEqual([2, 1]);
  } finally {
    first.resolve();
    second.resolve();
  }
});

test("the popover preserves another pending read when one read fails", async ({ page }) => {
  const first = Promise.withResolvers<void>();
  const second = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    await route.fulfill({
      json: pageResult([notification(1, "First message"), notification(2, "Second message")]),
    });
  });
  await page.route("**/api/v1/user/notifications/*/read", async (route) => {
    if (route.request().url().includes("/1/read")) {
      await first.promise;
      await route.fulfill({ status: 503, json: { message: "Read temporarily unavailable" } });
    } else {
      await second.promise;
      await route.fulfill({ json: envelope(null) });
    }
  });
  try {
    await page.goto("/notifications");
    await page.getByRole("button", { name: "1 unread notifications", exact: true }).press("Enter");
    const dialog = page.getByRole("dialog", { name: "Notifications", exact: true });
    const firstButton = dialog.getByRole("button", { name: /First message/ });
    const secondButton = dialog.getByRole("button", { name: /Second message/ });
    await firstButton.press("Enter");
    await secondButton.press("Enter");
    await expect(firstButton).toBeDisabled();
    await expect(secondButton).toBeDisabled();
    await expect(
      dialog.getByRole("button", { name: "Mark all notifications as read" })
    ).toBeDisabled();
    first.resolve();
    await expect(page.getByText("Read temporarily unavailable", { exact: true })).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(firstButton).toBeEnabled();
    await expect(secondButton).toBeDisabled();
    second.resolve();
    await expect(dialog).toHaveCount(0);
  } finally {
    first.resolve();
    second.resolve();
  }
});

test("clear read locks dismissal while pending and restores cancellation and retry after failure", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  let attempts = 0;
  let cleared = false;
  await page.route(endpoint, async (route) => {
    await route.fulfill({
      json: pageResult(cleared ? [] : [notification(1, "Read message", true)]),
    });
  });
  await page.route("**/api/v1/user/notifications/read", async (route) => {
    expect(route.request().method()).toBe("DELETE");
    attempts += 1;
    if (attempts === 1) {
      await response.promise;
      await route.fulfill({ status: 503, json: { message: "Clear temporarily unavailable" } });
    } else {
      cleared = true;
      await route.fulfill({ json: envelope(null) });
    }
  });
  try {
    await page.goto("/notifications");
    await expect(page.getByText("Read message", { exact: true })).toBeVisible();
    const open = page.getByRole("button", { name: "Clear read", exact: true });
    await open.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Clear read notifications?" });
    const confirm = dialog.getByRole("button", { name: "Clear read notifications", exact: true });
    const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
    const close = dialog.getByRole("button", { name: "Close", exact: true });
    await confirm.press("Enter");
    await expect.poll(() => attempts).toBe(1);
    await expect(confirm).toHaveAttribute("data-pending", "true");
    await expect(cancel).toBeDisabled();
    await expect(close).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    response.resolve();
    await expect(page.getByText("Clear temporarily unavailable", { exact: true })).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(confirm).toBeEnabled();
    await expect(cancel).toBeEnabled();
    await expect(close).toBeEnabled();
    await cancel.press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("Read message", { exact: true })).toBeVisible();
    await open.press("Enter");
    await confirm.press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("No notifications yet", { exact: true })).toBeVisible();
    expect(attempts).toBe(2);
  } finally {
    response.resolve();
  }
});

for (const surface of ["center", "popover"] as const) {
  test(`${surface}: mark all read blocks row changes and recovers after failure`, async ({
    page,
  }) => {
    const response = Promise.withResolvers<void>();
    let attempts = 0;
    await page.route(endpoint, async (route) => {
      await route.fulfill({ json: pageResult([notification(1, "Unread message")]) });
    });
    await page.route("**/api/v1/user/notifications/read-all", async (route) => {
      expect(route.request().method()).toBe("PATCH");
      attempts += 1;
      if (attempts === 1) {
        await response.promise;
        await route.fulfill({ status: 503, json: { message: "Mark all temporarily unavailable" } });
      } else {
        await route.fulfill({ json: envelope(null) });
      }
    });
    try {
      await page.goto("/notifications");
      if (surface === "popover") {
        await page
          .getByRole("button", { name: "1 unread notifications", exact: true })
          .press("Enter");
      }
      const container =
        surface === "popover"
          ? page.getByRole("dialog", { name: "Notifications", exact: true })
          : page.locator("main");
      const markAll = container.getByRole("button", {
        name: surface === "popover" ? "Mark all notifications as read" : "Mark all read",
        exact: true,
      });
      const row = container.getByRole("button", { name: /Unread message.*Details/ });
      await expect(row).toBeEnabled();
      await markAll.press("Enter");
      await expect.poll(() => attempts).toBe(1);
      await expect(markAll).toHaveAttribute("data-pending", "true");
      await expect(row).toBeDisabled();
      if (surface === "center") {
        await expect(
          container.getByRole("button", { name: "Clear read", exact: true })
        ).toBeDisabled();
        await expect(
          container.getByRole("button", { name: "Save notification", exact: true })
        ).toBeDisabled();
        await expect(
          container.getByRole("button", { name: "Delete notification: Unread message" })
        ).toBeDisabled();
      }
      response.resolve();
      await expect(
        page.getByText("Mark all temporarily unavailable", { exact: true })
      ).toBeVisible();
      await expect(row).toBeEnabled();
      await expect(markAll).toBeEnabled();
      await markAll.press("Enter");
      await expect.poll(() => attempts).toBe(2);
      await expect(markAll).toBeEnabled();
      await expect(row).toBeEnabled();
    } finally {
      response.resolve();
    }
  });
}
