import { expect, test, type Locator, type Page } from "@playwright/test";

const columnsSelector = ".ProseMirror .node-columns";

async function openSpecimen(page: Page, width = 1280) {
  await page.setViewportSize({ width, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html><body>Video fixture</body></html>" })
  );
  await page.goto("/test/rich-text?typography=1");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  return page.locator(columnsSelector);
}

async function expectWidths(columns: Locator, widths: number[]) {
  await expect(columns.locator('[data-type="columns"]')).toHaveAttribute(
    "data-column-widths",
    widths.join(",")
  );
  await expect
    .poll(async () =>
      columns.locator('[data-type="column"]').evaluateAll((elements) => {
        const bounds = elements.map((element) => element.getBoundingClientRect());
        const total = bounds.reduce((sum, bound) => sum + bound.width, 0);
        return bounds.map((bound) => Math.round((bound.width / total) * 100));
      })
    )
    .toEqual(widths.map(Math.round));
  const bounds = await columns.locator('[data-type="column"]').evaluateAll((elements) =>
    elements.map((element) => ({
      top: element.getBoundingClientRect().top,
      left: element.getBoundingClientRect().left,
    }))
  );
  expect(bounds.every((bound) => Math.abs(bound.top - bounds[0].top) < 1)).toBe(true);
  for (let index = 1; index < bounds.length; index += 1) {
    expect(bounds[index].left).toBeGreaterThan(bounds[index - 1].left);
  }
}

for (const width of [390, 1280]) {
  test(`preserves authored columns and resize controls at ${width}px`, async ({ page }) => {
    const columns = await openSpecimen(page, width);
    await columns.getByText("Left", { exact: true }).click();
    await expectWidths(columns, [50, 50]);
    const handle = columns.getByRole("separator", { name: "Resize columns 1 and 2" });
    await expect(handle).toBeVisible();
    const cells = columns.locator('[data-type="column"]');
    await expect(cells.first()).toHaveCSS("padding", "8px");
    await expect(cells.first()).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await page.getByRole("radio", { name: "Left", exact: true }).click();
    await expectWidths(columns, [65, 35]);
    await page.getByTestId("toggle-reading").click();
    await expectWidths(columns, [65, 35]);
    await expect(columns.getByRole("separator")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });
}

test("keeps two and three column presets, content and saved widths", async ({ page }) => {
  const columns = await openSpecimen(page);
  await columns.getByText("Left", { exact: true }).click();
  const menu = page.getByRole("toolbar", { name: "Column layout actions" });
  await menu.getByRole("radio", { name: "Right", exact: true }).click();
  await expectWidths(columns, [35, 65]);
  await menu.getByRole("radio", { name: "Three columns" }).click();
  await expectWidths(columns, [33.33, 33.33, 33.34]);
  await menu.getByRole("radio", { name: "Center", exact: true }).click();
  await expectWidths(columns, [25, 50, 25]);
  await columns.locator('[data-type="column"]').nth(2).locator("p").click();
  await page.keyboard.type("Third column content");
  await menu.getByRole("radio", { name: "Two columns" }).click();
  await expectWidths(columns, [50, 50]);
  await expect(columns.locator('[data-type="column"]').nth(1)).toContainText("Right");
  await expect(columns.locator('[data-type="column"]').nth(1)).toContainText(
    "Third column content"
  );
  await menu.getByRole("radio", { name: "Right", exact: true }).click();
  await page.getByTestId("save-draft").click();
  await expect(page.getByTestId("draft-status")).toHaveText("Draft saved");
  await page.goto("/test/rich-text");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  await expectWidths(columns, [35, 65]);
  await expect(columns).toContainText("Third column content");
  await columns.getByText("Left", { exact: true }).click();
  await page.getByRole("button", { name: "Remove column layout" }).click();
  await expect(columns).toHaveCount(0);
  await expect(page.locator(".ProseMirror")).toContainText("Third column content");
});

test("supports pointer and keyboard resizing without losing content", async ({ page }) => {
  const columns = await openSpecimen(page);
  await columns.getByText("Left", { exact: true }).click();
  const handle = columns.getByRole("separator", { name: "Resize columns 1 and 2" });
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 80, box!.y + box!.height / 2, { steps: 10 });
  await page.mouse.up();
  const saved = columns.locator('[data-type="columns"]');
  await expect(saved).not.toHaveAttribute("data-column-widths", "50,50");
  const resizedWidths = (await saved.getAttribute("data-column-widths"))!.split(",").map(Number);
  expect(resizedWidths[0]).toBeGreaterThan(50);
  await expectWidths(columns, resizedWidths);
  await handle.focus();
  await handle.press("ArrowLeft");
  await expect(saved).not.toHaveAttribute("data-column-widths", resizedWidths.join(","));
  const keyboardWidths = (await saved.getAttribute("data-column-widths"))!.split(",").map(Number);
  expect(keyboardWidths[0]).toBeLessThan(resizedWidths[0]);
  await expectWidths(columns, keyboardWidths);
  await expect(columns.locator('[data-type="column"]').first()).toHaveText("Left");
  await expect(columns.locator('[data-type="column"]').last()).toHaveText("Right");
  await page.getByTestId("save-draft").click();
  await page.goto("/test/rich-text");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  await expectWidths(columns, keyboardWidths);
});

test("navigates empty columns and exits the last column with the keyboard", async ({ page }) => {
  const columns = await openSpecimen(page);
  await columns.getByText("Left", { exact: true }).click();
  await page.getByRole("radio", { name: "Three columns" }).click();
  const cells = columns.locator('[data-type="column"]');
  const expectSelectionInColumn = async (index: number) => {
    await expect
      .poll(() =>
        cells
          .nth(index)
          .evaluate((cell) => cell.contains(window.getSelection()?.anchorNode ?? null))
      )
      .toBe(true);
    await expect(page.locator('.ProseMirror[contenteditable="true"]')).toBeFocused();
  };
  await expect(cells.nth(2)).toHaveCSS("padding", "8px");
  await cells.nth(2).locator("p").click();
  await expectSelectionInColumn(2);
  await page.keyboard.press("Shift+Tab");
  await expectSelectionInColumn(1);
  await page.keyboard.type("Previous ");
  await expect(cells.nth(1)).toContainText("Previous Right");
  await page.keyboard.press("ControlOrMeta+Alt+ArrowLeft");
  await expectSelectionInColumn(0);
  await page.keyboard.type("First ");
  await expect(cells.nth(0)).toHaveText("First Left");
  await page.keyboard.press("ControlOrMeta+Alt+ArrowRight");
  await expectSelectionInColumn(1);
  await page.keyboard.press("ControlOrMeta+Alt+ArrowRight");
  await expectSelectionInColumn(2);
  await page.keyboard.press("Enter");
  await page.keyboard.type("After columns");
  await expect(columns.locator("xpath=following-sibling::*[1]")).toHaveText("After columns");
  await expect(cells.nth(2)).toHaveText("");
});
