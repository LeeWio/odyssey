import { expect, test, type Page } from "@playwright/test";

const momentsPath = "/api/v1/public/moments";
const writingPath = "/api/v1/public/blog/posts/featured";
const envelope = (list: unknown[]) => ({
  code: 200,
  message: "OK",
  data: { list, page: 0, size: 18, total: list.length, totalPages: list.length ? 1 : 0 },
});

async function mockQuietHome(page: Page) {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === momentsPath || path === writingPath) {
      return route.fulfill({ json: envelope([]) });
    }
    return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
  });
}

test.describe("home orientation", () => {
  test("shows three honest doors for a first visit and dismisses permanently", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockQuietHome(page);
    await page.addInitScript(() => {
      window.localStorage.removeItem("odyssey_home_orientation_dismissed");
    });

    await page.goto("/");
    const orientation = page.getByRole("region", { name: "Site orientation" });
    await expect(orientation).toBeVisible();
    await expect(orientation.getByRole("heading", { name: "Three honest doors" })).toBeVisible();
    await expect(orientation.getByRole("link", { name: "Read writing" })).toHaveAttribute(
      "href",
      "/chronicle"
    );
    await expect(orientation.getByRole("link", { name: "Open footprints" })).toHaveAttribute(
      "href",
      "/footprints"
    );
    await expect(orientation.getByRole("link", { name: "See tools" })).toHaveAttribute(
      "href",
      "/uses"
    );

    await orientation.getByRole("button", { name: "Dismiss orientation" }).click();
    await expect(orientation).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("region", { name: "Site orientation" })).toHaveCount(0);
  });

  test("stays usable on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockQuietHome(page);
    await page.addInitScript(() => {
      window.localStorage.removeItem("odyssey_home_orientation_dismissed");
    });

    await page.goto("/");
    const orientation = page.getByRole("region", { name: "Site orientation" });
    await expect(orientation).toBeVisible();
    await expect(orientation.getByRole("link", { name: "See tools" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });

  test("following a door dismisses the card for the next visit", async ({ page }) => {
    await mockQuietHome(page);
    await page.addInitScript(() => {
      window.localStorage.removeItem("odyssey_home_orientation_dismissed");
    });

    await page.goto("/");
    await page
      .getByRole("region", { name: "Site orientation" })
      .getByRole("link", { name: "See tools" })
      .click();
    await expect(page).toHaveURL(/\/uses/);

    await page.goto("/");
    await expect(page.getByRole("region", { name: "Site orientation" })).toHaveCount(0);
  });
});
