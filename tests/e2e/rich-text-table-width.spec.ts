import { expect, test, type Page } from "@playwright/test";
import type { Editor } from "@tiptap/core";

async function start(page: Page, modal = false, theme = "dark") {
  await page.addInitScript((mode) => {
    localStorage.setItem("odyssey_theme_mode", mode);
    localStorage.setItem("odyssey_theme_variant", "glass");
  }, theme);
  await page.setViewportSize({ width: modal ? 390 : 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (modal) {
    await page.addInitScript(() =>
      localStorage.setItem(
        "odyssey_auth",
        JSON.stringify({
          accessToken: "editor-fixture",
          username: "writer",
          roles: ["ROLE_ADMIN"],
          permissions: [],
          isAuthenticated: true,
        })
      )
    );
    await page.route("**/api/v1/user/me", (r) =>
      r.fulfill({ json: { code: 200, message: "OK", data: { id: 1, username: "writer" } } })
    );
    await page.route("**/api/v1/admin/posts/editor-drafts/new", (r) =>
      r.fulfill({
        json: {
          code: 200,
          message: "OK",
          data: {
            content: { type: "doc", content: [{ type: "paragraph" }] },
            postData: {},
            revision: "width",
            savedAt: "2026-11-28T00:00:00Z",
          },
        },
      })
    );
  }
  await page.goto(`/test/rich-text?${modal ? "modal=1&postId=new" : "table=1"}`);
  if (modal) {
    await page.getByRole("button", { name: "Open editor", exact: true }).click();
    await expect(page.locator('.ProseMirror[contenteditable="true"]')).toBeVisible();
    await page.getByRole("button", { name: "Insert table", exact: true }).click();
    await page.getByRole("button", { name: "Insert 3 by 2 table", exact: true }).click();
  } else await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  return page.locator('.ProseMirror[contenteditable="true"]');
}
async function openWidth(page: Page) {
  await page.getByRole("button", { name: "Column actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Set column width…", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Column width", exact: true });
  await expect(dialog).toBeVisible();
  return { dialog, field: dialog.getByRole("textbox", { name: /Width \(px\)/ }) };
}
const json = (el: Element) => (el as HTMLElement & { editor: Editor }).editor.getJSON();

for (const modal of [false, true])
  for (const theme of ["light", "dark"])
    test(`sets an exact width with native keyboard stepping in ${modal ? "article modal" : "page"} ${theme}`, async ({
      page,
    }) => {
      const editor = await start(page, modal, theme);
      const cell = editor.locator("th").nth(1);
      await cell.click();
      await expect(cell).toHaveClass(/table-cell-active/);
      const before = await editor.evaluate(json);
      const { dialog, field } = await openWidth(page);
      await expect(field).toBeFocused();
      await expect(page.locator("html")).toHaveAttribute("data-theme", `glass-${theme}`);
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      await page.screenshot({
        path: `/tmp/table-precise-${modal ? "modal" : "page"}-${theme}.png`,
      });
      await field.fill("180");
      await field.press("ArrowUp");
      await expect(field).toHaveValue("181");
      await field.press("Enter");
      await expect(dialog).toBeHidden();
      await expect(cell).toHaveAttribute("colwidth", "181");
      await expect(editor.locator("tr").nth(1).locator("td").nth(1)).toHaveAttribute(
        "colwidth",
        "181"
      );
      await expect(editor).toBeFocused();
      if (modal)
        await expect(
          page.getByRole("dialog", { name: "Create article", exact: true })
        ).toBeVisible();
      await editor.press("ControlOrMeta+z");
      await expect.poll(() => editor.evaluate(json)).toEqual(before);
    });

test("mixed merged columns apply in one undo, preserve neighbors, and no-op confirmation adds no history", async ({
  page,
}) => {
  const editor = await start(page);
  await editor.evaluate((el) =>
    (el as HTMLElement & { editor: Editor }).editor.commands.setContent({
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
                  attrs: { colspan: 2, colwidth: [120, 180] },
                  content: [{ type: "paragraph", content: [{ type: "text", text: "Group" }] }],
                },
                {
                  type: "tableHeader",
                  attrs: { colwidth: [220] },
                  content: [{ type: "paragraph", content: [{ type: "text", text: "Other" }] }],
                },
              ],
            },
            {
              type: "tableRow",
              content: [120, 180, 220].map((width, index) => ({
                type: "tableCell",
                attrs: { colwidth: [width] },
                content: [
                  { type: "paragraph", content: [{ type: "text", text: ["A", "B", "C"][index] }] },
                ],
              })),
            },
          ],
        },
      ],
    })
  );
  const cell = editor.getByRole("columnheader", { name: "Group", exact: true });
  await cell.click();
  await expect(cell).toHaveClass(/table-cell-active/);
  const before = await editor.evaluate(json);
  let { dialog, field } = await openWidth(page);
  await expect(field).toHaveValue("");
  await expect(field).toHaveAttribute("placeholder", "Mixed");
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(await editor.evaluate(json)).toEqual(before);
  await field.fill("160");
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(cell).toHaveAttribute("colwidth", "160,160");
  await expect(editor.getByRole("cell", { name: "C", exact: true })).toHaveAttribute(
    "colwidth",
    "220"
  );
  await editor.press("ControlOrMeta+z");
  await expect.poll(() => editor.evaluate(json)).toEqual(before);
  await editor.press("ControlOrMeta+Shift+z");
  await expect(cell).toHaveAttribute("colwidth", "160,160");
  ({ dialog, field } = await openWidth(page));
  await expect(field).toHaveValue("160");
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(dialog).toBeHidden();
  await editor.press("ControlOrMeta+z");
  await expect.poll(() => editor.evaluate(json)).toEqual(before);
});

