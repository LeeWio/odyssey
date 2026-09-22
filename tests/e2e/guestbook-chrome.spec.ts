import { expect, test } from "@playwright/test";

test.describe("guestbook page chrome", () => {
  test("shows HeroUI header and sign-in invitation for guests", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.includes("/guestbook/")) {
        return route.fulfill({
          json: {
            code: 200,
            message: "OK",
            data: { list: [], page: 0, size: 20, total: 0, totalPages: 0, nextCursor: null },
          },
        });
      }
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    });

    await page.goto("/guestbook");

    await expect(page.getByRole("heading", { name: "Leave a note before you go." })).toBeVisible();
    await expect(page.getByText("Guestbook", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Moderated conversation", { exact: true })).toBeVisible();
    await expect(page.getByText("Visitor log")).toHaveCount(0);

    const invite = page.getByRole("heading", { name: "Sign in to add an entry" });
    await expect(invite).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in to write" })).toBeVisible();
  });

  test("keeps the invitation usable on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/api/v1/**", (route) =>
      route.fulfill({
        json: {
          code: 200,
          message: "OK",
          data: { list: [], page: 0, size: 20, total: 0, totalPages: 0, nextCursor: null },
        },
      })
    );

    await page.goto("/guestbook");
    await expect(page.getByRole("button", { name: "Sign in to write" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });
});
