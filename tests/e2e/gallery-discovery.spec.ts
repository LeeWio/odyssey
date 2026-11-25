import { expect, test } from "@playwright/test";

test.use({ locale: "en-US" });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("desktop discovery links to available destinations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const explore = page.getByTestId("home-explore-grid");
  await expect(explore.getByRole("link", { name: /^Footprints/ })).toHaveAttribute(
    "href",
    "/footprints"
  );
  await expect(explore.locator('a[href="/gallery"]')).toHaveCount(0);

  const navigation = page.getByRole("navigation", { name: "Primary" });
  await expect(
    navigation.getByRole("button", { name: "Essays & Notes", exact: true })
  ).toBeVisible();
  await expect(navigation.getByRole("button", { name: "Out There", exact: true })).toHaveCount(0);

  await navigation.getByRole("button", { name: /Search, keyboard shortcut/ }).click();
  await expect(page.getByPlaceholder("Find a piece, or go somewhere")).toBeVisible();
  await expect(page.getByText("Browse projects", { exact: true })).toBeVisible();
  await expect(page.getByText("Browse Photo Portfolio", { exact: true })).toHaveCount(0);
});

test("mobile navigation opens Footprints and old gallery URLs still show the status", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  const menu = page.getByRole("dialog", { name: "Site navigation" });
  await expect(menu).toBeVisible();
  await expect(menu.locator('a[href="/gallery"]')).toHaveCount(0);
  await menu.getByRole("link", { name: /^Footprints/ }).click();
  await expect(page).toHaveURL(/\/footprints$/);
  await expect(page.getByRole("heading", { name: "Places I've Been" })).toBeVisible();
  await expect(page.locator('a[href="/gallery"]')).toHaveCount(0);

  await page.goto("/gallery");
  await expect(page.getByText("The gallery is coming later", { exact: true })).toBeVisible();
  await expect(page).toHaveTitle(/The gallery is coming later/);
});

test("the tour leads to Footprints and the Universe tab announces the gallery's status", async ({
  page,
}) => {
  await page.goto("/tour");
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("link", { name: "看足迹" })).toHaveAttribute("href", "/footprints");

  await page.goto("/universe");
  const galleryTab = page.getByRole("tab", { name: "Gallery (coming later)" });
  await expect(page.getByRole("radiogroup", { name: "Color mode" })).toBeAttached();
  await galleryTab.click();
  await expect(galleryTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("The gallery is coming later", { exact: true })).toBeVisible();
});
