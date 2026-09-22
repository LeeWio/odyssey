import { expect, test } from "@playwright/test";

test.describe("uses toolkit", () => {
  test("lists tools, filters by category, and exposes official links", async ({ page }) => {
    await page.goto("/uses");

    await expect(page.getByRole("heading", { name: "The tools behind the work." })).toBeVisible();
    await expect(page.getByText("tools on the desk")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coding" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Ghostty" })).toBeVisible();

    await page.getByRole("searchbox", { name: "Search tools" }).fill("hero");
    await expect(page.getByText(/matches$/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Open HeroUI", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open HeroUI Pro", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Ghostty", exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Clear tool search" }).click();
    await expect(page.getByRole("link", { name: "Open Ghostty" })).toBeVisible();

    const categoryFilter = page.getByRole("grid", { name: "Filter tools by category" });
    await categoryFilter.getByRole("row", { name: /Daily/ }).click();
    await expect(page.getByRole("heading", { name: "Daily" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coding" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Open Apple Music" })).toBeVisible();

    await categoryFilter.getByRole("row", { name: /^All/ }).click();
    await expect(page.getByRole("link", { name: "Open Ghostty" })).toHaveAttribute(
      "href",
      "https://ghostty.org/"
    );
  });

  test("keeps the toolkit usable on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/uses");

    await expect(page.getByRole("heading", { name: "The tools behind the work." })).toBeVisible();
    await page.getByRole("searchbox", { name: "Search tools" }).fill("zzzz-no-match");
    await expect(page.getByRole("heading", { name: "No tools match" })).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByRole("heading", { name: "Workspace" })).toBeVisible();
  });
});
