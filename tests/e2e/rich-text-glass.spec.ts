import { expect, test } from "@playwright/test";
import type { Editor } from "@tiptap/react";
import { RICH_TEXT_DOCUMENT_FIXTURE } from "../../components/rich-text/testing/rich-text-document.fixture";

const editorSelector = '.ProseMirror[contenteditable="true"]';

for (const mode of ["light", "dark"] as const) {
  for (const modal of [false, true]) {
    test(`glass ${mode} menus blur their backdrop in the ${modal ? "article modal" : "page"}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript((mode) => {
        localStorage.clear();
        localStorage.setItem("odyssey_theme_variant", "glass");
        localStorage.setItem("odyssey_theme_mode", mode);
      }, mode);
      await page.goto(`/test/rich-text${modal ? "?modal=1" : ""}`);
      if (modal) await page.getByRole("button", { name: "Open editor", exact: true }).click();
      const editor = page.locator(editorSelector);
      await expect(editor).toBeVisible();
      if (!modal) {
        await page.locator(".rich-text-editor").evaluate((element) => {
          (element as HTMLElement).style.height = "650px";
        });
      }
      await page.evaluate(() => document.fonts.ready);
      await editor.evaluate((element, content) => {
        (element as HTMLElement & { editor: Editor }).editor.commands.setContent(content);
      }, RICH_TEXT_DOCUMENT_FIXTURE);
      await expect(page.locator("html")).toHaveAttribute("data-theme", `glass-${mode}`);

      for (const kind of ["text", "link", "image", "math", "columns", "table"]) {
        await test.step(kind, async () => {
          await editor.evaluate((element, kind) => {
            const editor = (element as HTMLElement & { editor: Editor }).editor;
            let position: number | undefined;
            editor.state.doc.descendants((node, pos) => {
              if (position !== undefined) return false;
              if (kind === "text" && node.isText && node.text === "Bold") position = pos;
              if (kind === "link" && node.marks.some((mark) => mark.type.name === "link"))
                position = pos + 1;
              if (kind === "image" && node.type.name === "image") position = pos;
              if (kind === "math" && node.type.name === "inlineMath") position = pos;
              if (kind === "columns" && node.type.name === "column") position = pos + 2;
              if (kind === "table" && node.type.name === "tableCell") position = pos + 2;
            });
            if (position === undefined) throw new Error(`Missing fixture node: ${kind}`);
            if (kind === "image" || kind === "math") editor.commands.setNodeSelection(position);
            else
              editor.commands.setTextSelection(
                kind === "text" ? { from: position, to: position + 4 } : position
              );
            editor.commands.focus();
            editor.commands.scrollIntoView();
          }, kind);

          const menus = page.locator(".rich-text-editor__bubble-menu");
          const menu =
            kind === "link"
              ? menus.filter({ has: page.getByRole("button", { name: /^Edit link:/ }) })
              : menus.filter({
                  has: page.getByRole("toolbar", {
                    name: {
                      text: "Selection formatting toolbar",
                      image: "Image actions",
                      math: "Formula actions",
                      columns: "Column layout actions",
                      table: "Table actions",
                    }[kind],
                    exact: true,
                  }),
                });
          await expect(menu).toBeVisible();
          await expect(menu).toHaveCSS("backdrop-filter", `blur(${mode === "dark" ? 36 : 20}px)`);
          expect(
            await menu.evaluate(
              (element) => element.parentElement?.matches("[data-slot='modal-container']") ?? false
            )
          ).toBe(modal);

          // Keep the probe inside the editor: a sibling of the menu misses nested glass failures.
          await menu.evaluate((element) => {
            const menu = element as HTMLElement;
            const content = document.querySelector(".rich-text-editor__content")!;
            const contentRect = content.getBoundingClientRect();
            menu.style.setProperty("position", "absolute", "important");
            const parentRect = (menu.offsetParent as HTMLElement).getBoundingClientRect();
            const left = contentRect.left + 16;
            const top = contentRect.top + 16;
            menu.style.setProperty("left", `${left - parentRect.left}px`, "important");
            menu.style.setProperty("top", `${top - parentRect.top}px`, "important");
            const backdrop = document.createElement("div");
            backdrop.dataset.testid = "blur-probe";
            Object.assign(backdrop.style, {
              position: "absolute",
              width: `${menu.offsetWidth}px`,
              height: `${menu.offsetHeight}px`,
              background: "repeating-linear-gradient(90deg, black 0 4px, white 4px 8px)",
              pointerEvents: "none",
            });
            content.append(backdrop);
            const probeParent = (backdrop.offsetParent as HTMLElement).getBoundingClientRect();
            backdrop.style.left = `${left - probeParent.left}px`;
            backdrop.style.top = `${top - probeParent.top}px`;
          });
          await menu.scrollIntoViewIfNeeded();
          const clip = (await menu.boundingBox())!;
          const blurred = await page.screenshot({ clip, animations: "disabled" });
          await menu.evaluate((element) => {
            (element as HTMLElement).style.backdropFilter = "none";
          });
          const clear = await page.screenshot({ clip, animations: "disabled" });
          const difference = await page.evaluate(
            async ({ blurred, clear }) => {
              async function pixels(base64: string) {
                const bytes = Uint8Array.from(atob(base64), (value) => value.charCodeAt(0));
                const image = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
                const canvas = document.createElement("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                const context = canvas.getContext("2d")!;
                context.drawImage(image, 0, 0);
                image.close();
                return {
                  data: context.getImageData(0, 0, canvas.width, canvas.height).data,
                  width: canvas.width,
                };
              }
              const a = await pixels(blurred);
              const b = await pixels(clear);
              // Sample the menu's top padding, away from nested button filters and icons.
              function deviation({ data, width }: Awaited<ReturnType<typeof pixels>>) {
                const values = Array.from(
                  { length: width - 40 },
                  (_, x) => data[(2 * width + x + 20) * 4]
                );
                const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
                return Math.sqrt(
                  values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
                );
              }
              return { blurred: deviation(a), clear: deviation(b) };
            },
            { blurred: blurred.toString("base64"), clear: clear.toString("base64") }
          );
          expect(difference.clear, `${kind} probe must be visible behind the menu`).toBeGreaterThan(
            10
          );
          expect(difference.blurred, `${kind} must smooth the backdrop stripes`).toBeLessThan(
            difference.clear * 0.4
          );
          await menu.evaluate((element) => {
            const menu = element as HTMLElement;
            for (const property of ["backdrop-filter", "position", "top", "left"]) {
              menu.style.removeProperty(property);
            }
          });
          await page.getByTestId("blur-probe").evaluate((element) => element.remove());
        });
      }
    });
  }
}

test("article modal menus keep pointer and keyboard interactions inside the focus scope", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("odyssey_theme_variant", "glass");
    localStorage.setItem("odyssey_theme_mode", "dark");
  });
  await page.goto("/test/rich-text?modal=1");
  await page.getByRole("button", { name: "Open editor", exact: true }).click();
  const editor = page.locator(editorSelector);
  await expect(editor).toBeVisible();
  await editor.evaluate((element) => {
    const editor = (element as HTMLElement & { editor: Editor }).editor;
    editor.commands.setContent("<p>format this text</p>");
    editor.commands.setTextSelection({ from: 1, to: 7 });
    editor.commands.focus();
  });
  const toolbar = page.getByRole("toolbar", { name: "Selection formatting toolbar", exact: true });
  await toolbar.getByRole("button", { name: "Italic", exact: true }).click();
  await expect(editor.locator("em")).toHaveText("format");
  const fontFamily = toolbar.getByRole("button", { name: "Font family", exact: true });
  await fontFamily.focus();
  await expect(fontFamily).toBeFocused();
  await fontFamily.press("Enter");
  await page.getByRole("menuitemradio", { name: "Monospace", exact: true }).click();
  await expect(editor.locator('[style*="font-family: monospace"]')).toHaveText("format");
  await expect
    .poll(() =>
      page
        .locator("[data-slot=modal-container]")
        .evaluate((element) => element.contains(document.activeElement))
    )
    .toBe(true);
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      page
        .locator("[data-slot=modal-container]")
        .evaluate((element) => element.contains(document.activeElement))
    )
    .toBe(true);
  await expect(page.getByRole("dialog", { name: "Create article", exact: true })).toBeVisible();
});

test("glass modal blurs actual editor text, unlike the old dialog mount", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("odyssey_theme_variant", "glass");
    localStorage.setItem("odyssey_theme_mode", "dark");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test/rich-text?modal=1");
  await page.getByRole("button", { name: "Open editor", exact: true }).click();
  const editor = page.locator(editorSelector);
  await expect(editor).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await editor.evaluate((element) => {
    const editor = (element as HTMLElement & { editor: Editor }).editor;
    editor.commands.setContent(`<p>${"|".repeat(200)}</p><p>select this text</p>`);
    editor.commands.setTextSelection({ from: 204, to: 210 });
    editor.commands.focus();
  });
  const menu = page.locator(".rich-text-editor__bubble-menu");
  await expect(menu).toBeVisible();
  const captures: string[] = [];
  for (const target of ["modal-dialog", "modal-container"]) {
    await menu.evaluate((element, target) => {
      const menu = element as HTMLElement;
      document.querySelector(`[data-slot='${target}']`)!.append(menu);
      const paragraph = document.querySelector(".ProseMirror p")!.getBoundingClientRect();
      menu.style.setProperty("position", "absolute", "important");
      const parent = (menu.offsetParent as HTMLElement).getBoundingClientRect();
      menu.style.setProperty("left", `${paragraph.left - parent.left}px`, "important");
      menu.style.setProperty("top", `${paragraph.top + 10 - parent.top}px`, "important");
    }, target);
    const rect = (await menu.boundingBox())!;
    captures.push(
      (
        await page.screenshot({
          clip: { x: rect.x + 20, y: rect.y + 2, width: rect.width - 40, height: 1 },
        })
      ).toString("base64")
    );
  }
  const deviations = await page.evaluate(async (captures) => {
    return Promise.all(
      captures.map(async (base64) => {
        const image = await createImageBitmap(
          new Blob([Uint8Array.from(atob(base64), (value) => value.charCodeAt(0))], {
            type: "image/png",
          })
        );
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = 1;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        image.close();
        const data = context.getImageData(0, 0, canvas.width, 1).data;
        const values = Array.from({ length: canvas.width }, (_, index) => data[index * 4]);
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        return Math.sqrt(
          values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
        );
      })
    );
  }, captures);
  expect(deviations[0], "old mount leaves sharp editor glyphs").toBeGreaterThan(10);
  expect(deviations[1], "new mount smooths actual editor glyphs").toBeLessThan(deviations[0] * 0.4);
});
