import { expect, test } from "@playwright/test";

const listPath = "/api/v1/public/friend-links";

function envelope(list: unknown[]) {
  return {
    code: 200,
    message: "OK",
    data: list,
  };
}

const sampleLink = {
  id: 1,
  name: "Quiet Studio",
  url: "https://quiet.studio",
  avatar: "https://quiet.studio/avatar.png",
  description: "Notes on calm interfaces.",
  email: "hello@quiet.studio",
  status: "APPROVED",
  sortOrder: 1,
  isPublished: true,
  createdAt: "2026-01-01T00:00:00",
  updatedAt: "2026-01-01T00:00:00",
};

test.describe("friend links page chrome", () => {
  test("shows Blogroll chrome and suggest section", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === listPath) {
        return route.fulfill({ json: envelope([sampleLink]) });
      }
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    });

    await page.goto("/links");

    await expect(page.getByText("Blogroll", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Good places lead to better ideas." })
    ).toBeVisible();
    await expect(page.getByText("places to visit", { exact: true })).toBeVisible();
    await expect(page.getByText("The blogroll", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Link exchange", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add your corner of the web." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit for review" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Quiet Studio/i })).toBeVisible();
  });

  test("keeps empty and search chrome usable on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === listPath) {
        return route.fulfill({ json: envelope([sampleLink]) });
      }
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    });

    await page.goto("/links");
    await page.getByRole("searchbox", { name: "Search places to visit" }).fill("zzzz-no-match");
    await expect(page.getByRole("heading", { name: "No places match your search" })).toBeVisible();
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page.getByRole("link", { name: /Quiet Studio/i })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });
});
