import { expect, test, type Locator, type Page } from "@playwright/test";
import type { Editor } from "@tiptap/core";

import { RICH_TEXT_TABLE_FIXTURE } from "../../components/rich-text/testing/rich-text-table.fixture";

async function setFixture(page: Page, query = "") {
  await page.goto(`/test/rich-text${query || "?table=1"}`);
  if (query.includes("modal")) await page.getByRole("button", { name: "Open editor" }).click();
  const editor = page.locator(".ProseMirror[contenteditable=true]");
  if (query.includes("modal")) {
    await editor.evaluate((element, doc) => {
      (element as HTMLElement & { editor: Editor }).editor.commands.setContent(doc);
    }, RICH_TEXT_TABLE_FIXTURE);
  }
  return editor;
}

async function dragToCell(page: Page, from: Locator, to: Locator) {
  await from.scrollIntoViewIfNeeded();
  const first = (await from.boundingBox())!;
  const last = (await to.boundingBox())!;
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2, { steps: 14 });
  await page.mouse.up();
}

test("clears a column, merges adjacent headers and centers just the dragged cells @smoke", async ({
  page,
}) => {
  const editor = await setFixture(page);
  const rows = editor.locator("tr");
  const cell = (row: number, col: number) => rows.nth(row).locator("td,th").nth(col);
  const header = cell(0, 0);
  await cell(1, 1).click();
  await header.hover();
  await expect(cell(1, 1)).toHaveClass(/table-cell-active/);
  await expect(header).not.toHaveClass(/table-cell-active/);
  await page.getByRole("button", { name: "Column actions", exact: true }).click();
  const menu = page.getByRole("menu", { name: /^(Column|Cell) actions$/ });
  await menu.getByRole("menuitem", { name: "Clear column contents" }).click();
  await expect(rows).toHaveCount(5);
  await expect(rows.first().locator("th")).toHaveCount(4);
  for (let i = 0; i < 5; i++) await expect(cell(i, 0)).toHaveText("");
  await expect(cell(1, 1)).toHaveText("Senior Developer");

  await dragToCell(page, header, cell(0, 1));
  await expect(editor.locator(".selectedCell")).toHaveCount(2);
  await expect(page.getByRole("toolbar", { name: "Selection formatting toolbar" })).toBeHidden();
  await page.getByRole("button", { name: "Cell actions", exact: true }).click();
  await menu.getByRole("menuitem", { name: "Merge cells" }).click();
  await expect(header).toHaveAttribute("colspan", "2");
  await expect(header).toHaveText("Role");

  await page.getByRole("button", { name: "Cell actions", exact: true }).click();
  await menu.getByRole("menuitem", { name: "Split cell" }).click();
  await expect(rows.first().locator("th")).toHaveCount(4);
  await editor.press("ControlOrMeta+z");
  await expect(header).toHaveAttribute("colspan", "2");

  await dragToCell(page, cell(1, 1), cell(2, 1));
  await expect(editor.locator(".selectedCell")).toHaveCount(2);
  await page.getByRole("button", { name: "Cell actions", exact: true }).click();
  await menu.getByRole("menuitem", { name: "Alignment", exact: true }).hover();
  await page.getByRole("menuitemradio", { name: "Align center", exact: true }).click();
  await expect(cell(1, 1)).toHaveCSS("text-align", "center");
  await expect(cell(2, 1)).toHaveCSS("text-align", "center");
  await expect(cell(2, 1).locator("p")).toHaveCSS("text-align", "center");
  await expect(cell(3, 1)).not.toHaveCSS("text-align", "center");
  await expect(cell(2, 2)).not.toHaveCSS("text-align", "center");
  await page.getByTestId("save-draft").click();
  await expect(page.getByTestId("draft-status")).toHaveText("Draft saved");
  await page.reload();
  await expect(header).toHaveAttribute("colspan", "2");
  await expect(cell(2, 1)).toHaveCSS("text-align", "center");
  await expect(cell(3, 1)).not.toHaveCSS("text-align", "center");
});

test("uses the modal cell menu from the keyboard and formats the chosen header", async ({
  page,
}) => {
  const editor = await setFixture(page, "?modal=1");
  const header = editor.getByRole("columnheader", { name: "Role" });
  await header.click();
  await expect(header).toHaveClass(/table-cell-active/);
  await editor.press("Shift+F10");
  const menu = page.getByRole("menu", { name: /^(Column|Cell) actions$/ });
  await expect(menu).toBeVisible();
  await menu.getByRole("menuitem", { name: "Color", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  const color = page.getByRole("menuitemradio", { name: "Blue background", exact: true });
  await expect(color).toBeVisible();
  await expect
    .poll(() => color.evaluate((element) => !!element.closest("[data-slot=modal-container]")))
    .toBe(true);
  await color.click();
  await expect(header).toHaveCSS("background-color", "rgb(191, 219, 254)");
  await expect(editor.getByRole("columnheader", { name: "Name" })).not.toHaveCSS(
    "background-color",
    "rgb(191, 219, 254)"
  );
  await expect(editor).toBeFocused();
  await page.keyboard.press("Shift+F10");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("dialog", { name: "Create article" })).toBeVisible();
});

test("cell colors and vertical alignment survive the switch to the article reader", async ({
  page,
}) => {
  const editor = await setFixture(page);
  const cell = editor.getByRole("cell", { name: "UX Designer" });
  await cell.click();
  await expect(cell).toHaveClass(/table-cell-active/);
  await editor.press("Shift+F10");
  await page.getByRole("menuitem", { name: "Color", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Purple text", exact: true }).click();
  await expect(cell.locator("p")).toHaveCSS("color", "rgb(131, 89, 175)");
  await editor.press("Shift+F10");
  await page.getByRole("menuitem", { name: "Alignment", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Align bottom", exact: true }).click();
  await page.getByTestId("toggle-reading").click();
  const readCell = page
    .locator(".ProseMirror[contenteditable=false]")
    .getByRole("cell", { name: "UX Designer" });
  await expect(readCell).toHaveCSS("vertical-align", "bottom");
  await expect(readCell.locator("p")).toHaveCSS("color", "rgb(131, 89, 175)");
  await expect(page.getByRole("button", { name: "Cell actions", exact: true })).toHaveCount(0);
});
