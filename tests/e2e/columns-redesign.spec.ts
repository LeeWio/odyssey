import { expect, test } from "@playwright/test";
import messages from "../../messages/en.json";

const columns = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: index === 0 ? "UnbrokenColumnName".repeat(5) : `Reading path ${index + 1}`,
  slug: `path-${index + 1}`,
  description: "A focused sequence of notes and practical decisions.",
  isPublished: true,
  postsCount: index,
  posts: [],
  createdAt: "2026-10-01T00:00:00Z",
}));
const envelope = (data: unknown) => ({ code: 200, message: "OK", data });

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });

test("reading paths adapt density, retain navigation and recover from filters", async ({
  page,
}, testInfo) => {
  let requests = 0;
  await page.route("**/api/v1/public/columns", (route) => {
    requests += 1;
    return route.fulfill({ json: envelope(columns) });
  });
  await page.goto("/columns");
  const grid = page.getByTestId("columns-grid");
  await expect(grid.locator(":scope > a")).toHaveCount(12);
  for (const [index, width] of [390, 820, 1440, 1920, 2560].entries()) {
    await page.setViewportSize({ width, height: 900 });
    const container = grid.locator("../..");
    await expect(container).toHaveCSS("max-width", "none");
    expect((await container.boundingBox())!.width).toBe(width);
    await expect
      .poll(() =>
        grid.evaluate((element) => {
          const boxes = [...element.children].map((child) => child.getBoundingClientRect());
          return boxes.filter((box) => Math.abs(box.top - boxes[0].top) < 1).length;
        })
      )
      .toBe([1, 2, 3, 5, 6][index]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await expect(grid.locator("canvas")).toHaveCount(0);
    await grid.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`columns-${width}.png`) });
  }
  expect(requests).toBe(1);
  const search = page.getByRole("searchbox", { name: messages.Columns.searchLabel });
  await search.fill("Reading path 12");
  await expect(grid.locator(":scope > a")).toHaveCount(1);
  expect((await grid.locator(":scope > a").boundingBox())!.width).toBeLessThan(500);
  await search.fill("no-match");
  await expect(page.getByRole("heading", { name: messages.Columns.noMatchTitle })).toBeVisible();
  await page.getByRole("button", { name: messages.Columns.showAll }).click();
  await expect(search).toHaveValue("");
  await expect(grid.locator(":scope > a")).toHaveCount(12);
  await page.getByRole("row", { name: messages.Columns.startingSoon, exact: true }).click();
  await expect(grid.locator(":scope > a")).toHaveCount(1);
  const link = grid.getByRole("link");
  await expect(link).toHaveAttribute("href", "/columns/path-1");
  await link.focus();
  await expect(link).toBeFocused();
});

test("reading paths offer failure recovery and an empty publication state", async ({ page }) => {
  let failed = true;
  await page.route("**/api/v1/public/columns", (route) =>
    failed
      ? route.fulfill({ status: 503, json: { message: "Unavailable" } })
      : route.fulfill({ json: envelope([]) })
  );
  await page.goto("/columns");
  await expect(page.getByRole("heading", { name: messages.Columns.unavailable })).toBeVisible();
  failed = false;
  await page.getByRole("button", { name: messages.Columns.retry, exact: true }).click();
  await expect(page.getByRole("heading", { name: messages.Columns.nonePublished })).toBeVisible();
});
