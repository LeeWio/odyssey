import { expect, test } from "@playwright/test";
import type { Editor } from "@tiptap/core";

const editorName = { name: "Rich text editor", exact: true } as const;

test("header toggles use the native hover background without an indicator or shifted icon", async ({
  page,
}) => {
  await page.goto("/test/rich-text?table=1");
  const editor = page.getByRole("textbox", editorName);
  await editor.getByRole("columnheader", { name: "Name", exact: true }).click();
  const column = page.getByRole("button", { name: "Column actions", exact: true });
  await column.click();
  const header = page.getByRole("menuitemcheckbox", { name: "Header column", exact: true });
  await header.click();
  await column.click();
  await expect(header).toHaveAttribute("aria-checked", "true");
  await expect(header.locator('[data-slot="menu-item-indicator"]')).toHaveCount(0);
  const normal = page.getByRole("menuitem", { name: "Move column right", exact: true });
  await expect(page.locator('[data-slot="dropdown-popover"]:visible')).not.toHaveAttribute(
    "data-entering",
    "true"
  );
  const a = (await header.locator("svg").boundingBox())!;
  const b = (await normal.locator("svg").boundingBox())!;
  expect(Math.abs(a.x - b.x)).toBeLessThan(0.5);
  await normal.hover();
  const hover = await normal.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(hover).not.toBe("rgba(0, 0, 0, 0)");
  await expect(header).toHaveCSS("background-color", hover);
  await page.keyboard.press("Escape");
  await editor.getByRole("columnheader", { name: "Role", exact: true }).click();
  await page.getByRole("button", { name: "Row actions", exact: true }).click();
  const row = page.getByRole("menuitemcheckbox", { name: "Header row", exact: true });
  await expect(row).toHaveAttribute("aria-checked", "true");
  await expect(row.locator(".menu-item__indicator")).toHaveCount(0);
});

test("rejected spreadsheet paste keeps content and gives persistent accessible feedback", async ({
  page,
}) => {
  await page.goto("/test/rich-text?table=1");
  const editor = page.getByRole("textbox", editorName);
  await editor.getByRole("cell", { name: "Amy", exact: true }).click();
  const before = await editor.evaluate((el) =>
    (el as HTMLElement & { editor: Editor }).editor.getJSON()
  );
  await editor.evaluate((el) => {
    const data = new DataTransfer();
    data.setData("text/plain", "x\t".repeat(10_001));
    el.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data })
    );
  });
  const status = page.getByRole("status", { name: "Table status", exact: true });
  await expect(status).toBeVisible();
  await expect(status).toContainText("at most 10,000 cells");
  expect(
    await editor.evaluate((el) => (el as HTMLElement & { editor: Editor }).editor.getJSON())
  ).toEqual(before);
  await editor.press("Shift+F10");
  await expect(status).toContainText("at most 10,000 cells");
  await page.keyboard.press("Escape");
  await editor.evaluate((el) => {
    const data = new DataTransfer();
    data.setData("text/plain", '"unfinished\tfield');
    el.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data })
    );
  });
  await expect(status).toContainText("Check the quoted fields");
  await editor.evaluate((el) => {
    const data = new DataTransfer();
    data.setData("text/plain", "Updated\tValue");
    el.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data })
    );
  });
  await expect(editor.getByText("Updated", { exact: true })).toBeVisible();
  await expect(status).not.toContainText("not inserted");
});

