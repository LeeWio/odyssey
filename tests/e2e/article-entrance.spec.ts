import { expect, test } from "@playwright/test";

test("scrolling preserves the reader and does not replay revealed blocks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/api/v1/public/blog/posts/entrance-regression", (route) =>
    route.fulfill({
      json: {
        code: 200,
        message: "OK",
        data: {
          id: 987654,
          slug: "entrance-regression",
          title: "Reader entrance regression",
          contentType: "JSON",
          content: JSON.stringify({
            type: "doc",
            content: Array.from({ length: 80 }, (_, index) => ({
              type: "paragraph",
              content: [{ type: "text", text: `Paragraph ${index + 1}. Read once, reveal once.` }],
            })),
          }),
          status: "PUBLISHED",
          isFeatured: false,
          views: 0,
          likesCount: 0,
          favoritesCount: 0,
          category: null,
          series: null,
          seriesOrder: null,
          createdAt: "2026-09-14T00:00:00Z",
          updatedAt: "2026-09-14T00:00:00Z",
        },
      },
    })
  );

  await page.goto("/single/entrance-regression");
  const editor = page.locator('.ProseMirror[contenteditable="false"]');
  await expect(editor.locator(":scope > p")).toHaveCount(80);
  const originalEditor = await editor.elementHandle();
  if (!originalEditor) throw new Error("Reader was not mounted");

  const first = editor.locator(":scope > p").first();
  const last = editor.locator(":scope > p").last();
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveCSS("opacity", "1");
  await expect(last).toHaveCSS("visibility", "hidden");

  // Keep a record of even brief resets, rather than only checking the final frame.
  const replay = await first.evaluateHandle((block) => {
    const record = { replayed: false };
    const observer = new MutationObserver(() => {
      if (getComputedStyle(block).opacity !== "1") record.replayed = true;
    });
    observer.observe(block, { attributes: true, attributeFilter: ["style"] });
    return { record, observer };
  });

  for (let pass = 0; pass < 2; pass += 1) {
    await last.scrollIntoViewIfNeeded();
    await expect(last).toHaveCSS("opacity", "1");
    await first.scrollIntoViewIfNeeded();
    // The page updates its action bar after scrolling has settled for 700ms.
    await page.waitForTimeout(850);
    expect(await originalEditor.evaluate((node) => node.isConnected)).toBe(true);
    await expect(first).toHaveCSS("opacity", "1");
    expect(await replay.evaluate(({ record }) => record.replayed)).toBe(false);
  }

  await replay.evaluate(({ observer }) => observer.disconnect());
});
