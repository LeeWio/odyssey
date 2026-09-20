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
const initial = {
  commentNotificationsEnabled: true,
  categoryPostNotificationsEnabled: true,
  systemNotificationsEnabled: true,
  commentEmailNotificationsEnabled: false,
  categoryPostEmailNotificationsEnabled: false,
  systemEmailNotificationsEnabled: false,
};
const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const endpoint = "**/api/v1/user/notifications/preferences";
test.use({ locale: "en-US" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "preferences-test",
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
      await route.fulfill({ json: envelope(0) });
    } else {
      await route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    }
  });
});

test("preserves changes after a failed save and allows retry without unhandled errors", async ({
  page,
}) => {
  let saved = { ...initial };
  let attempts = 0;
  await page.route(endpoint, async (route) => {
    if (route.request().method() === "PUT") {
      attempts += 1;
      if (attempts === 1) {
        await route.fulfill({
          status: 503,
          json: { message: "Preferences temporarily unavailable" },
        });
        return;
      }
      saved = route.request().postDataJSON();
    }
    await route.fulfill({ json: envelope(saved) });
  });
  await page.goto("/notifications/settings");
  const email = page.getByRole("switch", { name: "Comments & replies email", exact: true });
  const save = page.getByRole("button", { name: "Save preferences" });
  await email.press("Space");
  await save.press("Enter");
  await expect(
    page.getByText("Preferences temporarily unavailable", { exact: true })
  ).toBeVisible();
  await expect(email).toBeChecked();
  await expect(save).toBeEnabled();
  await save.press("Enter");
  await expect(save).toBeDisabled();
  await expect(save).not.toHaveAttribute("data-pending", "true");
  expect(saved.commentEmailNotificationsEnabled).toBe(true);
  expect(attempts).toBe(2);
});

test("retains changes made during saving for a subsequent save", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  let saved = { ...initial };
  const submissions: (typeof initial)[] = [];
  await page.route(endpoint, async (route) => {
    if (route.request().method() === "PUT") {
      submissions.push(route.request().postDataJSON());
      if (submissions.length === 1) await response.promise;
      saved = submissions[submissions.length - 1];
    }
    await route.fulfill({ json: envelope(saved) });
  });
  try {
    await page.goto("/notifications/settings");
    const comments = page.getByRole("switch", { name: "Comments & replies email", exact: true });
    const system = page.getByRole("switch", { name: "System updates email", exact: true });
    const save = page.getByRole("button", { name: "Save preferences" });
    await comments.press("Space");
    await save.press("Enter");
    await expect.poll(() => submissions.length).toBe(1);
    await expect(save).toBeDisabled();
    await system.press("Space");
    response.resolve();
    await expect(save).not.toHaveAttribute("data-pending", "true");
    await expect(system).toBeChecked();
    await expect(comments).toBeChecked();
    await expect(save).toBeEnabled();
    await save.press("Enter");
    await expect.poll(() => submissions.length).toBe(2);
    await expect(save).not.toHaveAttribute("data-pending", "true");
    await expect(save).toBeDisabled();
    expect(submissions[0]).toEqual({ ...initial, commentEmailNotificationsEnabled: true });
    expect(submissions[1]).toEqual({
      ...initial,
      commentEmailNotificationsEnabled: true,
      systemEmailNotificationsEnabled: true,
    });
  } finally {
    response.resolve();
  }
});

test("uses the saved server response even when the following refresh fails", async ({ page }) => {
  let updated = false;
  await page.route(endpoint, async (route) => {
    if (route.request().method() === "PUT") {
      updated = true;
      await route.fulfill({
        json: envelope({ ...initial, commentEmailNotificationsEnabled: true }),
      });
    } else if (updated) {
      await route.fulfill({ status: 503, json: { message: "Refresh unavailable" } });
    } else {
      await route.fulfill({ json: envelope(initial) });
    }
  });
  await page.goto("/notifications/settings");
  const email = page.getByRole("switch", { name: "Comments & replies email", exact: true });
  await email.press("Space");
  const save = page.getByRole("button", { name: "Save preferences" });
  await save.press("Enter");
  await expect(page.getByText("Preferences are unavailable", { exact: true })).toBeVisible();
  await expect(email).toBeChecked();
  await expect(save).not.toHaveAttribute("data-pending", "true");
  await expect(save).toBeDisabled();
});

test("replaces initial loading with an error and supports loading again", async ({ page }) => {
  let attempts = 0;
  await page.route(endpoint, async (route) => {
    attempts += 1;
    await route.fulfill(
      attempts === 1
        ? { status: 503, json: { message: "Load unavailable" } }
        : { json: envelope(initial) }
    );
  });
  await page.goto("/notifications/settings");
  await expect(page.getByText("Preferences are unavailable", { exact: true })).toBeVisible();
  const section = page.getByRole("region", { name: "Notification delivery preferences" });
  await expect(section.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await expect(section.getByRole("switch")).toHaveCount(0);
  await page.getByRole("button", { name: "Try again", exact: true }).press("Enter");
  await expect(section.getByRole("switch")).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Save preferences" })).toBeDisabled();
});
