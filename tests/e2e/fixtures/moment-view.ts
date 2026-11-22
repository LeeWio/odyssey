import { expect, type Page } from "@playwright/test";

export async function setMomentView(page: Page, mode: "List" | "Grid", showSelector: boolean) {
  const selector = page.getByRole("radiogroup", { name: "Moment view" });
  const view = mode.toLowerCase();
  if (showSelector) {
    await selector.getByRole("radio", { name: mode, exact: true }).click();
  } else {
    await expect(selector).toBeHidden();
    await page.evaluate((value) => {
      const url = new URL(window.location.href);
      url.searchParams.set("view", value);
      window.history.replaceState(null, "", url);
    }, view);
  }
  await expect(page.locator("[data-view]")).toHaveAttribute("data-view", view);
}
