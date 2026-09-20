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

test.use({ locale: "en-US" });
test.beforeEach(async ({ page }) => {
  // No newsletter requests reach a real service or send an email.
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({ status: 503, json: { message: "Unmocked API request" } })
  );
});

for (const action of ["verify", "unsubscribe"] as const) {
  const title = action === "verify" ? "You’re on the list." : "You’ve been unsubscribed.";
  const endpoint = `**/api/v1/public/newsletter/${action}?**`;

  test(`${action}: success remains visible after removing the token and reloading`, async ({
    page,
  }) => {
    let attempts = 0;
    await page.route(endpoint, async (route) => {
      attempts += 1;
      await route.fulfill({ json: { code: 200, message: "OK", data: null } });
    });
    await page.goto(`/newsletter/${action}?token=test-token`);
    await expect(page).toHaveURL(new RegExp(`/newsletter/${action}\\?status=${action}$`));
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByText("Your preference has been saved.", { exact: true })).toBeVisible();
    await expect(page.getByText(/This link is incomplete/)).toHaveCount(0);
    await page.reload();
    await expect(page.getByText("Your preference has been saved.", { exact: true })).toBeVisible();
    expect(attempts).toBe(1);
  });

  test(`${action}: waits for the server before showing success`, async ({ page }) => {
    const response = Promise.withResolvers<void>();
    let attempts = 0;
    await page.route(endpoint, async (route) => {
      attempts += 1;
      await response.promise;
      await route.fulfill({ json: { code: 200, message: "OK", data: null } });
    });
    try {
      await page.goto(`/newsletter/${action}?token=delayed-token`);
      await expect.poll(() => attempts).toBe(1);
      await expect(page.getByRole("status")).toContainText("Confirming your choice…");
      await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
      await expect(page.getByText("Your preference has been saved.", { exact: true })).toHaveCount(
        0
      );
      response.resolve();
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    } finally {
      response.resolve();
    }
  });

  test(`${action}: missing or blank tokens do not report success or call the API`, async ({
    page,
  }) => {
    let attempts = 0;
    await page.route(endpoint, async (route) => {
      attempts += 1;
      await route.fulfill({ json: { code: 200, message: "OK", data: null } });
    });
    for (const suffix of ["", "?token=%20%20"]) {
      await page.goto(`/newsletter/${action}${suffix}`);
      await expect(page.getByText(/This link is incomplete/)).toBeVisible();
      await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
    }
    expect(attempts).toBe(0);
  });

  test(`${action}: a failed request can be retried without reporting success early`, async ({
    page,
  }) => {
    let attempts = 0;
    await page.route(endpoint, async (route) => {
      attempts += 1;
      await route.fulfill(
        attempts === 1
          ? { status: 503, json: { message: "Temporarily unavailable" } }
          : { json: { code: 200, message: "OK", data: null } }
      );
    });
    await page.goto(`/newsletter/${action}?token=retry-token`);
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "We couldn’t process this link."
    );
    await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp("token=retry-token$"));
    await page.getByRole("button", { name: "Try again", exact: true }).press("Enter");
    await expect(page.getByText("Your preference has been saved.", { exact: true })).toBeVisible();
    expect(attempts).toBe(2);
  });

  test(`${action}: a status parameter cannot skip processing a supplied token`, async ({
    page,
  }) => {
    let attempts = 0;
    await page.route(endpoint, async (route) => {
      attempts += 1;
      expect(new URL(route.request().url()).searchParams.get("token")).toBe("invalid-token");
      await route.fulfill({ status: 400, json: { message: "Invalid token" } });
    });
    await page.goto(`/newsletter/${action}?token=invalid-token&status=${action}`);
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "We couldn’t process this link."
    );
    await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
    expect(attempts).toBe(1);
  });

  test(`${action}: a previous token's late response cannot complete the current link`, async ({
    page,
  }) => {
    const first = Promise.withResolvers<void>();
    const second = Promise.withResolvers<void>();
    const requested: string[] = [];
    await page.route(endpoint, async (route) => {
      const token = new URL(route.request().url()).searchParams.get("token")!;
      requested.push(token);
      if (token === "first-token") {
        await first.promise;
        await route.fulfill({ json: { code: 200, message: "OK", data: null } });
      } else {
        await second.promise;
        await route.fulfill({ status: 400, json: { message: "Invalid token" } });
      }
    });
    try {
      await page.goto(`/newsletter/${action}?token=first-token`);
      await expect.poll(() => requested).toEqual(["first-token"]);
      // Next.js integrates native history updates with useSearchParams.
      await page.evaluate((value) => {
        window.history.pushState(null, "", `/newsletter/${value}?token=second-token`);
      }, action);
      await expect.poll(() => requested).toEqual(["first-token", "second-token"]);
      const previousResponse = page.waitForResponse((response) =>
        response.url().includes("token=first-token")
      );
      first.resolve();
      await previousResponse;
      await expect(page.getByRole("status")).toContainText("Confirming your choice…");
      second.resolve();
      await expect(page.locator("main").getByRole("alert")).toContainText(
        "We couldn’t process this link."
      );
      await expect(page).toHaveURL(new RegExp("token=second-token$"));
      await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
    } finally {
      first.resolve();
      second.resolve();
    }
  });
}
