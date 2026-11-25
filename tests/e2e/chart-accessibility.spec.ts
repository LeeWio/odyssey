import { expect, test } from "@playwright/test";

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });

test("writing history announces the keyboard selection and exposes monthly totals", async ({
  page,
}) => {
  await page.goto("/#site-record", { waitUntil: "domcontentloaded" });
  const figure = page.getByRole("figure", { name: "A writing history" });
  const chart = figure.getByRole("application", { name: "Cumulative published articles by month" });
  const details = figure.locator("summary").getByText("Monthly totals", { exact: true });
  const status = figure.getByRole("status");
  await figure.scrollIntoViewIfNeeded();
  await expect(chart).toHaveAccessibleDescription(/Left and Right Arrow/);
  await chart.focus();
  await expect(status).toHaveText(/0 articles published$/);
  const first = await status.textContent();
  await page.keyboard.press("ArrowRight");
  await expect(status).not.toHaveText(first!);
  await expect(status).toHaveText(/0 articles published$/);
  await page.keyboard.press("Tab");
  await expect(details).toBeFocused();
  await expect(status).toBeEmpty();
  await page.keyboard.press("Enter");
  const months = figure.getByRole("listitem");
  await expect(months).toHaveCount(12);
  await expect(months.first()).toContainText("0 articles published");
  await expect(months.last()).toContainText("3 articles published");
});

test.describe("touch", () => {
  test.use({ viewport: { width: 320, height: 720 }, hasTouch: true, isMobile: true });

  test("writing history keeps touch tooltips and monthly totals usable at 320px", async ({
    page,
  }) => {
    await page.goto("/#site-record", { waitUntil: "domcontentloaded" });
    const figure = page.getByRole("figure", { name: "A writing history" });
    await figure.scrollIntoViewIfNeeded();
    const chart = figure.getByRole("application", {
      name: "Cumulative published articles by month",
    });
    await chart.tap({ position: { x: 120, y: 110 } });
    await expect(figure.locator('[data-slot="chart-tooltip"]')).toBeVisible();
    await expect(figure.getByRole("status")).toBeEmpty();
    await figure.getByText("Monthly totals", { exact: true }).tap();
    await expect(figure.getByRole("listitem")).toHaveCount(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320
    );
  });
});

for (const width of [390, 1440]) {
  test(`the cadence grid uses a single tab stop at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/v1/public/moments/cadence", (route) =>
      route.fulfill({
        json: {
          code: 200,
          message: "OK",
          data: {
            zone: "UTC",
            day: { start: "2026-11-04T00:00:00Z", active: [0] },
            month: { start: "2026-11-01", days: 30, offset: 3, active: [0] },
            year: { year: 2026, active: [0] },
          },
        },
      })
    );
    await page.goto("/moments?topic=daily", { waitUntil: "domcontentloaded" });
    const cadence = page.getByRole("complementary", { name: "Publishing cadence" });
    if (width < 1024) {
      const disclosure = cadence.getByRole("button", { name: /Publishing cadence/ });
      await expect(disclosure).toContainText("Day");
      await disclosure.click();
      await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    }
    for (const [period, count] of [
      ["Day", 24],
      ["Month", 30],
      ["Year", 48],
    ] as const) {
      const radio = cadence.getByRole("radio", { name: period, exact: true });
      await radio.click();
      const grid = cadence.getByRole("grid", { name: `${period} publishing periods` });
      const cells = grid.getByRole("gridcell");
      await expect(cells).toHaveCount(count);
      await expect(grid.locator('[tabindex="0"]')).toHaveCount(1);
      await page.keyboard.press("Tab");
      await expect(cells.first()).toBeFocused();
      await expect(cells.first()).toHaveAccessibleName(/, published$/);
      await page.keyboard.press("ArrowRight");
      await expect(cells.nth(1)).toBeFocused();
      await expect(cells.nth(1)).toHaveAccessibleName(/, no publication$/);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Topics", exact: true })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(cells.nth(1)).toBeFocused();
    }
  });
}
