import { expect, test, type Locator, type Page } from "@playwright/test";
import type { Editor, JSONContent } from "@tiptap/core";

const rows = 24;
const fixture: JSONContent = {
  type: "doc",
  content: [
    {
      type: "table",
      content: Array.from({ length: rows }, (_, row) => ({
        type: "tableRow",
        content: [0, 1].map((column) => ({
          type: row === 0 ? "tableHeader" : "tableCell",
          content: [{ type: "paragraph", content: [{ type: "text", text: `${row}-${column}` }] }],
        })),
      })),
    },
    { type: "paragraph" },
  ],
};
async function start(page: Page, modal: boolean) {
  await page.setViewportSize({ width: modal ? 390 : 900, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/test/rich-text?${modal ? "modal=1" : "table=1"}`);
  if (modal) await page.getByRole("button", { name: "Open editor", exact: true }).click();
  else await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  const editor = page.locator('.ProseMirror[contenteditable="true"]');
  await expect(editor).toBeVisible();
  await editor.evaluate((el, content) => {
    (el as HTMLElement & { editor: Editor }).editor.commands.setContent(content);
  }, fixture);
  const host = page.locator('[data-slot="rich-text-editor-content"]');
  return { editor, table: editor.locator("table"), host };
}
async function json(editor: Locator) {
  return editor.evaluate((el) => (el as HTMLElement & { editor: Editor }).editor.getJSON());
}
async function drag(
  page: Page,
  table: Locator,
  host: Locator,
  action: "select" | "reorder",
  direction: "down" | "up"
) {
  const from = direction === "down" ? 0 : rows - 1;
  const source = table.locator("tr").nth(from).locator("td,th").first();
  await source.click();
  await expect(source).toHaveClass(/table-cell-active/);
  const grip = page.getByRole("button", {
    name: action === "select" ? "Cell actions" : "Row actions",
    exact: true,
  });
  await expect(grip).toBeVisible();
  const box = (await grip.boundingBox())!;
  const viewport = (await host.boundingBox())!;
  const grid = (await table.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    action === "select" ? grid.x + 20 : box.x + box.width / 2,
    direction === "down"
      ? Math.min(800, viewport.y + viewport.height) - 5
      : Math.max(0, viewport.y) + 5,
    { steps: 8 }
  );
}
for (const modal of [false, true]) {
  for (const action of ["select", "reorder"] as const) {
    test(`vertical ${action} scrolls down and up with a stationary pointer in ${modal ? "modal" : "page"}`, async ({
      page,
    }) => {
      const { editor, table, host } = await start(page, modal);
      const before = await json(editor);
      const windowBefore = await page.evaluate(() => scrollY);
      await drag(page, table, host, action, "down");
      await expect
        .poll(
          () =>
            table.evaluate((el) => {
              const host = el.closest('[data-slot="rich-text-editor-content"]')!;
              return (
                el.getBoundingClientRect().bottom -
                Math.min(innerHeight, host.getBoundingClientRect().bottom)
              );
            }),
          {
            timeout: 15000,
          }
        )
        .toBeLessThan(3);
      await page.screenshot({
        path: `/tmp/table-vertical-${modal ? "modal" : "page"}-${action}.png`,
      });
      await page.mouse.up();
      if (action === "select") {
        await expect(table.locator(".selectedCell")).toHaveCount(rows);
        expect(await json(editor)).toEqual(before);
      } else {
        await expect(table.locator("tr").last().locator("td,th").first()).toHaveText("0-0");
        await editor.press("ControlOrMeta+z");
        await expect.poll(() => json(editor)).toEqual(before);
      }
      if (modal) expect(await page.evaluate(() => scrollY)).toBe(windowBefore);
      await drag(page, table, host, action, "up");
      await expect
        .poll(
          () =>
            table.evaluate((el) => {
              const host = el.closest('[data-slot="rich-text-editor-content"]')!;
              return Math.max(0, host.getBoundingClientRect().top) - el.getBoundingClientRect().top;
            }),
          { timeout: 15000 }
        )
        .toBeLessThan(3);
      await page.mouse.up();
      if (action === "select") {
        await expect(table.locator(".selectedCell")).toHaveCount(rows);
        expect(await json(editor)).toEqual(before);
      } else {
        await expect(table.locator("tr").first().locator("td,th").first()).toHaveText(
          `${rows - 1}-0`
        );
        await editor.press("ControlOrMeta+z");
        await expect.poll(() => json(editor)).toEqual(before);
      }
      if (modal) expect(await page.evaluate(() => scrollY)).toBe(windowBefore);
    });
  }
}

for (const cancel of ["Escape", "pointercancel"] as const)
  test(`${cancel} stops the scroll loop and prevents a row reorder`, async ({ page }) => {
    const { editor, table, host } = await start(page, true);
    const before = await json(editor);
    await drag(page, table, host, "reorder", "down");
    await expect.poll(() => host.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
    if (cancel === "Escape") await page.keyboard.press("Escape");
    else await page.locator("[data-table-controls]").dispatchEvent("pointercancel");
    const stopped = await host.evaluate((el) => el.scrollTop);
    // Observe several subsequent animation frames with the pointer held at the edge.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let frames = 12;
          const tick = () => (--frames ? requestAnimationFrame(tick) : resolve());
          requestAnimationFrame(tick);
        })
    );
    expect(await host.evaluate((el) => el.scrollTop)).toBe(stopped);
    await page.mouse.up();
    expect(await json(editor)).toEqual(before);
  });
