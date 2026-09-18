import type { JSONContent } from "@tiptap/core";
import { RICH_TEXT_DOCUMENT_FIXTURE } from "../../components/rich-text/testing/rich-text-document.fixture";
import { expect, test, type Page } from "@playwright/test";

const paragraphs = Array.from({ length: 80 }, (_, index) => ({
  type: "paragraph",
  content: [{ type: "text", text: `Paragraph ${index + 1}. Read once, reveal once.` }],
}));

async function openArticle(page: Page, content: JSONContent[] = paragraphs) {
  await page.route("**/api/v1/public/blog/posts/entrance-regression/related**", (route) =>
    route.fulfill({ json: { code: 200, message: "OK", data: [] } })
  );
  await page.route("**/api/v1/public/blog/posts/featured**", (route) =>
    route.fulfill({
      json: {
        code: 200,
        message: "OK",
        data: { list: [], total: 0, page: 0, size: 5, totalPages: 0 },
      },
    })
  );
  await page.route("**/api/v1/public/blog/posts/entrance-regression", (route) => {
    if (route.request().url().includes("/related")) {
      return route.fallback();
    }
    return route.fulfill({
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
            content,
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
    });
  });

  await page.goto("/single/entrance-regression");
  await expect(page.locator('.ProseMirror[contenteditable="false"]')).toBeVisible({
    timeout: 30_000,
  });
}

test("scrolling preserves the reader and does not replay revealed blocks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openArticle(page);
  const editor = page.locator('.ProseMirror[contenteditable="false"]');
  await expect(editor.locator(":scope > p")).toHaveCount(80);
  const originalEditor = await editor.elementHandle();
  if (!originalEditor) throw new Error("Reader was not mounted");

  const first = editor.locator(":scope > p").first();
  const last = editor.locator(":scope > p").last();
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveCSS("opacity", "1");
  await expect(last).toHaveCSS("opacity", "0");

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

test("nested reading units wait for the viewport without animating parent and child together", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const fixture = RICH_TEXT_DOCUMENT_FIXTURE.content!.filter((node) =>
    ["bulletList", "taskList", "table", "columns", "details", "image"].includes(node.type!)
  );
  await openArticle(page, [...paragraphs, ...fixture, ...paragraphs]);
  const editor = page.locator('.ProseMirror[contenteditable="false"]');
  const row = editor.locator("tr").first();
  const listItem = editor.locator("ul:not(.odyssey-task-list) > li").first();
  const task = editor.locator("li.node-taskItem").first();
  const columnParagraph = editor.locator('[data-type="column"] p').first();
  const details = editor.locator(".odyssey-details");
  const image = editor.locator(".react-renderer.node-image");

  for (const target of [listItem, task, row, columnParagraph, details, image]) {
    await expect(target).toHaveCSS("opacity", "0");
  }
  await expect(editor.locator(".tableWrapper")).toHaveCSS("opacity", "1");
  await expect(row.locator("p")).toHaveCSS("opacity", "1");
  await expect(listItem.locator("p")).toHaveCSS("opacity", "1");

  for (const target of [listItem, task, row, columnParagraph, details, image]) {
    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveCSS("opacity", "1");
    await expect(target).toHaveCSS("transform", "none");
  }
});

test("reduced motion reveals pending content immediately and never re-hides it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openArticle(page);
  const last = page.locator(".ProseMirror > p").last();
  await expect(last).toHaveCSS("opacity", "0");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(last).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveCSS("opacity", "1");

  await page.emulateMedia({ reducedMotion: "reduce" });
  // Prefer goto over reload so client mocks stay authoritative under CI load.
  await page.goto("/single/entrance-regression");
  await expect(page.locator('.ProseMirror[contenteditable="false"]')).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(".ProseMirror > p").last()).toHaveCSS("opacity", "1");
});

test("a block taller than the viewport still reveals on entry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openArticle(page, [
    ...paragraphs,
    {
      type: "codeBlock",
      content: [{ type: "text", text: "A very long code block\n".repeat(1500) }],
    },
  ]);
  const block = page.locator(".ProseMirror > pre");
  await expect(block).toHaveCSS("opacity", "0");
  await block.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect(block).toHaveCSS("opacity", "1");
});