for (const width of [390, 1280]) {
  test(`column widths persist, announce and undo through native menus at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/test/rich-text?table=1");
    const editor = page.getByRole("textbox", editorName);
    await editor.evaluate((el) => {
      const ed = (el as HTMLElement & { editor: Editor }).editor;
      const cell = (name: string, colwidth: number[], header = false, colspan = 1) => ({
        type: header ? "tableHeader" : "tableCell",
        attrs: { colwidth, colspan },
        content: [{ type: "paragraph", content: [{ type: "text", text: name }] }],
      });
      ed.commands.setContent({
        type: "doc",
        content: [
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [cell("Group", [110, 190], true, 2), cell("Other", [230], true)],
              },
              { type: "tableRow", content: [cell("A", [110]), cell("B", [190]), cell("C", [230])] },
            ],
          },
        ],
      });
    });
    const group = editor.getByRole("columnheader", { name: "Group", exact: true });
    await group.click();
    await page.getByRole("button", { name: "Column actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Distribute columns evenly", exact: true }).click();
    const status = page.getByRole("status", { name: "Table status", exact: true });
    await expect(status).toHaveText("Selected columns distributed evenly.");
    const widths = await group.getAttribute("colwidth");
    const tracks = widths!.split(",").map(Number);
    expect(Math.abs(tracks[0] - tracks[1])).toBeLessThanOrEqual(1);
    expect(tracks.every((w) => w >= 100)).toBe(true);
    await expect(editor.getByRole("columnheader", { name: "Other", exact: true })).toHaveAttribute(
      "colwidth",
      "230"
    );
    await page.getByRole("button", { name: "Undo action", exact: true }).click();
    await expect(group).toHaveAttribute("colwidth", "110,190");
    await page.getByRole("button", { name: "Redo action", exact: true }).click();
    await expect(group).toHaveAttribute("colwidth", widths!);
    await group.click();
    await page.getByRole("button", { name: "Column actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Reset column widths", exact: true }).click();
    await expect(group).not.toHaveAttribute("colwidth");
    await expect(status).toHaveText("Selected column widths reset.");
    await expect(editor.getByRole("columnheader", { name: "Other", exact: true })).toHaveAttribute(
      "colwidth",
      "230"
    );
    await page.getByRole("button", { name: "Undo action", exact: true }).click();
    await expect(group).toHaveAttribute("colwidth", widths!);
  });
}

test("keyboard row selection is announced and Escape returns to the selected range", async ({
  page,
}) => {
  await page.goto("/test/rich-text?table=1");
  const editor = page.getByRole("textbox", editorName);
  await editor.getByRole("cell", { name: "Amy", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cell actions", exact: true })).toBeVisible();
  await editor.press("Alt+F10");
  const row = page.getByRole("button", { name: "Row actions", exact: true });
  await expect(row).toBeFocused();
  await row.press("Enter");
  await expect(page.getByRole("status", { name: "Table status", exact: true })).toContainText(
    "1 row selected, rows 2 to 2"
  );
  await page.keyboard.press("Escape");
  await expect(editor).toBeFocused();
  await expect(editor.locator(".selectedCell")).toHaveCount(4);
  await expect(editor.locator("table")).not.toHaveAttribute("role", "grid");
});

test("two editors isolate menu Escape, selection and rejected-paste feedback", async ({ page }) => {
  await page.goto("/test/rich-text?multiple=1");
  const first = page.getByRole("region", { name: "First editor", exact: true });
  const second = page.getByRole("region", { name: "Second editor", exact: true });
  const a = first.getByRole("textbox", editorName);
  const b = second.getByRole("textbox", editorName);
  await a.getByRole("cell", { name: "Amy", exact: true }).click();
  await expect(first.getByRole("status", { name: "Table status", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Cell actions", exact: true })).toBeVisible();
  await a.press("Shift+F10");
  await page.getByRole("menuitem", { name: "Alignment", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("menu", { name: "Alignment", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: "Cell actions", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(a).toBeFocused();
  await a.evaluate((el) => {
    const data = new DataTransfer();
    data.setData("text/plain", '"bad\tfield');
    el.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data })
    );
  });
  await expect(first.getByRole("status", { name: "Table status", exact: true })).toContainText(
    "not inserted"
  );
  await expect(second.getByRole("status", { name: "Table status", exact: true })).toBeEmpty();
  await b.getByRole("cell", { name: "Bo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cell actions", exact: true })).toBeVisible();
  await b.press("Shift+F10");
  await page.keyboard.press("Escape");
  await expect(b).toBeFocused();
  await expect(first.getByRole("status", { name: "Table status", exact: true })).toContainText(
    "not inserted"
  );
});
