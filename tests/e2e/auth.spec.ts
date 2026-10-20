import { expect, test } from "@playwright/test";

test.use({ locale: "en-US" });

test.beforeEach(async ({ page }) => {
  await page.goto("/test/auth");
  await expect(page.locator("main[data-ready=true]")).toBeVisible();
});

test("switches content inside the same dialog and restores focus on close", async ({ page }) => {
  await page.getByRole("button", { name: "Open login" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Log In" })).toBeVisible();
  await expect(dialog.locator('input[name="email"]')).toBeFocused();
  await dialog.evaluate((node) => node.setAttribute("data-original-dialog", "true"));
  for (let i = 0; i < 3; i++) {
    await dialog.getByRole("link", { name: "Sign Up", exact: true }).click();
    await expect(dialog.getByRole("heading", { name: "Sign Up" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Continue with Email" })).toBeFocused();
    await expect(dialog).toHaveAttribute("data-original-dialog", "true");
    await expect(dialog).toHaveCount(1);
    await dialog.getByRole("link", { name: "Log In", exact: true }).click();
    await expect(dialog.locator('input[name="email"]')).toBeFocused();
    await expect(dialog).toHaveAttribute("data-original-dialog", "true");
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open login" })).toBeFocused();
});

test("keeps the mobile registration form scrollable and clears fields after closing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await page.getByRole("button", { name: "Open signup" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Continue with Email" }).click();
  await expect(dialog.locator('input[name="username"]')).toBeFocused();
  await dialog.locator('input[name="password"]').fill("Testing123");
  await dialog.getByRole("button", { name: "Other Sign Up options" }).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole("button", { name: "Other Sign Up options" })).toBeInViewport();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Open signup" }).click();
  await dialog.getByRole("button", { name: "Continue with Email" }).click();
  await expect(dialog.locator('input[name="password"]')).toHaveValue("");
});

test("switches views with reduced motion enabled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Open login" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("link", { name: "Sign Up", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Continue with Email" })).toBeFocused();
  await expect(dialog).toHaveCount(1);
});

test("registration success explains that an administrator must approve the account", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/register", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 0,
        message: "Account submitted for review",
        data: null,
      }),
    });
  });

  await page.getByRole("button", { name: "Open signup" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Continue with Email" }).click();
  await dialog.locator('input[name="username"]').fill("ada");
  await dialog.locator('input[name="email"]').fill("ada@example.com");
  await dialog.locator('input[name="password"]').fill("Secret123");
  await dialog.locator('input[name="password"]').press("Tab");
  await expect(dialog.locator('input[name="confirmPassword"]')).toBeFocused();
  await dialog.locator('input[name="confirmPassword"]').fill("Secret123");
  await dialog.getByRole("button", { name: "Sign Up", exact: true }).click();

  await expect(dialog.getByRole("heading", { name: "Sign Up" })).toBeVisible();
  await expect(dialog.getByText("Request received")).toBeVisible();
  await expect(dialog.getByText("cannot sign in yet")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Log In" })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toHaveCount(0);
});

test("can close during a view transition and reopen the requested view", async ({ page }) => {
  await page.getByRole("button", { name: "Open login" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("link", { name: "Sign Up", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open login" })).toBeFocused();

  await page.getByRole("button", { name: "Open login" }).click();
  await expect(dialog.getByRole("heading", { name: "Log In" })).toBeVisible();
  await expect(dialog.locator('input[name="email"]')).toBeFocused();
  await expect(dialog.getByRole("heading", { name: "Sign Up" })).toHaveCount(0);
});
