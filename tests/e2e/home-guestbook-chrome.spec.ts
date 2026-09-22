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
    if (path === momentsPath || path === writingPath || path.includes("/guestbook")) {
      return route.fulfill({ json: envelope([]) });
    }
    return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
  });
}

test.describe("home guestbook chrome", () => {
  test("shows invite card and guestbook link for guests", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockQuietHome(page);
    await page.goto("/");

    const section = page.locator("#guestbook");
    await section.scrollIntoViewIfNeeded();

    await expect(section.getByText("Guestbook", { exact: true }).first()).toBeVisible();
    await expect(section.getByRole("link", { name: "Open the guestbook" })).toHaveAttribute(
      "href",
      "/guestbook"
    );
    await expect(section.getByRole("heading", { name: "Sign in to add an entry" })).toBeVisible();
    await expect(section.getByRole("button", { name: "Sign in to write" })).toBeVisible();
  });

  test("keeps the guestbook section usable on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockQuietHome(page);
    await page.goto("/");

    const section = page.locator("#guestbook");
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole("link", { name: "Open the guestbook" })).toBeVisible();
    await expect(section.getByRole("button", { name: "Sign in to write" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });
});
