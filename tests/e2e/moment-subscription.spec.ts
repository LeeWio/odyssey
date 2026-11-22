import { expect, test } from "@playwright/test";

const subscription = "/api/v1/public/moments/subscription";
const ok = { code: 200, message: "OK", data: null };
const token = "00000000-0000-4000-8000-000000000001";
const toastTitle = '[data-slot="toast-title"]';
const heroAlert = '[data-slot="alert-root"]';

test.use({ locale: "en-US" });

test("subscribes from a filtered mobile feed with keyboard focus, alert and toast feedback @smoke", async ({
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
  await expect(dialog.getByRole("status")).toContainText("reader@example.com");
  await expect(
    page.locator(toastTitle).filter({ hasText: "Subscription request received" })
  ).toBeVisible();
  expect(requested).toEqual([{ email: "reader@example.com" }, { email: "reader@example.com" }]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/\?topic=photography&view=grid$/);
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

test("opens the emailed Moment directly and returns 404 when the entry is unavailable", async ({
  page,
}) => {
  const timelineCalls: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/v1/public/moments")
      timelineCalls.push(request.url());
  });
  await page.goto("/moments/entry/809");
  await expect(page.getByText("An older Moment opened directly from an email.")).toBeVisible();
  expect(timelineCalls).toEqual([]);
  const response = await page.goto("/moments/entry/999999");
  expect(response?.status()).toBe(404);
});
