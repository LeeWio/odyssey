import { expect, test, type Locator } from "@playwright/test";
import type { Editor } from "@tiptap/core";

async function paste(editor: Locator, text: string, html = "") {
  await editor.evaluate(
    (element, { text, html }) => {
      const data = new DataTransfer();
      data.setData("text/plain", text);
      if (html) data.setData("text/html", html);
      element.dispatchEvent(
        new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true })
      );
    },
    { text, html }
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/test/rich-text?table=1");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
});

test("pastes and copies a spreadsheet grid and undoes it in one step @smoke", async ({ page }) => {
  const editor = page.getByRole("textbox", { name: "Rich text editor", exact: true });
  await editor.getByRole("cell", { name: "Amy", exact: true }).click();
  await paste(editor, 'Alpha\t"Beta\nsecond line"\r\nGamma\tDelta\r\n');
  await expect(editor.locator(".selectedCell")).toHaveCount(4);
  const rows = editor.locator("tr");
  await expect(rows.nth(1).locator("td").nth(0)).toHaveText("Alpha");
  await expect(rows.nth(1).locator("td").nth(1).locator("p")).toHaveText(["Beta", "second line"]);
  await expect(rows.nth(2).locator("td").nth(0)).toHaveText("Gamma");
  await expect(rows.nth(2).locator("td").nth(1)).toHaveText("Delta");
  await expect(rows.nth(2).locator("td").nth(2)).toHaveText("Product");
  const copied = await editor.evaluate((el) => {
    const instance = (el as HTMLElement & { editor: Editor }).editor;
    const serialized = instance.view.serializeForClipboard(instance.state.selection.content());
    return { text: serialized.text, html: serialized.dom.innerHTML };
  });
  expect(copied.text).toBe('Alpha\t"Beta\nsecond line"\nGamma\tDelta');
  expect(copied.html).toContain("<table");
  await editor.press("ControlOrMeta+z");
  await expect(rows.nth(1).locator("td").nth(0)).toHaveText("Amy");
  await expect(rows.nth(2).locator("td").nth(1)).toHaveText("Product Manager");
});

test("expands a partial range to two rows and duplicates both records", async ({ page }) => {
  const editor = page.getByRole("textbox", { name: "Rich text editor", exact: true });
  await editor.getByRole("cell", { name: "Amy", exact: true }).click();
  await editor
    .getByRole("cell", { name: "Product Manager", exact: true })
    .click({ modifiers: ["Shift"] });
  await expect(editor.locator(".selectedCell")).toHaveCount(4);
  await page.getByRole("button", { name: "Row actions", exact: true }).click();
  await expect(editor.locator(".selectedCell")).toHaveCount(8);
  const header = page.getByRole("menuitemcheckbox", { name: "Header rows", exact: true });
  await expect(header).toHaveAttribute("aria-checked", "false");
  await expect(header.locator('[data-slot="menu-item-indicator--checkmark"]')).toHaveCount(0);
  await page.getByRole("menuitem", { name: "Duplicate 2 rows", exact: true }).click();
  await expect(editor.locator("tr")).toHaveCount(7);
  await expect(editor.locator("tr > :first-child")).toHaveText([
    "Name",
    "Amy",
    "Bo",
    "Amy",
    "Bo",
    "Cy",
    "Dan",
  ]);
  await editor.press("ControlOrMeta+z");
  await expect(editor.locator("tr")).toHaveCount(5);
});

test("Shift-click extends and shrinks the row bands without losing the anchor", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", { name: "Rich text editor", exact: true });
  const rowGrip = page.getByRole("button", { name: "Row actions", exact: true });
  await editor.getByRole("cell", { name: "Cy", exact: true }).click();
  await rowGrip.click();
  await page.keyboard.press("Escape");
  await editor.getByRole("cell", { name: "Amy", exact: true }).hover();
  await rowGrip.click({ modifiers: ["Shift"] });
  await expect(page.getByRole("menuitem", { name: "Delete 3 rows", exact: true })).toBeVisible();
  await expect(editor.locator(".selectedCell")).toHaveCount(12);
  await page.keyboard.press("Escape");
  await editor.getByRole("cell", { name: "Bo", exact: true }).hover();
  await rowGrip.click({ modifiers: ["Shift"] });
  await expect(page.getByRole("menuitem", { name: "Delete 2 rows", exact: true })).toBeVisible();
  await page.getByRole("menuitem", { name: "Delete 2 rows", exact: true }).click();
  await expect(editor.locator("tr > :first-child")).toHaveText(["Name", "Amy", "Dan"]);
  await editor.press("ControlOrMeta+z");
  await expect(editor.locator("tr")).toHaveCount(5);
});

test("rich HTML table paste retains its native formatting and grows at the last cell", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", { name: "Rich text editor", exact: true });
  await editor.getByRole("cell", { name: "Remote", exact: true }).click();
  await paste(
    editor,
    "First\tSecond\nThird\tFourth",
    "<table><tr><td><strong>First</strong></td><td>Second</td></tr><tr><td>Third</td><td>Fourth</td></tr></table>"
  );
  await expect(editor.locator("tr")).toHaveCount(6);
  await expect(editor.locator("tr").nth(4).locator("td,th")).toHaveCount(5);
  await expect(
    editor.getByRole("cell", { name: "First", exact: true }).locator("strong")
  ).toHaveText("First");
  await expect(editor.getByRole("cell", { name: "Fourth", exact: true })).toBeVisible();
  await editor.press("ControlOrMeta+z");
  await expect(editor.locator("tr")).toHaveCount(5);
  await expect(editor.getByRole("cell", { name: "Remote", exact: true })).toBeVisible();
});

test("expands a partial range to complete columns and duplicates both columns", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", { name: "Rich text editor", exact: true });
  await editor.getByRole("cell", { name: "Amy", exact: true }).click();
  await editor
    .getByRole("cell", { name: "Product Manager", exact: true })
    .click({ modifiers: ["Shift"] });
  await page.getByRole("button", { name: "Column actions", exact: true }).click();
  await expect(editor.locator(".selectedCell")).toHaveCount(10);
  await page.getByRole("menuitem", { name: "Duplicate 2 columns", exact: true }).click();
  await expect(editor.locator("tr").first().locator("th")).toHaveText([
    "Name",
    "Role",
    "Name",
    "Role",
    "Department",
    "Location",
  ]);
  await expect(editor.locator("tr").nth(1).locator("td")).toHaveText([
    "Amy",
    "Senior Developer",
    "Amy",
    "Senior Developer",
    "Engineering",
    "San Francisco",
  ]);
  await editor.press("ControlOrMeta+z");
  await expect(editor.locator("tr").first().locator("th")).toHaveCount(4);
});
