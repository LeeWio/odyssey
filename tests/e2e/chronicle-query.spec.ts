import { expect, test } from "@playwright/test";
import { designArticle } from "./fixtures/articles";

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });

function article(title: string) {
  return {
    ...designArticle,
    id: 1,
    slug: "query-fixture",
    title,
    summary: "A discovery fixture.",
    status: "PUBLISHED",
    publishedAt: "2026-09-01T00:00:00Z",
    createdAt: "2026-09-01T00:00:00Z",
    views: 1,
    tags: [],
  };
}

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/public/blog/facets", (route) =>
    route.fulfill({
      json: envelope({
        totalPublishedCount: 12,
        categories: [{ id: 1, name: "Systems", count: 12 }],
        archives: [{ year: 2026, month: 9, count: 12 }],
      }),
    })
  );
  await page.route("**/api/v1/public/blog/posts?**", (route) => {
    const params = new URL(route.request().url()).searchParams;
    const keyword = params.get("keyword") || "unfiltered";
    return route.fulfill({
      json: envelope({
        list: [article(`Results for ${keyword}`)],
        page: Number(params.get("page")),
        size: 9,
        total: 12,
        totalPages: 2,
      }),
    });
  });
  await page.route("**/api/v1/public/blog/archive?**", (route) => {
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    return route.fulfill({
      json: envelope({
        list: index < 2 ? [article(`Archive page ${index + 1}`)] : [],
        page: index,
        size: 10,
        total: 12,
        totalPages: 2,
      }),
    });
  });
});

test("Explore preserves the focused node and caret through its own URL updates @smoke", async ({
  page,
}) => {
  await page.goto("/explore?q=before");
  const field = page.getByRole("searchbox");
  const results = page.getByTestId("explore-results");
  await expect(field).toHaveValue("before");
  await expect(results.getByText("Results for before", { exact: true })).toBeVisible();
  await page.evaluate(() => window.history.pushState(null, "", "/explore?q=MAX"));
  await expect(field).toHaveValue("MAX");
  await expect(field).not.toBeFocused();

  await field.fill("MAX96");
  await field.press("ArrowLeft");
  await expect(page).toHaveURL("/explore?q=MAX96");
  await expect(results.getByText("Results for MAX96", { exact: true })).toBeVisible();
  await expect(field).toBeFocused();
  expect(await field.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(4);
  await page.keyboard.type("781");
  await expect(field).toHaveValue("MAX97816");
  await expect(page).toHaveURL("/explore?q=MAX97816");
  await expect(field).toBeFocused();

  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(field).toHaveValue("");
  await expect(page).toHaveURL("/explore");
  await field.press("Tab");
  await page.goBack();
  await expect(page).toHaveURL("/explore?q=before");
  await expect(field).toHaveValue("before");
  await expect(field).not.toBeFocused();
  await expect(results.getByText("Results for before", { exact: true })).toBeVisible();
});

test("Chronicle keeps both panels in place and restores their URL through browser history @smoke", async ({
  page,
}) => {
  await page.goto("/chronicle?section=explore&page=2");
  const sections = page.getByRole("tablist", { name: "Ways through the writing" });
  const explore = sections.getByRole("tab", { name: "Find a piece" });
  const archive = sections.getByRole("tab", { name: "In order" });
  const field = page.getByRole("searchbox");
  const results = page.getByTestId("explore-results");
  await expect(results.getByText("Results for unfiltered", { exact: true })).toBeVisible();
  await field.fill("network");
  await expect(page).toHaveURL("/chronicle?section=explore&q=network");
  await expect(results.getByText("Results for network", { exact: true })).toBeVisible();
  await expect(field).toBeFocused();
  await page.getByRole("row", { name: "Systems", exact: true }).click();
  await expect(page).toHaveURL("/chronicle?section=explore&q=network&category=1");
  await page.getByText("List", { exact: true }).click();
  await expect(page).toHaveURL("/chronicle?section=explore&q=network&category=1&view=list");
  await expect(results).toHaveAttribute("data-view", "list");
  await expect(explore).toHaveAttribute("aria-selected", "true");

  await archive.click();
  await expect(page).toHaveURL("/chronicle?section=archive");
  await expect(page.getByText("Archive page 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL("/chronicle?section=archive&page=2");
  await expect(page.getByText("Archive page 2", { exact: true })).toBeVisible();
  await expect(archive).toHaveAttribute("aria-selected", "true");
  await page.reload();
  await expect(page.getByText("Archive page 2", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/chronicle?section=explore&q=network&category=1&view=list");
  await expect(field).toHaveValue("network");
  await expect(explore).toHaveAttribute("aria-selected", "true");

  await page.goto("/chronicle?section=archive&page=99");
  await expect(page).toHaveURL("/chronicle?section=archive&page=2");
  await expect(archive).toHaveAttribute("aria-selected", "true");
});
