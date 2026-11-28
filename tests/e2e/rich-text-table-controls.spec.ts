import { expect, test, type Locator } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`centers the cell grip and keeps symmetric outside controls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/test/rich-text?table=1");
    const editor = page.getByRole("textbox", { name: "Rich text editor", exact: true });
    const cell = editor.getByRole("cell", { name: "Amy", exact: true });
    await cell.click();
    const grip = page.getByRole("button", { name: "Cell actions", exact: true });
    await expect(grip).toBeVisible();
    await expect
      .poll(async () => {
        const b = (await grip.boundingBox())!;
        const c = (await cell.boundingBox())!;
        return Math.max(
          Math.abs(b.x + b.width / 2 - c.x - c.width),
          Math.abs(b.y + b.height / 2 - c.y - c.height / 2)
        );
      })
      .toBeLessThan(0.1);
    const wrapper = (await editor.locator(".tableWrapper").boundingBox())!;
    const row = (await page
      .getByRole("button", { name: "Row actions", exact: true })
      .boundingBox())!;
    const column = (await page
      .getByRole("button", { name: "Column actions", exact: true })
      .boundingBox())!;
    const addRow = (await page
      .getByRole("button", { name: "Add row below table", exact: true })
      .boundingBox())!;
    expect(wrapper.x - row.x - row.width).toBeCloseTo(4, 1);
    expect(wrapper.y - column.y - column.height).toBeCloseTo(4, 1);
    expect(addRow.y - wrapper.y - wrapper.height).toBeCloseTo(4, 1);
    expect([row.width, column.height, addRow.height]).toEqual([16, 16, 16]);
    if (width === 1280) {
      const addColumn = (await page
        .getByRole("button", { name: "Add column to right of table", exact: true })
        .boundingBox())!;
      expect(addColumn.x - wrapper.x - wrapper.width).toBeCloseTo(4, 1);
      expect(addColumn.width).toBe(16);
    }
    const icon = grip.locator("svg");
    await expect(icon).toHaveCSS("width", "12px");
    await expect(icon).toHaveCSS("margin-top", "0px");
  });
}

for (const width of [390, 911, 1280]) {
  test(`uses native Color and Alignment submenus without Back at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/test/rich-text?table=1");
    const editor = page.getByRole("textbox", { name: "Rich text editor", exact: true });
    await editor.getByRole("cell", { name: "Amy", exact: true }).click();
    await expect(page.getByRole("button", { name: "Cell actions", exact: true })).toBeVisible();
    await editor.press("Shift+F10");
    const root = page.getByRole("menu", { name: "Cell actions", exact: true });
    await root.getByRole("menuitem", { name: "Alignment", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    const alignment = page.getByRole("menu", { name: "Alignment", exact: true });
    await expect(alignment).toBeVisible();
    await expectBalancedMenu(alignment);
    await expect(
      page.getByRole("menuitemradio", { name: "Align center", exact: true })
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Back", exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(root.getByRole("menuitem", { name: "Alignment", exact: true })).toBeFocused();
    await root.getByRole("menuitem", { name: "Color", exact: true }).click();
    const color = page.getByRole("menu", { name: "Color", exact: true });
    await expect(color).toBeVisible();
    await expectBalancedMenu(color);
    await expect(page.getByRole("menuitem", { name: "Back", exact: true })).toHaveCount(0);
    const bounds = (await color.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    expect(bounds.height).toBeLessThanOrEqual(384 + 1);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(root).toBeHidden();
    await expect(editor).toBeFocused();
  });
}

test("the thin row rail has a 24px hit target without covering the grid", async ({ page }) => {
  await page.goto("/test/rich-text?table=1");
  const editor = page.getByRole("textbox", { name: "Rich text editor", exact: true });
  await editor.getByRole("cell", { name: "Amy", exact: true }).click();
  const rowGrip = page.getByRole("button", { name: "Row actions", exact: true });
  await expect(rowGrip).toBeVisible();
  const box = (await rowGrip.boundingBox())!;
  await page.mouse.click(box.x + box.width + 3, box.y + box.height / 2);
  await expect(page.getByRole("menu", { name: "Row actions", exact: true })).toBeVisible();
});

test("the border grip owns its midpoint while the column edge still resizes beside it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/test/rich-text?table=1");
  const editor = page.getByRole("textbox", { name: "Rich text editor", exact: true });
  const header = editor.getByRole("columnheader", { name: "Location", exact: true });
  await header.click();
  const grip = page.getByRole("button", { name: "Cell actions", exact: true });
  await expect(grip).toBeVisible();
  const before = (await header.boundingBox())!;
  const point = { x: before.x + before.width - 2, y: before.y + before.height - 6 };
  await page.mouse.move(point.x, point.y);
  await expect(editor).toHaveClass(/resize-cursor/);
  await page.mouse.down();
  await page.mouse.move(point.x + 30, point.y, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => Number(await header.getAttribute("colwidth")))
    .toBeGreaterThan(before.width + 20);
  await grip.click();
  await expect(page.getByRole("menu", { name: "Cell actions", exact: true })).toBeVisible();
});

test("the last-column grip and append control remain independently clickable", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/test/rich-text?table=1");
  const editor = page.getByRole("textbox", { name: "Rich text editor", exact: true });
  await editor.getByRole("cell", { name: "New York", exact: true }).click();
  const grip = page.getByRole("button", { name: "Cell actions", exact: true });
  await grip.click();
  await expect(page.getByRole("menu", { name: "Cell actions", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Add column to right of table", exact: true }).click();
  await expect(editor.locator("tr").first().locator("th,td")).toHaveCount(5);
  await editor.press("ControlOrMeta+z");
  await expect(editor.locator("tr").first().locator("th,td")).toHaveCount(4);
});

async function expectBalancedMenu(menu: Locator) {
  const popover = menu.locator('xpath=ancestor::*[@data-slot="dropdown-popover"]');
  await expect(popover).not.toHaveAttribute("data-entering", "true");
  await expect
    .poll(() =>
      menu.evaluate((el) => {
        const popover = el.closest<HTMLElement>('[data-slot="dropdown-popover"]')!;
        const panel = popover.getBoundingClientRect(),
          box = el.getBoundingClientRect();
        const item = el.querySelector('[role="menuitemradio"]')!.getBoundingClientRect();
        // Exclude any native scrollbar; compare the actual menu content padding.
        const right = panel.left + popover.clientLeft + popover.clientWidth;
        return Math.max(
          Math.abs(box.left - panel.left - popover.clientLeft - (right - box.right)),
          Math.abs(item.left - box.left - (box.right - item.right))
        );
      })
    )
    .toBeLessThan(0.5);
}

for (const width of [390, 1280])
  test(`keeps native submenu padding inside the article modal at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/test/rich-text?modal=1");
    await page.getByRole("button", { name: "Open editor", exact: true }).click();
    const editor = page.locator('.ProseMirror[contenteditable="true"]');
    await expect(editor).toBeVisible();
    await page.getByRole("button", { name: "Insert table", exact: true }).click();
    await page.getByRole("button", { name: "Insert 3 by 2 table", exact: true }).click();
    const cell = editor.locator("th").first();
    await cell.click();
    await expect(cell).toHaveClass(/table-cell-active/);
    await editor.press("Shift+F10");
    for (const name of ["Color", "Alignment"]) {
      await page.getByRole("menuitem", { name, exact: true }).click();
      await expectBalancedMenu(page.getByRole("menu", { name, exact: true }));
      await page.keyboard.press("ArrowLeft");
    }
    await expect(page.getByRole("menu", { name: "Cell actions", exact: true })).toBeVisible();
  });
