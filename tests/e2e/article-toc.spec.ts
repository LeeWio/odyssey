import { expect, test, type Page } from "@playwright/test";

test.use({ locale: "en-US" });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function openArticle(page: Page) {
  await page.goto("/test/rich-text?outline=1");
  await expect(page.locator('.ProseMirror[contenteditable="false"] h2')).toHaveCount(6);
  await expect(page.getByRole("listbox", { name: "On this page" })).toBeVisible();
}

for (const width of [1280, 1440]) {
  test(`keeps the outline on the right while reading at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await openArticle(page);
    const rail = page.locator("#article-toc-rail");
    const editor = page.locator('.ProseMirror[contenteditable="false"]');
    const bodyTop = await editor.evaluate(
      (element) => element.getBoundingClientRect().top + scrollY
    );
    for (const offset of [400, 1500, 3000]) {
      await page.evaluate((top) => window.scrollTo(0, top), bodyTop + offset);
      await expect
        .poll(() => rail.evaluate((element) => Math.round(element.getBoundingClientRect().top)))
        .toBe(112);
      const bounds = await rail.boundingBox();
      const body = await editor.boundingBox();
      expect(bounds!.x).toBeGreaterThan(body!.x + body!.width);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
    }
    const target = editor.getByRole("heading", { name: "Section 4", exact: true });
    await rail.getByRole("option", { name: "Section 4", exact: true }).click();
    await expect
      .poll(() => target.evaluate((element) => Math.round(element.getBoundingClientRect().top)))
      .toBe(112);
    await expect(target).toBeFocused();
    await expect(rail.getByRole("option", { name: "Section 4", exact: true })).toHaveClass(
      /bg-default/
    );
    const id = await target.getAttribute("data-toc-id");
    expect(new URL(page.url()).hash).toBe(`#${id}`);
    await page.screenshot({ path: testInfo.outputPath(`article-toc-${width}.png`) });
  });
}

test("moves the outline between the inline and desktop rail layouts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openArticle(page);
  const rail = page.locator("#article-toc-rail");
  for (const width of [390, 1024, 1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const list = page.getByRole("listbox", { name: "On this page" });
    await expect(list).toBeVisible();
    await expect(rail.getByRole("listbox")).toHaveCount(width >= 1280 ? 1 : 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  }
});
