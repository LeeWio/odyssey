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
const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const post = (id: number, title: string) => ({
  id,
  title,
  slug: `archive-${id}`,
  views: 10,
  publishedAt: "2026-09-01T00:00:00Z",
});
const result = (list: unknown[], page = 0, total = list.length) =>
  envelope({
    list,
    page,
    size: 10,
    total,
    totalPages: Math.ceil(total / 10),
  });
const endpoint = "**/api/v1/public/blog/archive?**";

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({ status: 503, json: { message: "Unmocked API request" } })
  );
  await page.route("**/api/v1/public/blog/facets", (route) =>
    route.fulfill({
      json: envelope({
        archives: [
          { year: 2026, month: 9, count: 11 },
          { year: 2025, month: 8, count: 1 },
        ],
      }),
    })
  );
});

test("changing the year hides previous articles and counts until the selected period loads", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    const year = new URL(route.request().url()).searchParams.get("year");
    if (year === "2025") {
      await response.promise;
      await route.fulfill({ json: result([post(2, "Earlier article")]) });
    } else {
      await route.fulfill({ json: result([post(1, "Recent article")], 0, 11) });
    }
  });
  try {
    await page.goto("/archive");
    await expect(page.getByText("Recent article", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Year/ }).press("Enter");
    await page.getByRole("option", { name: "2025", exact: true }).press("Enter");
    await expect(page).toHaveURL(/year=2025/);
    await expect(page.getByRole("heading", { name: "2025", exact: true })).toBeVisible();
    await expect(page.getByText("Recent article", { exact: true })).toHaveCount(0);
    await expect(page.getByText("11 articles found", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("status", { name: "Loading archived articles" })).toBeVisible();
    await expect(page.getByText("No writing from this period", { exact: true })).toHaveCount(0);
    response.resolve();
    await expect(page.getByText("Earlier article", { exact: true })).toBeVisible();
    await expect(page.getByText("1 articles found", { exact: true })).toBeVisible();
  } finally {
    response.resolve();
  }
});

test("a failed second page keeps a way back without showing first-page articles or totals", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    if (index === 1) {
      await response.promise;
      await route.fulfill({ status: 503, json: { message: "Temporarily unavailable" } });
    } else {
      await route.fulfill({ json: result([post(1, "First-page article")], 0, 11) });
    }
  });
  try {
    await page.goto("/archive?year=2026");
    await page.getByRole("button", { name: "Next", exact: true }).press("Enter");
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole("status", { name: "Loading archived articles" })).toBeVisible();
    await expect(page.getByText("First-page article", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    response.resolve();
    await expect(page.getByText("The archive is unavailable", { exact: true })).toBeVisible();
    await expect(page.getByText("11 articles found", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Previous", exact: true }).press("Enter");
    await expect(page.getByText("First-page article", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/year=2026&page=1/);
  } finally {
    response.resolve();
  }
});

test("a late previous-period response cannot replace the current archive", async ({ page }) => {
  const response = Promise.withResolvers<void>();
  let started = false;
  await page.route(endpoint, async (route) => {
    const year = new URL(route.request().url()).searchParams.get("year");
    if (year === "2026") {
      started = true;
      await response.promise;
    }
    await route.fulfill({ json: result([post(Number(year), `${year} article`)]) });
  });
  try {
    await page.goto("/archive?year=2026");
    await expect.poll(() => started).toBe(true);
    // Native history updates exercise client navigation without replacing the page instance.
    await page.evaluate(() => window.history.pushState(null, "", "/archive?year=2025"));
    await expect(page.getByText("2025 article", { exact: true })).toBeVisible();
    const delivered = page.waitForResponse((value) => value.url().includes("year=2026"));
    response.resolve();
    await delivered;
    await expect(page.getByText("2026 article", { exact: true })).toHaveCount(0);
    await expect(page.getByText("2025 article", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/year=2025$/);
  } finally {
    response.resolve();
  }
});

for (const total of [11, 0]) {
  test(`an obsolete page link returns to the last valid page (${total} articles) and preserves its period`, async ({
    page,
  }) => {
    const response = Promise.withResolvers<void>();
    const requested: number[] = [];
    await page.route(endpoint, async (route) => {
      const params = new URL(route.request().url()).searchParams;
      const index = Number(params.get("page"));
      requested.push(index);
      expect(params.get("year")).toBe("2026");
      expect(params.get("month")).toBe("9");
      if (index === 98) await response.promise;
      await route.fulfill({
        json: result(index === 1 ? [post(11, "Last available article")] : [], index, total),
      });
    });
    try {
      await page.goto("/archive?year=2026&month=9&page=99&source=bookmark");
      await expect.poll(() => requested).toEqual([98]);
      await expect(page).toHaveURL(/page=99/);
      response.resolve();
      await expect
        .poll(() => new URL(page.url()).searchParams.get("page"))
        .toBe(total ? "2" : null);
      expect(new URL(page.url()).searchParams.get("source")).toBe("bookmark");
      if (total) {
        await expect(page.getByText("Last available article", { exact: true })).toBeVisible();
        await expect(page.getByText("Showing 11-11 of 11", { exact: true })).toBeVisible();
      } else {
        await expect(page.getByText("No writing from this period", { exact: true })).toBeVisible();
      }
      expect(requested).toEqual([98, total ? 1 : 0]);
    } finally {
      response.resolve();
    }
  });
}
