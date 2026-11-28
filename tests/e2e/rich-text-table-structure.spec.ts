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

const wideFixture: JSONContent = {
  type: "doc",
  content: [
    {
      type: "table",
      content: [0, 1].map((row) => ({
        type: "tableRow",
        content: Array.from({ length: 8 }, (_, column) => ({
          type: row === 0 ? "tableHeader" : "tableCell",
          attrs: { colwidth: [144] },
          content: [{ type: "paragraph", content: [{ type: "text", text: `${row}-${column}` }] }],
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

async function loadTable(page: Page, content = fixture) {
  await page.locator(editorSelector).evaluate((element, content) => {
    (element as HTMLElement & { editor: Editor }).editor.commands.setContent(content);
  }, content);
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

test("keeps the selection on one table while the grips follow a second table", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  const source = fixture.content![1];
  const tables = await loadTable(page, {
    ...fixture,
    content: [source, { type: "paragraph" }, source, { type: "paragraph" }],
  });
  const first = tables.first();
  const second = tables.last();
  const header = (await first.getByRole("columnheader", { name: "Name" }).boundingBox())!;
  const next = (await first.getByRole("columnheader", { name: "Role" }).boundingBox())!;
  await page.mouse.move(header.x + header.width / 2, header.y + header.height / 2);
  await page.mouse.down();
  await page.mouse.move(next.x + next.width / 2, next.y + next.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(first.locator(".selectedCell")).toHaveCount(2);

  const hovered = second.getByRole("columnheader", { name: "Name" });
  await hovered.hover();
  const rowGrip = page.getByRole("button", { name: "Row actions", exact: true });
  const cellGrip = page.getByRole("button", { name: "Cell actions", exact: true });
  const outline = page.locator("[data-table-selection-outline]");
  await expect(outline).toBeVisible();
  await expect(cellGrip).toBeVisible();
  await expect(rowGrip).toBeVisible();
  const firstBounds = (await first.boundingBox())!;
  const secondBounds = (await second.boundingBox())!;
  await expect
    .poll(async () => (await rowGrip.boundingBox())?.y)
    .toBeGreaterThanOrEqual(secondBounds.y - 1);
  expect((await cellGrip.boundingBox())!.y).toBeLessThan(firstBounds.y + firstBounds.height);

  await rowGrip.click();
  const rowMenu = page.getByRole("menu", { name: "Row actions", exact: true });
  await expect(rowMenu).toBeVisible();
  await expect(page.getByRole("button", { name: "Column actions", exact: true })).toBeHidden();
  await expect(page.getByRole("button", { name: "Add row below table" })).toBeHidden();
  await expect(rowMenu.getByRole("menuitem", { name: "Move row up", exact: true })).toHaveCount(0);
  await expect(rowMenu.getByRole("menuitem", { name: "Move row down", exact: true })).toBeEnabled();
  await expect(first.locator(".selectedCell")).toHaveCount(0);
  await expect(second.locator(".selectedCell")).toHaveCount(2);
});

for (const action of ["select", "reorder"] as const) {
  test(`scrolls the table while dragging to ${action} columns outside the viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 520, height: 800 });
    const table = await loadTable(page, wideFixture);
    const wrapper = page.locator(`${editorSelector} .tableWrapper`);
    const first = table.getByRole("columnheader", { name: "0-0", exact: true });
    await first.click();
    const grip = page.getByRole("button", {
      name: action === "select" ? "Cell actions" : "Column actions",
      exact: true,
    });
    await expect(grip).toBeVisible();
    const start = (await grip.boundingBox())!;
    const viewport = (await wrapper.boundingBox())!;
    const header = (await first.boundingBox())!;
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(viewport.x + viewport.width - 6, header.y + header.height / 2, {
      steps: 10,
    });
    await expect
      .poll(() => wrapper.evaluate((el) => el.scrollWidth - el.clientWidth - el.scrollLeft))
      .toBeLessThan(2);
    await page.mouse.up();

    if (action === "select") {
      await expect(table.locator(".selectedCell")).toHaveCount(8);
      await expect(table.getByRole("columnheader").first()).toHaveText("0-0");
    } else {
      await expect(table.getByRole("columnheader").last()).toHaveText("0-0");
      await page.keyboard.press("ControlOrMeta+z");
      await expect(table.getByRole("columnheader").first()).toHaveText("0-0");
    }
  });
}

test("resizes the last column and uses both quick-insert controls in a scrolled table", async ({
  page,
}) => {
  await page.setViewportSize({ width: 520, height: 800 });
  const table = await loadTable(page, wideFixture);
  const editor = page.locator(editorSelector);
  const wrapper = editor.locator(".tableWrapper");
  await wrapper.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  const last = table.getByRole("columnheader", { name: "0-7", exact: true });
  const bounds = (await last.boundingBox())!;
  const pointer = { x: bounds.x + bounds.width - 2, y: bounds.y + bounds.height / 2 };
  await page.mouse.move(pointer.x, pointer.y);
  await expect(editor).toHaveClass(/resize-cursor/);
  await page.mouse.down();
  await page.mouse.move(pointer.x + 28, pointer.y, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => (await last.boundingBox())!.width)
    .toBeGreaterThan(bounds.width + 20);

  await wrapper.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await last.hover();
  await page.getByRole("button", { name: "Add column to right of table" }).click();
  await expect(table.getByRole("row").first().locator("th,td")).toHaveCount(9);
  await last.hover();
  await page.getByRole("button", { name: "Add row below table" }).click();
  await expect(table.getByRole("row")).toHaveCount(3);
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

test("draws the active and merged selection on the grid boundary", async ({ page }) => {
  const table = await loadTable(page);
  const cell = table.locator("tr").nth(1).locator("td").last();
  await cell.click();
  const outline = page.locator("[data-table-selection-outline]");
  await expect(outline).toBeVisible();
  await expect
    .poll(async () => {
      const border = (await outline.boundingBox())!;
      const grid = (await cell.boundingBox())!;
      return Math.abs(border.x + 1 - grid.x);
    })
    .toBeLessThan(0.1);
  expect(await cell.evaluate((el) => getComputedStyle(el, "::before").content)).toBe("none");
  await page.keyboard.press("Shift+F10");
  await expect(outline).toBeVisible();
  await page.keyboard.press("Escape");

  const from = (await table.locator("th").first().boundingBox())!;
  const to = (await table.locator("th").last().boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Cell actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Merge cells", exact: true }).click();
  await expect(table.locator("th")).toHaveCount(1);
  await expect(table.locator("th")).toHaveAttribute("colspan", "2");
  await expect(outline).toBeVisible();
  const corner = await outline.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  const radius = await table.evaluate(
    (el) => getComputedStyle(el.closest(".tableWrapper")!).borderTopLeftRadius
  );
  expect(corner).toBe(radius);
  expect(await outline.evaluate((el) => getComputedStyle(el).borderBottomLeftRadius)).toBe("0px");
});

test("clips the real selected band instead of drawing an edge at the scroll boundary", async ({
  page,
}) => {
  await page.setViewportSize({ width: 520, height: 800 });
  const table = await loadTable(page, wideFixture);
  await table.locator("th").first().click();
  await page.getByRole("button", { name: "Row actions", exact: true }).click();
  await expect(page.getByRole("menu", { name: "Row actions", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  const outline = page.locator("[data-table-selection-outline]");
  await expect(outline).toBeVisible();
  const wrapper = page.locator(`${editorSelector} .tableWrapper`);
  await wrapper.evaluate((el) => {
    el.scrollLeft = 200;
  });
  await expect
    .poll(async () => {
      const border = (await outline.boundingBox())!;
      const viewport = (await wrapper.boundingBox())!;
      return viewport.x - border.x;
    })
    .toBeGreaterThan(190);
  const border = (await outline.boundingBox())!;
  const viewport = (await wrapper.boundingBox())!;
  expect(border.x + border.width).toBeGreaterThan(viewport.x + viewport.width + 100);
  await expect(page.locator("[data-table-selection-clip]")).toHaveCSS("overflow", "hidden");
  await expect(page.getByRole("button", { name: "Cell actions", exact: true })).toBeVisible();
});

test("positions column controls inside a merged header with unequal saved widths", async ({
  page,
}) => {
  const widths = [130, 210, 160];
  const table = await loadTable(page, {
    type: "doc",
    content: [
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              {
                type: "tableHeader",
                attrs: { colspan: 3, colwidth: widths },
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Merged header" }] },
                ],
              },
            ],
          },
          {
            type: "tableRow",
            content: widths.map((width, index) => ({
              type: "tableCell",
              attrs: { colwidth: [width] },
              content: [
                { type: "paragraph", content: [{ type: "text", text: `Column ${index}` }] },
              ],
            })),
          },
        ],
      },
      { type: "paragraph" },
    ],
  });
  const second = table.locator("td").nth(1);
  const track = (await second.boundingBox())!;
  const header = (await table.locator("th").boundingBox())!;
  await page.mouse.move(track.x + track.width / 2, header.y + header.height / 2);
  const grip = page.getByRole("button", { name: "Column actions", exact: true });
  await expect(grip).toBeVisible();
  await expect.poll(async () => Math.abs((await grip.boundingBox())!.x - track.x)).toBeLessThan(1);
  expect(Math.abs((await grip.boundingBox())!.width - track.width)).toBeLessThan(1);
  await table.locator("th").click();
  const outline = page.locator("[data-table-selection-outline]");
  await expect(outline).toBeVisible();
  expect((await outline.boundingBox())!.width).toBeGreaterThanOrEqual(header.width);
});