test("Cancel and Escape leave the document unchanged, including an empty field", async ({
  page,
}) => {
  const editor = await start(page);
  const cell = editor.getByRole("columnheader", { name: "Role", exact: true });
  await cell.click();
  await expect(cell).toHaveClass(/table-cell-active/);
  const before = await editor.evaluate(json);
  let { dialog, field } = await openWidth(page);
  await field.fill("250");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(editor).toBeFocused();
  expect(await editor.evaluate(json)).toEqual(before);
  ({ dialog, field } = await openWidth(page));
  await field.fill("");
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(await editor.evaluate(json)).toEqual(before);
  await field.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(editor).toBeFocused();
  expect(await editor.evaluate(json)).toEqual(before);
});

test("maps an outer edit and cancels safely when the owned table is deleted", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const editor = await start(page);
  const cell = editor.getByRole("columnheader", { name: "Role", exact: true });
  await cell.click();
  await expect(cell).toHaveClass(/table-cell-active/);
  let { dialog, field } = await openWidth(page);
  await field.fill("190");
  await editor.evaluate((el) => {
    const ed = (el as HTMLElement & { editor: Editor }).editor;
    ed.view.dispatch(
      ed.state.tr.insert(0, ed.schema.nodes.paragraph.create(null, ed.schema.text("Before")))
    );
  });
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(cell).toHaveAttribute("colwidth", "190");
  await expect(editor.locator(":scope > p").first()).toHaveText("Before");
  ({ dialog, field } = await openWidth(page));
  await field.fill("260");
  await editor.evaluate((el) => {
    const ed = (el as HTMLElement & { editor: Editor }).editor;
    let from = 0,
      size = 0;
    ed.state.doc.descendants((node, pos) => {
      if (node.type.name === "table") {
        from = pos;
        size = node.nodeSize;
        return false;
      }
    });
    ed.view.dispatch(ed.state.tr.delete(from, from + size));
  });
  await expect(dialog).toBeHidden();
  await expect(editor.locator("table")).toHaveCount(0);
  expect(errors).toEqual([]);
});
