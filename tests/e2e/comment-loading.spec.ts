import { expect, test as base } from "@playwright/test";

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors, "Loading failures must not become unhandled browser errors").toEqual([]);
    },
    { auto: true },
  ],
});

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const comment = (id: number, content: string, replyCount = 0) => ({
  id,
  content,
  replyCount,
  username: "reader",
  createdAt: "2026-09-01T10:00:00Z",
});
const cursorPage = (list: unknown[], nextCursor: number | null = null) =>
  envelope({ list, nextCursor, hasMore: nextCursor !== null, total: 2 });

test.use({ locale: "en-US" });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/public/guestbook/roots/cursor") {
      await route.fulfill({ json: cursorPage([comment(100, "Existing discussion", 1)], 90) });
    } else if (url.pathname.endsWith("/new-count")) {
      await route.fulfill({
        json: envelope(Number(url.searchParams.get("afterId")) < 200 ? 2 : 0),
      });
    } else {
      await route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    }
  });
  await page.goto("/guestbook");
  await expect(page.getByText("Existing discussion", { exact: true })).toBeVisible();
});

test("shows pagination progress, preserves existing comments on failure, and retries the same cursor", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  const cursors: string[] = [];
  await page.route("**/api/v1/public/guestbook/roots/cursor?**", async (route) => {
    cursors.push(new URL(route.request().url()).searchParams.get("cursor") ?? "");
    if (cursors.length === 1) {
      await response.promise;
      await route.fulfill({ status: 503, json: { message: "Offline" } });
    } else {
      await route.fulfill({ json: cursorPage([comment(80, "Older discussion")]) });
    }
  });
  try {
    const loadMore = page.getByRole("button", { name: "Load more", exact: true });
    await loadMore.click();
    await expect(loadMore).toBeDisabled();
    await expect.poll(() => cursors.length).toBe(1);
    response.resolve();
    await expect(
      page.getByText("Couldn’t load more comments. Please try again.", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Existing discussion", { exact: true })).toBeVisible();
    await expect(loadMore).toBeEnabled();
    await loadMore.click();
    await expect(page.getByText("Older discussion", { exact: true })).toBeVisible();
    await expect(page.getByText("Existing discussion", { exact: true })).toBeVisible();
    await expect(loadMore).toHaveCount(0);
    expect(cursors).toEqual(["90", "90"]);
  } finally {
    response.resolve();
  }
});

test("keeps a failed reply expansion collapsed and lets the user retry", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  let attempts = 0;
  await page.route("**/api/v1/public/comments/100/replies/cursor?**", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await response.promise;
      await route.fulfill({ status: 503, json: { message: "Offline" } });
    } else {
      await route.fulfill({
        json: cursorPage([{ ...comment(101, "Recovered reply"), parentId: 100 }]),
      });
    }
  });
  try {
    const showReplies = page.getByRole("button", { name: "Show 1 reply", exact: true });
    await showReplies.click();
    await expect(page.getByRole("button", { name: "Loading replies…" })).toBeDisabled();
    response.resolve();
    await expect(
      page.getByText("Couldn’t load replies. Please try again.", { exact: true })
    ).toBeVisible();
    await expect(showReplies).toHaveAttribute("aria-expanded", "false");
    await showReplies.click();
    await expect(page.getByText("Recovered reply", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hide 1 reply" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(attempts).toBe(2);
  } finally {
    response.resolve();
  }
});

test("preserves the new-comment baseline after failure and retries successfully", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  const baselines: string[] = [];
  await page.route("**/api/v1/public/guestbook/new?**", async (route) => {
    baselines.push(new URL(route.request().url()).searchParams.get("afterId") ?? "");
    if (baselines.length === 1) {
      await response.promise;
      await route.fulfill({ status: 503, json: { message: "Offline" } });
    } else {
      await route.fulfill({ json: cursorPage([comment(200, "New discussion")]) });
    }
  });
  try {
    const loadNew = page.getByRole("button", { name: "2 new entries", exact: true });
    await loadNew.click();
    await expect(loadNew).toBeDisabled();
    response.resolve();
    await expect(
      page.getByText("Couldn’t load new comments. Please try again.", { exact: true })
    ).toBeVisible();
    await expect(loadNew).toBeEnabled();
    await loadNew.click();
    await expect(page.getByText("New discussion", { exact: true })).toBeVisible();
    await expect(page.getByText("Existing discussion", { exact: true })).toBeVisible();
    await expect(loadNew).toHaveCount(0);
    expect(baselines).toEqual(["100", "100"]);
  } finally {
    response.resolve();
  }
});

test("isolates a pending page from another sort order", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  await page.route("**/api/v1/public/guestbook/roots/cursor?**", async (route) => {
    await response.promise;
    await route.fulfill({ json: cursorPage([comment(80, "Delayed newest page")]) });
  });
  await page.route("**/api/v1/public/guestbook/roots?**", async (route) => {
    await route.fulfill({
      json: envelope({
        list: [comment(20, "Oldest discussion")],
        total: 2,
        page: 0,
        size: 20,
        totalPages: 1,
      }),
    });
  });
  try {
    await page.getByRole("button", { name: "Load more", exact: true }).click();
    await expect(page.getByRole("button", { name: "Load more", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Choose comment sort" }).click();
    await page.getByRole("menuitemradio", { name: "Oldest" }).click();
    await expect(page.getByText("Oldest discussion", { exact: true })).toBeVisible();
    response.resolve();
    await expect(page.getByText("Delayed newest page", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Existing discussion", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Choose comment sort" }).click();
    await page.getByRole("menuitemradio", { name: "Newest" }).click();
    await expect(page.getByText("Delayed newest page", { exact: true })).toBeVisible();
    await expect(page.getByText("Existing discussion", { exact: true })).toBeVisible();
  } finally {
    response.resolve();
  }
});
