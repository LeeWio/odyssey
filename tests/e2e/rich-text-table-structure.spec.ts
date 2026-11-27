import { expect, test, type Page } from "@playwright/test";
import type { Editor, JSONContent } from "@tiptap/core";

const editorSelector = '.ProseMirror[contenteditable="true"]';
const fixture: JSONContent = {
  type: "doc",
  content: [
    { type: "paragraph" },
    {
      type: "table",
      content: [
        ["Name", "Role"],
        ["B", "Design"],
        ["", "Unassigned"],
        ["A", "First editor"],
        ["A", "Second editor"],
      ].map((row, i) => ({
        type: "tableRow",
        content: row.map((text) => ({
          type: i === 0 ? "tableHeader" : "tableCell",
          content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }],
        })),
      })),
    },
    { type: "paragraph" },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.goto("/test/rich-text");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
});

async function loadTable(page: Page) {
  await page.locator(editorSelector).evaluate((element, content) => {
    (element as HTMLElement & { editor: Editor }).editor.commands.setContent(content);
  }, fixture);
  return page.locator(editorSelector).getByRole("table");
}

async function axisAction(
  page: Page,
  row: number,
  column: number,
  axis: "Row" | "Column",
  name: string
) {
  const table = page.locator(editorSelector).getByRole("table");
  await table.getByRole("row").nth(row).locator("td,th").nth(column).hover();
  await page.getByRole("button", { name: `${axis} actions`, exact: true }).click();
  await page
    .getByRole(name.startsWith("Header") ? "menuitemcheckbox" : "menuitem", { name, exact: true })
    .click();
}

test("sorts stable records and applies row and column actions to the hovered axis", async ({
  page,
}) => {
  const table = await loadTable(page);
  const records = table.locator("tr > :last-child");

  await axisAction(page, 1, 0, "Column", "Sort column A–Z");
  await expect(records).toHaveText([
    "Role",
    "First editor",
    "Second editor",
    "Design",
    "Unassigned",
  ]);
  await axisAction(page, 1, 0, "Column", "Sort column Z–A");
  await expect(records).toHaveText([
    "Role",
    "Design",
    "First editor",
    "Second editor",
    "Unassigned",
  ]);

  await axisAction(page, 1, 0, "Row", "Duplicate row");
  await expect(records).toHaveText([
    "Role",
    "Design",
    "Design",
    "First editor",
    "Second editor",
    "Unassigned",
  ]);
  await axisAction(page, 2, 1, "Row", "Move row down");
  await expect(records).toHaveText([
    "Role",
    "Design",
    "First editor",
    "Design",
    "Second editor",
    "Unassigned",
  ]);

  await axisAction(page, 1, 1, "Column", "Header column");
  await expect(table.getByRole("row").nth(1).locator("td,th").nth(1)).toHaveRole("rowheader");
  await axisAction(page, 1, 1, "Column", "Header column");
  await expect(table.getByRole("row").nth(1).locator("td,th").nth(1)).toHaveRole("cell");
  await expect(table.getByRole("row").first().getByRole("columnheader")).toHaveCount(2);

  await axisAction(page, 1, 1, "Column", "Duplicate column");
  await expect(table.getByRole("row").first().locator("th")).toHaveText(["Name", "Role", "Role"]);
  await axisAction(page, 1, 0, "Column", "Move column right");
  await expect(table.getByRole("row").first().locator("th")).toHaveText(["Role", "Name", "Role"]);
  await expect(table.getByRole("row").nth(1).locator("td")).toHaveText(["Design", "B", "Design"]);
});

test("drags the row grip to move a whole record and can undo the drop", async ({ page }) => {
  const table = await loadTable(page);
  const rows = table.getByRole("row");
  await rows.nth(1).getByRole("cell").first().hover();
  const grip = page.getByRole("button", { name: "Row actions" });
  await expect(grip).toBeVisible();
  await grip.dragTo(rows.nth(3).getByRole("cell").first());
  await expect(table.locator("tr > :last-child")).toHaveText([
    "Role",
    "Unassigned",
    "First editor",
    "Design",
    "Second editor",
  ]);
  await page.keyboard.press("ControlOrMeta+z");
  await expect(table.locator("tr > :last-child")).toHaveText([
    "Role",
    "Design",
    "Unassigned",
    "First editor",
    "Second editor",
  ]);
});

test("inserts the selected table dimensions using arrow keys in the toolbar grid", async ({
  page,
}) => {
  await page.getByTestId("clear-editor").click();
  const editor = page.locator(editorSelector);
  await editor.locator("p").first().click();
  const trigger = page.getByRole("button", { name: "Insert table", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const grid = page.getByRole("grid", { name: "Table size grid" });
  await expect(grid).toBeVisible();
  const first = grid.getByRole("button", { name: "Insert 1 by 1 table" });
  if (!(await first.evaluate((element) => element === document.activeElement)))
    await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(grid.getByRole("button", { name: "Insert 3 by 2 table" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(grid).toBeHidden();
  const rows = editor.getByRole("table").getByRole("row");
  await expect(rows).toHaveCount(2);
  await expect(rows.first().getByRole("columnheader")).toHaveCount(3);
  await expect(rows.nth(1).getByRole("cell")).toHaveCount(3);
});
