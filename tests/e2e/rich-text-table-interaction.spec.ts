import { expect, test } from "@playwright/test";
import type { Editor } from "@tiptap/core";
const textbox = { name: "Rich text editor", exact: true } as const;
test.beforeEach(async ({ page }) => {
  await page.goto("/test/rich-text?table=1");
});

test("keyboard handles expand and shrink rows and columns, and Escape leaves a range", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", textbox);
  await editor.getByRole("cell", { name: "Amy", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cell actions", exact: true })).toBeVisible();
  await editor.press("Alt+F10");
  const row = page.getByRole("button", { name: "Row actions", exact: true });
  await expect(row).toBeFocused();
  await row.press("Shift+ArrowDown");
  await expect(editor.locator(".selectedCell")).toHaveCount(8);
  await expect(page.getByRole("status", { name: "Table status", exact: true })).toContainText(
    "2 rows selected"
  );
  await row.press("Shift+ArrowUp");
  await expect(editor.locator(".selectedCell")).toHaveCount(4);
  await row.press("ArrowRight");
  const col = page.getByRole("button", { name: "Column actions", exact: true });
  await expect(col).toBeFocused();
  // Start a column range from the same anchor instead of carrying a whole-row endpoint.
  await col.press("Shift+ArrowRight");
  await expect(editor.locator(".selectedCell")).toHaveCount(10);
  await col.press("Shift+ArrowLeft");
  await expect(editor.locator(".selectedCell")).toHaveCount(5);
  await col.press("Escape");
  await expect(editor).toBeFocused();
  await editor.press("Escape");
  await expect(editor.locator(".selectedCell")).toHaveCount(0);
  await editor.press("Alt+F10");
  await expect(row).toBeFocused();
  await row.press("ArrowDown");
  await expect(page.getByRole("menu", { name: "Row actions", exact: true })).toBeVisible();
  // Escape may arrive at the body/editor before the overlay transfers focus.
  await page.locator("body").dispatchEvent("keydown", { key: "Escape", bubbles: true });
  await expect(page.getByRole("menu", { name: "Row actions", exact: true })).toHaveCount(0);
  await expect(editor.locator(".selectedCell")).toHaveCount(4);
  await editor.press("Alt+F10");
  await expect(row).toBeFocused();
  await row.press("ArrowDown");
  await expect(page.getByRole("menu", { name: "Row actions", exact: true })).toBeVisible();
  await editor.dispatchEvent("keydown", { key: "Escape", bubbles: true });
  await expect(page.getByRole("menu", { name: "Row actions", exact: true })).toHaveCount(0);
  await expect(editor.locator(".selectedCell")).toHaveCount(4);
  await editor.press("Escape");
  await editor.press("x");
  await expect(editor).toContainText("x");
});

test("native cell navigation, range extension and explicit table exits preserve content", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", textbox);
  await editor.getByRole("cell", { name: "Amy", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cell actions", exact: true })).toBeVisible();
  await editor.press("Tab");
  await page.keyboard.type("Next");
  await expect(editor.getByRole("cell", { name: /Next/ })).toContainText("Next");
  await editor.press("Shift+Tab");
  await page.keyboard.type("Previous");
  await expect(editor.getByRole("cell", { name: /Previous/ })).toContainText("Previous");
  await editor.press("Shift+F10");
  await page.keyboard.press("Escape");
  await editor.press("Shift+ArrowRight");
  await expect(editor.locator(".selectedCell")).toHaveCount(2);
  await editor.press("ControlOrMeta+Enter");
  await expect(editor).toBeFocused();
  await page.keyboard.type("OutsideAfter");
  await expect(editor.locator(":scope > p").last()).toContainText("OutsideAfter");
  await editor.getByRole("cell", { name: /Previous/ }).click();
  await expect
    .poll(() =>
      editor.evaluate(
        (el) =>
          (el as HTMLElement & { editor: Editor }).editor.state.selection.$from.parent.textContent
      )
    )
    .toContain("Previous");
  await editor.press("ControlOrMeta+Shift+Enter");
  await page.keyboard.type("OutsideBefore");
  await expect(editor.locator(":scope > p").first()).toContainText("OutsideBefore");
  await expect(editor.locator("table")).toHaveCount(1);
});

for (const width of [390, 1280])
  test(`resize feedback, no-motion history and double-click reset at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const editor = page.getByRole("textbox", textbox);
    const cell = editor.getByRole("columnheader", { name: "Name", exact: true });
    await cell.click();
    const before = await editor.evaluate((el) =>
      (el as HTMLElement & { editor: Editor }).editor.getJSON()
    );
    let box = (await cell.boundingBox())!;
    const edge = { x: box.x + box.width - 2, y: box.y + box.height - 6 };
    await page.mouse.move(edge.x, edge.y);
    await expect(editor).toHaveClass(/resize-cursor/);
    await page.mouse.click(edge.x, edge.y);
    expect(
      await editor.evaluate((el) => (el as HTMLElement & { editor: Editor }).editor.getJSON())
    ).toEqual(before);
    await page.mouse.move(edge.x, edge.y);
    await page.mouse.down();
    await page.mouse.move(edge.x + 45, edge.y, { steps: 6 });
    const badge = page.locator("[data-table-resize-width]");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("px");
    await page.mouse.up();
    await expect(badge).toHaveCount(0);
    await expect(cell).toHaveAttribute("colwidth", /\d+/);
    await expect(page.getByRole("status", { name: "Table status", exact: true })).toContainText(
      "pixels"
    );
    box = (await cell.boundingBox())!;
    await page.mouse.move(box.x + box.width - 2, box.y + box.height - 6);
    await page.mouse.dblclick(box.x + box.width - 2, box.y + box.height - 6);
    await expect(cell).not.toHaveAttribute("colwidth");
    await expect(page.getByRole("status", { name: "Table status", exact: true })).toContainText(
      "width reset"
    );
    await page.getByRole("button", { name: "Undo action", exact: true }).click();
    await expect(cell).toHaveAttribute("colwidth", /\d+/);
  });

test("fits formatted text within bounds without replacing content or neighboring tracks", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", textbox);
  await editor.evaluate((el) => {
    const ed = (el as HTMLElement & { editor: Editor }).editor;
    const cell = (text: string, header = false) => ({
      type: header ? "tableHeader" : "tableCell",
      attrs: { colwidth: [100] },
      content: [
        { type: "paragraph", content: [{ type: "text", text, marks: [{ type: "bold" }] }] },
      ],
    });
    ed.commands.setContent({
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            { type: "tableRow", content: [cell("Wide label", true), cell("Other", true)] },
            {
              type: "tableRow",
              content: [cell("A substantially longer formatted content sample"), cell("Untouched")],
            },
          ],
        },
      ],
    });
  });
  const header = editor.getByRole("columnheader", { name: "Wide label", exact: true });
  await header.click();
  const before = await editor.evaluate((el) =>
    (el as HTMLElement & { editor: Editor }).editor.getJSON()
  );
  await page.getByRole("button", { name: "Column actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Fit to content", exact: true }).click();
  const fitted = Number(await header.getAttribute("colwidth"));
  expect(fitted).toBeGreaterThan(100);
  expect(fitted).toBeLessThanOrEqual(600);
  await expect(editor.getByRole("columnheader", { name: "Other", exact: true })).toHaveAttribute(
    "colwidth",
    "100"
  );
  await expect(
    editor
      .getByText("A substantially longer formatted content sample", { exact: true })
      .locator("strong")
  ).toHaveCount(0);
  await expect(editor.locator("strong")).toHaveCount(4);
  await page.getByRole("button", { name: "Undo action", exact: true }).click();
  expect(
    await editor.evaluate((el) => (el as HTMLElement & { editor: Editor }).editor.getJSON())
  ).toEqual(before);
  await expect(page.locator("[aria-hidden=true][inert]")).toHaveCount(0);
});

test("cell-local highlight preserves native range semantics and restores ordinary text selection", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", textbox);
  await editor.getByRole("cell", { name: "Amy", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cell actions", exact: true })).toBeVisible();
  await editor.press("Shift+F10");
  await page.keyboard.press("Escape");
  await editor.press("Shift+ArrowRight");
  await expect(editor.locator(".selectedCell")).toHaveCount(2);
  await expect(editor).toHaveAttribute("data-table-cell-selection", "");
  await expect(editor).not.toHaveClass(/ProseMirror-hideselection/);
  const highlight = await editor
    .locator(".selectedCell")
    .first()
    .evaluate((cell) => ({
      cell: getComputedStyle(cell, "::selection").backgroundColor,
      text: getComputedStyle(cell.querySelector("p")!, "::selection").backgroundColor,
      selection: (
        cell.closest(".ProseMirror") as HTMLElement & { editor: Editor }
      ).editor.state.selection.toJSON(),
    }));
  expect(highlight.cell).toBe("rgba(0, 0, 0, 0)");
  expect(highlight.text).toBe("rgba(0, 0, 0, 0)");
  expect(highlight.selection.type).toBe("cell");
  await editor.press("Escape");
  await expect(editor).not.toHaveAttribute("data-table-cell-selection");
  await editor.press("ControlOrMeta+z");
  await expect(editor.locator("table")).toHaveCount(1);
});

test("a document change during native resize cancels its preview without a stale mouseup write", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const editor = page.getByRole("textbox", textbox),
    header = editor.getByRole("columnheader", { name: "Name", exact: true });
  await header.click();
  const box = (await header.boundingBox())!;
  await page.mouse.move(box.x + box.width - 2, box.y + box.height - 6);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 30, box.y + box.height - 6, { steps: 4 });
  await expect(page.locator("[data-table-resize-width]")).toBeVisible();
  await editor.evaluate((el) =>
    (el as HTMLElement & { editor: Editor }).editor.commands.deleteTable()
  );
  await page.mouse.up();
  await expect(page.locator("[data-table-resize-width]")).toHaveCount(0);
  await expect(editor.locator("table")).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.getByRole("button", { name: "Undo action", exact: true }).click();
  await expect(editor.locator("table")).toHaveCount(1);
});
