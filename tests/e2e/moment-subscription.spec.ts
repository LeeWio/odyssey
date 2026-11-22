import { expect, test } from "@playwright/test";

const subscription = "/api/v1/public/moments/subscription";
const ok = { code: 200, message: "OK", data: null };
const token = "00000000-0000-4000-8000-000000000001";
const toastTitle = '[data-slot="toast-title"]';
const toastDescription = '[data-slot="toast-description"]';
const heroAlert = '[data-slot="alert-root"]';

test.use({ locale: "en-US" });

test("keeps feed controls aligned when a long topic is active", async ({ page }) => {
  const topic = "a-long-topic-that-would-push-the-view-switch-to-the-next-line";
  await page.goto(`/moments?topic=${topic}&view=grid`);
  const feed = page.getByRole("region", { name: "Moments feed" });
  const topics = feed.getByRole("button", { name: "Topics", exact: true });
  const subscribe = feed.getByRole("button", { name: "Subscribe to Moments", exact: true });
  const segment = feed.getByRole("radiogroup", { name: "Moment view" });
  const filter = feed.getByText(topic, { exact: true });

  for (const width of [320, 390, 820, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const showSegment = width >= 820;
    if (showSegment) {
      await expect(segment).toBeVisible();
    } else {
      await expect(segment).toBeHidden();
    }
    const controls = showSegment ? [topics, subscribe, segment] : [topics, subscribe];
    const bounds = await Promise.all(
      controls.map(async (control) => {
        const box = await control.boundingBox();
        if (!box) throw new Error("Expected every toolbar control to have visible bounds");
        return box;
      })
    );
    const centers = bounds.map(({ y, height }) => y + height / 2);
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(1);
    expect(bounds.every(({ x, width: controlWidth }) => x + controlWidth <= width)).toBe(true);
    await expect(filter).toBeVisible();
    expect((await filter.boundingBox())!.y).toBeGreaterThan(
      Math.max(...bounds.map(({ y, height }) => y + height))
    );
  }
});

test("closes the subscription dialog on success and keeps feedback in a toast @smoke", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requested: unknown[] = [];
  await page.route(`**${subscription}/subscribe`, async (route) => {
    requested.push(route.request().postDataJSON());
    await route.fulfill(
      requested.length === 1
        ? { status: 503, json: { message: "Temporarily unavailable" } }
        : { json: ok }
    );
  });

  await page.goto("/moments?topic=photography&view=grid");
  const trigger = page.getByRole("button", { name: "Subscribe to Moments" });
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Subscribe to Moments" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription(/each time a new public Moment is published/);
  const input = dialog.getByRole("textbox", { name: "Email address" });
  await expect(input).toBeFocused();
  const submit = dialog.getByRole("button", { name: "Send confirmation email" });
  await input.fill("reader@example");
  await submit.press("Enter");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  expect(requested).toHaveLength(0);

  await input.fill("reader@example.com");
  await submit.press("Enter");
  await expect(dialog.locator(heroAlert).getByText(/couldn’t process/i)).toBeVisible();
  await expect(
    page.locator(toastTitle).filter({ hasText: "Couldn’t process the subscription request" })
  ).toBeVisible();
  await expect(input).toHaveValue("reader@example.com");
  await submit.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(
    page.locator(toastTitle).filter({ hasText: "Subscription request received" })
  ).toBeVisible();
  await expect(page.locator(toastDescription)).toContainText("reader@example.com");
  expect(requested).toEqual([{ email: "reader@example.com" }, { email: "reader@example.com" }]);
  await expect(page).toHaveURL(/\?topic=photography&view=grid$/);
});

test("an earlier subscription response leaves a reopened dialog open", async ({ page }) => {
  const pending = Promise.withResolvers<void>();
  await page.route(`**${subscription}/subscribe`, async (route) => {
    await pending.promise;
    await route.fulfill({ json: ok });
  });

  try {
    await page.goto("/moments");
    const trigger = page.getByRole("button", { name: "Subscribe to Moments" });
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Subscribe to Moments" });
    const input = dialog.getByRole("textbox", { name: "Email address" });
    await input.fill("first@example.com");
    const submit = dialog.getByRole("button", { name: "Send confirmation email" });
    await submit.press("Enter");
    await expect(submit).toHaveAttribute("data-pending", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.press("Enter");
    await input.fill("next@example.com");

    pending.resolve();
    await expect(
      page.locator(toastTitle).filter({ hasText: "Subscription request received" })
    ).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(input).toHaveValue("next@example.com");
  } finally {
    pending.resolve();
  }
});

for (const action of ["verify", "unsubscribe"] as const) {
  test(`applies ${action} only after a deliberate action and removes the link token`, async ({
    page,
  }) => {
    const requests: unknown[] = [];
    await page.route(`**${subscription}/${action}`, async (route) => {
      requests.push(route.request().postDataJSON());
      expect(route.request().method()).toBe("POST");
      await route.fulfill(
        requests.length === 1 ? { status: 400, json: { message: "Fixture failure" } } : { json: ok }
      );
    });
    await page.goto(`/moments/subscription/${action}#token=${token}`);
    const name = action === "verify" ? "Confirm subscription" : "Confirm unsubscribe";
    const submit = page.getByRole("button", { name, exact: true });
    await expect(submit).toBeVisible();
    expect(requests).toEqual([]);
    await submit.press("Enter");
    await expect(page.locator(heroAlert).filter({ hasText: "Try again" })).toBeVisible();
    await submit.press("Enter");
    const title = action === "verify" ? "Subscribed to Moments" : "Unsubscribed from Moments";
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.locator(`${heroAlert}[role="status"]`)).toBeVisible();
    await expect(page.locator(toastTitle).filter({ hasText: title })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/moments/subscription/${action}\\?status=complete$`));
    await page.reload();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    expect(requests).toEqual([{ token }, { token }]);
  });
}

test("email links locate the Moment in the timeline and unavailable entries return 404", async ({
  page,
}) => {
  const entries = Array.from({ length: 13 }, (_, index) => ({
    id: 821 - index,
    content: `Email link fixture ${821 - index}`,
    visibility: "public",
    authorName: "Fixture author",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    likesCount: 0,
    commentsCount: 0,
    images: [],
    topics: [],
  }));
  await page.route("**/api/v1/public/moments?**", (route) => {
    const currentPage = Number(new URL(route.request().url()).searchParams.get("page") ?? "0");
    return route.fulfill({
      json: {
        ...ok,
        data: {
          list: entries.slice(currentPage * 12, currentPage * 12 + 12),
          total: 13,
          page: currentPage + 1,
          size: 12,
          totalPages: 2,
        },
      },
    });
  });
  await page.goto("/moments/entry/809");
  await expect(page).toHaveURL(/\/moments\?page=2#moment-809$/);
  const target = page.getByRole("region", { name: "Moments feed" }).locator("#moment-809");
  await expect(target).toBeFocused();
  await expect(target).toBeInViewport();
  const response = await page.goto("/moments/entry/999999");
  expect(response?.status()).toBe(404);
});
