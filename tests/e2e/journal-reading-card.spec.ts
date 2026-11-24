import { expect, test } from "@playwright/test";

test.use({ locale: "en-US" });

test("reading picks switch locally with stable layout and current reading metadata", async ({
  page,
}) => {
  await page.goto("/single");
  const card = page.getByTestId("journal-reading-picks");
  const group = card.getByRole("radiogroup", { name: "Reading picks" });
  const initialWidth = (await card.boundingBox())!.width;
  expect(initialWidth).toBeLessThanOrEqual(448);
  await expect(group.getByRole("radio", { name: "Series" })).toBeChecked();
  await expect(card.getByText("9 chapters")).toBeVisible();
  await expect(card.getByRole("link", { name: "Series contents" })).toHaveAttribute(
    "href",
    "/columns/understanding-max96781"
  );
  await expect(card.getByRole("link", { name: "Start chapter 1" })).toHaveAttribute(
    "href",
    "/single/max96781-automotive-display-overview"
  );

  await page.setViewportSize({ width: 320, height: 844 });
  const initialHeight = (await card.boundingBox())!.height;
  await group.getByRole("radio", { name: "Diagrams" }).click();
  await expect(card.getByText("About 23 minutes")).toBeVisible();
  await expect(card.getByRole("link", { name: "Read the guide" })).toHaveAttribute(
    "href",
    "/single/sa8295p-display-architecture-features"
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  await group.getByRole("radio", { name: "Diagrams" }).focus();
  await page.keyboard.press("ArrowRight");
  const essays = group.getByRole("radio", { name: "Essays" });
  await expect(essays).toBeFocused();
  if (!(await essays.isChecked())) await page.keyboard.press("Space");
  await expect(essays).toBeChecked();
  await expect(card.getByText("About 43 minutes")).toBeVisible();
  await expect(card.getByRole("link", { name: "More essays" })).toHaveAttribute(
    "href",
    "/single/categories/loose-thoughts"
  );
  await expect(card.getByRole("link")).toHaveCount(2);
  await expect(page).toHaveURL(/\/single$/);
  expect((await card.boundingBox())!.height).toBe(initialHeight);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole("searchbox", { name: "Search articles" }).fill("thoughtful");
  await expect(card).toHaveCount(0);
  await expect(page).toHaveURL(/q=thoughtful/);
});
