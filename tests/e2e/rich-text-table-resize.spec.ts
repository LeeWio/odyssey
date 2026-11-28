import { expect, test } from "@playwright/test";

for (const modal of [false, true])
  for (const width of [390, 1280])
    test(`native column drag keeps its selection aligned in ${modal ? "modal" : "page"} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(() => {
        localStorage.setItem(
          "odyssey_auth",
          JSON.stringify({
            accessToken: "editor-fixture",
            username: "writer",
            roles: ["ROLE_ADMIN"],
            permissions: [],
            isAuthenticated: true,
          })
        );
      });
      if (modal) {
        await page.route("**/api/v1/user/me", (route) =>
          route.fulfill({ json: { code: 200, message: "OK", data: { id: 1, username: "writer" } } })
        );
        await page.route("**/api/v1/admin/posts/editor-drafts/new", (route) =>
          route.fulfill({
            json: {
              code: 200,
              message: "OK",
              data: {
                content: { type: "doc", content: [{ type: "paragraph" }] },
                postData: {},
                revision: "resize-fixture",
                savedAt: "2026-11-28T00:00:00Z",
              },
            },
          })
        );
      }
      await page.goto(`/test/rich-text${modal ? "?modal=1&postId=new" : "?table=1"}`);
      if (modal) {
        await page.getByRole("button", { name: "Open editor", exact: true }).click();
        await expect(page.locator('.ProseMirror[contenteditable="true"]')).toBeVisible();
        await page.getByRole("button", { name: "Insert table", exact: true }).click();
        await page.getByRole("button", { name: "Insert 3 by 2 table", exact: true }).click();
      } else {
        await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
      }
      const editor = page.locator('.ProseMirror[contenteditable="true"]');
      const cell = editor.locator("th").nth(1);
      await cell.click();
      await expect(cell).toHaveClass(/table-cell-active/);
      const outline = page.locator("[data-table-selection-outline]");
      await expect(outline).toBeVisible();
      const originalWidth = await cell.getAttribute("colwidth");
      const initial = (await cell.boundingBox())!;
      const x = initial.x + initial.width - 2,
        y = initial.y + initial.height - 6;
      await page.mouse.move(x, y);
      await expect(editor).toHaveClass(/resize-cursor/);
      await page.mouse.down();
      for (const delta of [25, 50, 75]) {
        await page.mouse.move(x + delta, y, { steps: 3 });
        await expect(page.locator("[data-table-resize-width]")).toBeVisible();
        // Assert the live DOM preview, before native mouseup writes widths to the document.
        await expect
          .poll(async () => {
            const band = (await outline.boundingBox())!;
            const grid = (await cell.boundingBox())!;
            return Math.max(
              Math.abs(band.x - grid.x),
              Math.abs(band.x + band.width - grid.x - grid.width)
            );
          })
          .toBeLessThan(1.1);
      }
      await page.mouse.up();
      await expect(cell).toHaveAttribute("colwidth", /\d+/);
      await expect(page.locator("[data-table-resize-width]")).toHaveCount(0);
      await editor.press("ControlOrMeta+z");
      await expect.poll(() => cell.getAttribute("colwidth")).toBe(originalWidth);
    });
