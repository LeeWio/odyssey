import { expect, test, type Locator, type Page } from "@playwright/test";

const editorSelector = '.ProseMirror[contenteditable="true"]';

async function clearEditor(page: Page) {
  await page.locator(editorSelector).click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Backspace");
  await expect(page.locator(editorSelector)).toHaveText("");
  await expect(page.locator(editorSelector)).toBeFocused();
}

async function expectOnTop(menu: Locator) {
  await expect(menu).toBeVisible();
  await expect
    .poll(() =>
      menu.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.left + 20, rect.top + 20));
      })
    )
    .toBe(true);
}

for (const { modal, mode } of [
  { modal: false, mode: "dark" },
  { modal: true, mode: "dark" },
  { modal: true, mode: "light" },
]) {
  test(`slash and mention suggestions support mouse, keyboard and repeated dismissal in ${modal ? "modal" : "page"} (${mode})`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((mode) => {
      localStorage.clear();
      localStorage.setItem("odyssey_theme_variant", "glass");
      localStorage.setItem("odyssey_theme_mode", mode);
    }, mode);
    await page.route("**/api/v1/users/mentions**", async (route) => {
      await route.fulfill({
        json: {
          code: 200,
          message: "OK",
          data: [
            { id: 91, username: "alice", nickname: "Alice", avatar: null },
            { id: 92, username: "bob", nickname: "Bob", avatar: null },
          ],
        },
      });
    });
    await page.goto(`/test/rich-text${modal ? "?modal=1" : ""}`);
    if (modal) await page.getByRole("button", { name: "Open editor", exact: true }).click();
    const editor = page.locator(editorSelector);
    await expect(editor).toBeVisible();
    const menu = page.locator('[data-slot="rich-text-editor-suggestion-menu"]');

    await clearEditor(page);
    await page.keyboard.type("/h2");
    await expectOnTop(menu);
    expect(
      await menu.evaluate(
        (element) => element.parentElement?.matches('[data-slot="modal-container"]') ?? false
      )
    ).toBe(modal);
    await page.getByRole("option", { name: /Heading 2/ }).click();
    await expect(editor.locator("h2")).toBeEmpty();
    await expect(menu).toHaveCount(0);

    await clearEditor(page);
    await page.keyboard.type("/heading");
    await expectOnTop(menu);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(editor.locator("h2")).toBeEmpty();
    await expect(menu).toHaveCount(0);

    await clearEditor(page);
    await page.keyboard.type("@");
    await expectOnTop(menu);
    await page.getByRole("option", { name: /alice/ }).click();
    await expect(editor.locator('[data-type="mention"]')).toHaveAttribute("data-id", "91");
    await expect(menu).toHaveCount(0);

    await clearEditor(page);
    await page.keyboard.type("@");
    await expectOnTop(menu);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(editor.locator('[data-type="mention"]')).toHaveAttribute("data-id", "92");
    await expect(menu).toHaveCount(0);

    for (const trigger of ["/", "@", "/", "@"]) {
      await clearEditor(page);
      await page.keyboard.type(trigger);
      await expectOnTop(menu);
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      if (modal)
        await expect(
          page.getByRole("dialog", { name: "Create article", exact: true })
        ).toBeVisible();
    }
    await expect(editor).toBeFocused();
    await clearEditor(page);
    await page.keyboard.type("/");
    await expectOnTop(menu);
    await menu.getByRole("listbox").focus();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(editor).toBeFocused();

    if (modal) {
      await expect(page.getByRole("alertdialog")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Discard changes", exact: true }).click();
      await expect(editor).toHaveCount(0);
      await page.getByRole("button", { name: "Open editor", exact: true }).click();
      await expect(editor).toBeVisible();
      await clearEditor(page);
      await page.keyboard.type("/");
      await expectOnTop(menu);
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}
