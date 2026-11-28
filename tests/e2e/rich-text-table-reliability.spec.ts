import { expect, test } from "@playwright/test";
import type { Editor } from "@tiptap/core";

for (const modal of [false, true])
  for (const cancel of ["Escape", "readonly", "blur", "outer edit"] as const) {
    test(`native resize cancels ${cancel} in ${modal ? "modal" : "page"} without a stale mouseup write`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width: modal ? 390 : 1280, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/test/rich-text?${modal ? "modal=1" : "table=1"}`);
      if (modal) {
        await page.getByRole("button", { name: "Open editor", exact: true }).click();
        await page.getByRole("button", { name: "Insert table", exact: true }).click();
        await page.getByRole("button", { name: "Insert 3 by 2 table", exact: true }).click();
      } else await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
      const editor = page.locator(".ProseMirror");
      const cell = editor.locator("th").first();
      await cell.click();
      await expect(cell).toHaveClass(/table-cell-active/);
      const before = await editor.evaluate((el) =>
        (el as HTMLElement & { editor: Editor }).editor.getJSON()
      );
      const storedColumns = await editor
        .locator("col")
        .evaluateAll((cols) => cols.map((col) => (col as HTMLElement).style.width));
      const box = (await cell.boundingBox())!;
      const x = box.x + box.width - 2,
        y = box.y + box.height - 6;
      await page.mouse.move(x, y);
      await expect(editor).toHaveClass(/resize-cursor/);
      await page.mouse.down();
      await page.mouse.move(x + 60, y, { steps: 6 });
      await expect(page.locator("[data-table-resize-width]")).toBeVisible();
      if (cancel === "Escape") await page.keyboard.press("Escape");
      else if (cancel === "blur")
        await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      else
        await editor.evaluate((el, cancel) => {
          const editor = (el as HTMLElement & { editor: Editor }).editor;
          if (cancel === "readonly") editor.setEditable(false, false);
          else
            editor.view.dispatch(
              editor.state.tr.insert(
                0,
                editor.schema.nodes.paragraph.create(null, editor.schema.text("Async update"))
              )
            );
        }, cancel);
      await expect(page.locator("[data-table-resize-width]")).toHaveCount(0);
      await expect
        .poll(() =>
          editor
            .locator("col")
            .evaluateAll((cols) => cols.map((col) => (col as HTMLElement).style.width))
        )
        .toEqual(storedColumns);
      // Read-only rendering removes edit gutters, so automatic track pixels may reflow.
      if (cancel !== "readonly")
        await expect.poll(async () => (await cell.boundingBox())!.width).toBeCloseTo(box.width, 0);
      const afterCancel = await editor.evaluate((el) =>
        (el as HTMLElement & { editor: Editor }).editor.getJSON()
      );
      if (cancel !== "outer edit") expect(afterCancel).toEqual(before);
      await page.mouse.move(x + 90, y);
      await page.mouse.up();
      expect(
        await editor.evaluate((el) => (el as HTMLElement & { editor: Editor }).editor.getJSON())
      ).toEqual(afterCancel);
      expect(errors).toEqual([]);
      if (modal)
        await expect(
          page.getByRole("dialog", { name: "Create article", exact: true })
        ).toBeVisible();
    });
  }

test("an open table menu and a held row gesture stop when the editor becomes read-only", async ({
  page,
}) => {
  await page.goto("/test/rich-text?table=1");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  const editor = page.locator(".ProseMirror");
  const cell = editor.getByRole("cell", { name: "Amy", exact: true });
  await cell.click();
  await expect(cell).toHaveClass(/table-cell-active/);
  await page.getByRole("button", { name: "Row actions", exact: true }).click();
  await expect(page.getByRole("menu", { name: "Row actions", exact: true })).toBeVisible();
  const before = await editor.evaluate((el) =>
    (el as HTMLElement & { editor: Editor }).editor.getJSON()
  );
  await editor.evaluate((el) => (el as HTMLElement & { editor: Editor }).editor.setEditable(false));
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Row actions", exact: true })).toHaveCount(0);
  await editor.evaluate((el) => (el as HTMLElement & { editor: Editor }).editor.setEditable(true));
  await cell.click();
  await expect(cell).toHaveClass(/table-cell-active/);
  const handle = page.getByRole("button", { name: "Row actions", exact: true });
  const box = (await handle.boundingBox())!;
  const target = (await editor.getByRole("cell", { name: "Dan", exact: true }).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + 20, target.y + 10, { steps: 6 });
  await editor.evaluate((el) => (el as HTMLElement & { editor: Editor }).editor.setEditable(false));
  await page.mouse.up();
  expect(
    await editor.evaluate((el) => (el as HTMLElement & { editor: Editor }).editor.getJSON())
  ).toEqual(before);
});

test("destroying an editor during native resize leaves no active window mouse handler", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/rich-text?table=1");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  const editor = page.locator(".ProseMirror");
  const cell = editor.locator("th").first();
  await cell.click();
  const box = (await cell.boundingBox())!;
  const x = box.x + box.width - 2,
    y = box.y + box.height - 6;
  await page.mouse.move(x, y);
  await expect(editor).toHaveClass(/resize-cursor/);
  await page.mouse.down();
  await page.mouse.move(x + 45, y, { steps: 5 });
  await editor.evaluate((el) => (el as HTMLElement & { editor: Editor }).editor.destroy());
  await page.mouse.move(x + 80, y);
  await page.mouse.up();
  expect(errors).toEqual([]);
});
