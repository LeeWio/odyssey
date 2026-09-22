import { expect, test } from "@playwright/test";

test.describe("about page chrome", () => {
  test("shows section labels and close links on the full page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/about");

    const breadcrumbs = page.getByRole("list", { name: "Breadcrumbs" });
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(page.getByText("About", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lee" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Defaults" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Play" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Taste" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Read writing" })).toHaveAttribute(
      "href",
      "/chronicle"
    );
    await expect(page.getByRole("link", { name: "See tools" })).toHaveAttribute("href", "/uses");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });

  test("keeps compact persona embedding free of page chrome", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/persona");

    await page.getByRole("tab", { name: "About" }).click();

    await expect(page.getByRole("list", { name: "Breadcrumbs" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Lee" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Defaults" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });
});
