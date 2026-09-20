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
const endpoint = "**/api/v1/public/newsletter/subscribe?**";
const success = { code: 200, message: "OK", data: null };
async function openForm(page: Page) {
  await page.goto("/newsletter/verify");
  const footer = page.getByRole("contentinfo");
  const input = footer.getByRole("textbox", { name: /Email address/ });
  const submit = footer.getByRole("button", { name: /Subscribe$/ });
  await expect(input).toBeVisible();
  return { footer, input, submit };
}

test.use({ locale: "en-US" });
test.beforeEach(async ({ page }) => {
  // All API calls are intercepted: these tests never send confirmation emails.
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({ status: 503, json: { message: "Unmocked API request" } })
  );
});

for (const draft of ["next@example.com", "first@example.com"]) {
  test(`success preserves an edited draft (${draft}) and identifies the submitted address`, async ({
    page,
  }) => {
    const response = Promise.withResolvers<void>();
    const requested: string[] = [];
    await page.route(endpoint, async (route) => {
      requested.push(new URL(route.request().url()).searchParams.get("email")!);
      await response.promise;
      await route.fulfill({ json: success });
    });
    try {
      const { footer, input, submit } = await openForm(page);
      await input.fill("first@example.com");
      await submit.press("Enter");
      await expect.poll(() => requested).toEqual(["first@example.com"]);
      await expect(submit).toHaveAttribute("data-pending", "true");
      await input.fill("next@example.com");
      await input.fill(draft);
      response.resolve();
      await expect(input).toHaveValue(draft);
      await expect(footer.getByRole("status")).toHaveText(
        "Check first@example.com to confirm your subscription."
      );
      await expect(input).toHaveValue(draft);
      await input.fill("third@example.com");
      await expect(footer.getByRole("status")).toHaveCount(0);
    } finally {
      response.resolve();
    }
  });
}

test("repeated submit events send one request and an unchanged draft clears on success", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  let attempts = 0;
  await page.route(endpoint, async (route) => {
    attempts += 1;
    await response.promise;
    await route.fulfill({ json: success });
  });
  try {
    const { footer, input, submit } = await openForm(page);
    await input.fill("reader@example.com");
    // Exercise the handler twice before React can render the pending button.
    await input.evaluate((element) => {
      const form = (element as HTMLInputElement).form!;
      form.requestSubmit();
      form.requestSubmit();
    });
    await expect.poll(() => attempts).toBe(1);
    await expect(submit).toHaveAttribute("data-pending", "true");
    response.resolve();
    await expect(footer.getByRole("status")).toContainText("reader@example.com");
    await expect(input).toHaveValue("");
    expect(attempts).toBe(1);
  } finally {
    response.resolve();
  }
});

test("failed submission keeps the draft and can be retried", async ({ page }) => {
  const requested: string[] = [];
  await page.route(endpoint, async (route) => {
    requested.push(new URL(route.request().url()).searchParams.get("email")!);
    await route.fulfill(
      requested.length === 1
        ? { status: 503, json: { message: "Temporarily unavailable" } }
        : { json: success }
    );
  });
  const { footer, input, submit } = await openForm(page);
  await input.fill("retry@example.com");
  await submit.press("Enter");
  await expect(footer.getByRole("alert")).toHaveText(
    "We couldn’t request a confirmation email for retry@example.com. Please try again."
  );
  await expect(input).toHaveValue("retry@example.com");
  await expect(footer.getByRole("status")).toHaveCount(0);
  await submit.press("Enter");
  await expect(footer.getByRole("status")).toContainText("retry@example.com");
  await expect(footer.getByRole("alert")).toHaveCount(0);
  await expect(input).toHaveValue("");
  expect(requested).toEqual(["retry@example.com", "retry@example.com"]);
});

test("invalid email addresses are blocked before any request", async ({ page }) => {
  let attempts = 0;
  await page.route(endpoint, async (route) => {
    attempts += 1;
    await route.fulfill({ json: success });
  });
  const { footer, input, submit } = await openForm(page);
  await input.fill("reader@example");
  await submit.press("Enter");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(footer.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
  expect(attempts).toBe(0);
  await input.fill("reader@example.com");
  await submit.press("Enter");
  await expect(footer.getByRole("status")).toContainText("reader@example.com");
  expect(attempts).toBe(1);
});
