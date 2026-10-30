import { expect, test, type Page } from "@playwright/test";

test.use({ locale: "en-US" });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function openArticle(page: Page) {
  await page.goto("/test/rich-text?outline=1");
  await expect(page.locator('.ProseMirror[contenteditable="false"] h2')).toHaveCount(6);
  await expect(page.getByRole("button", { name: "On this page" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "On this page" })).toHaveCount(0);
}

async function openOutline(page: Page) {
  await page.getByRole("button", { name: "On this page" }).click();
  const dialog = page.getByRole("dialog", { name: "On this page" });
  await expect(dialog).toBeVisible();
  return dialog;
}

for (const width of [390, 1280, 1440]) {
  test(`opens the outline from the action bar at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await openArticle(page);
    const editor = page.locator('.ProseMirror[contenteditable="false"]');
    const bodyTop = await editor.evaluate(
      (element) => element.getBoundingClientRect().top + scrollY
    );
    await page.evaluate((top) => window.scrollTo(0, top), bodyTop + 1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    const list = await openOutline(page);
    const target = editor.getByRole("heading", { name: "Section 4", exact: true });
    await list.getByRole("button", { name: "Section 4", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "On this page" })).toBeHidden();
    await expect
      .poll(() => target.evaluate((element) => Math.round(element.getBoundingClientRect().top)))
      .toBe(112);
    await expect(target).toBeFocused();
    const id = await target.getAttribute("data-toc-id");
    expect(new URL(page.url()).hash).toBe(`#${id}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({ path: testInfo.outputPath(`article-toc-${width}.png`) });
  });
}
