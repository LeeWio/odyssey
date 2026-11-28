import { expect, test } from "@playwright/test";

for (const modal of [false, true])
  for (const theme of ["light", "dark"]) {
    test(`table menus use named native groups in ${modal ? "modal390" : "page1280"} ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: modal ? 390 : 1280, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript((mode) => {
        localStorage.setItem("odyssey_theme_mode", mode);
        localStorage.setItem("odyssey_theme_variant", "glass");
      }, theme);
      await page.goto(`/test/rich-text?${modal ? "modal=1" : "table=1"}`);
      if (modal) {
        await page.getByRole("button", { name: "Open editor", exact: true }).click();
        await page.getByRole("button", { name: "Insert table", exact: true }).click();
        await page.getByRole("button", { name: "Insert 3 by 2 table", exact: true }).click();
      } else await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
      const editor = page.locator('.ProseMirror[contenteditable="true"]');
      for (const kind of ["Row", "Column", "Cell"] as const) {
        const cell = editor.locator("th").first();
        await cell.click();
        await expect(cell).toHaveClass(/table-cell-active/);
        await page.getByRole("button", { name: `${kind} actions`, exact: true }).click();
        const menu = page.getByRole("menu", { name: `${kind} actions`, exact: true });
        await expect(menu).toBeVisible();
        await expect(menu.getByRole("separator")).toHaveCount(0);
        const groups =
          kind === "Cell"
            ? ["Formatting", "Contents"]
            : [
                "Headers",
                "Arrange",
                ...(kind === "Column" ? ["Sort rows", "Column widths"] : []),
                "Formatting",
                "Contents",
                "Delete",
              ];
        for (const name of groups)
          await expect(menu.getByRole("group", { name, exact: true })).toHaveCount(1);
        await page.keyboard.press("End");
        await expect(
          menu.getByRole("menuitem", {
            name: kind === "Cell" ? "Clear contents" : "Delete table",
            exact: true,
          })
        ).toBeFocused();
        await page.keyboard.press("Home");
        if (kind !== "Cell") await expect(menu.getByRole("menuitemcheckbox").first()).toBeFocused();
        if (kind === "Column")
          await page.screenshot({
            path: `/tmp/table-grouped-${modal ? "modal" : "page"}-${theme}.png`,
          });
        await menu.getByRole("menuitem", { name: "Alignment", exact: true }).click();
        const child = page.getByRole("menu", { name: "Alignment", exact: true });
        await expect(
          child.getByRole("group", { name: "Horizontal alignment", exact: true })
        ).toBeVisible();
        await expect(
          child.getByRole("group", { name: "Vertical alignment", exact: true })
        ).toBeVisible();
        await expect(child.getByRole("separator")).toHaveCount(0);
        await page.keyboard.press("ArrowLeft");
        await expect(menu).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
      }
      await expect(editor.locator("table")).not.toHaveAttribute("role", "grid");
      if (modal)
        await expect(
          page.getByRole("dialog", { name: "Create article", exact: true })
        ).toBeVisible();
    });
  }
