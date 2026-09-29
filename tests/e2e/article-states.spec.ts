import { expect, test } from "@playwright/test";

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });

test.use({ locale: "en-US" });

test("shows a recoverable not-found state for an unavailable article", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/public/blog/posts/missing-article") {
      return route.fulfill({ status: 404, json: { code: 404, message: "Not found", data: null } });
    }
    if (path.endsWith("/related")) return route.fulfill({ json: envelope([]) });
    if (path.endsWith("/featured")) {
      return route.fulfill({
        json: envelope({ list: [], page: 0, size: 5, total: 0, totalPages: 0 }),
      });
    }
    return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
  });

  await page.goto("/single/missing-article");

  await expect(page.getByRole("heading", { name: "Article not found", exact: true })).toBeVisible();
  await expect(
    page.getByText("This post could not be found, or it has not been published yet.", {
      exact: true,
    })
  ).toBeVisible();
  const backToJournal = page.getByRole("button", { name: "Back to journal", exact: true });
  await expect(backToJournal).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await backToJournal.click();
  await expect(page).toHaveURL(/\/single$/);
});
