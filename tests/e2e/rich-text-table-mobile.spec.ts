import { expect, test, type Page } from "@playwright/test";
import type { Editor } from "@tiptap/core";
import { RICH_TEXT_TABLE_FIXTURE } from "../../components/rich-text/testing/rich-text-table.fixture";

test.use({ hasTouch: true, isMobile: true });

async function expectMenuInViewport(page: Page, count = 1) {
  // The list can scroll vertically inside the surface. Measure the actual floating surface.
  const surface = page.locator('[data-slot="dropdown-popover"]:visible');
  await expect(surface).toHaveCount(count);
  await expect(surface.last()).not.toHaveAttribute("data-entering", "true");
  await expect
    .poll(
      () =>
        surface.evaluateAll((elements) => {
          const viewport = window.visualViewport!;
          return Math.max(
            0,
            ...elements.map((element) => {
              const rect = element.getBoundingClientRect();
              return Math.max(
                viewport.offsetLeft - rect.left,
                rect.right - viewport.offsetLeft - viewport.width,
                viewport.offsetTop - rect.top,
                rect.bottom - viewport.offsetTop - viewport.height,
                0
              );
            })
          );
        }),
      { message: "The whole table menu should fit within the touch viewport" }
    )
    .toBeLessThanOrEqual(1);
}

for (const width of [320, 390]) {
  test(`formats a table cell through touch menus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto("/test/rich-text?modal=1");
    await page.getByRole("button", { name: "Open editor", exact: true }).tap();
    const editor = page.locator(".ProseMirror[contenteditable=true]");
    await editor.evaluate((element, doc) => {
      (element as HTMLElement & { editor: Editor }).editor.commands.setContent(doc);
    }, RICH_TEXT_TABLE_FIXTURE);
    const cell = editor.getByRole("cell", { name: "London", exact: true });
    const other = editor.getByRole("cell", { name: "New York", exact: true });
    const grip = page.getByRole("button", { name: "Cell actions", exact: true });
    const color = page.getByRole("menuitem", { name: "Color", exact: true });
    const alignment = page.getByRole("menuitem", { name: "Alignment", exact: true });
    const back = page.getByRole("menuitem", { name: "Back", exact: true });

    await cell.tap();
    await grip.tap();
    await expect(color).toBeVisible();
    await expectMenuInViewport(page);
    await color.tap();
    await expect(page.getByRole("menu", { name: "Color", exact: true })).toBeVisible();
    await expect(back).toHaveCount(0);
    await expectMenuInViewport(page, 2);
    await page.touchscreen.tap(4, 4);
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(editor.locator(".selectedCell")).toHaveText("London");
    await grip.tap();
    await alignment.tap();
    await expect(page.getByRole("menu", { name: "Alignment", exact: true })).toBeVisible();
    await expectMenuInViewport(page, 2);
    await page.getByRole("menuitemradio", { name: "Align center", exact: true }).tap();
    await expect(cell).toHaveCSS("text-align", "center");
    await expect(other).not.toHaveCSS("text-align", "center");

    await grip.tap();
    await color.tap();
    await expect(back).toHaveCount(0);
    await expectMenuInViewport(page, 2);
    await page.getByRole("menuitemradio", { name: "Blue background", exact: true }).tap();
    await expect(cell).toHaveCSS("background-color", "rgb(191, 219, 254)");
    await expect(other).not.toHaveCSS("background-color", "rgb(191, 219, 254)");
    await expect(page.getByRole("dialog", { name: "Create article" })).toBeVisible();
  });
}
