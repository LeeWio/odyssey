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

      // React Aria rewrites the popover's inline top/left when its anchor or viewport changes.
      // Keep the pixel probe over the editor throughout both screenshots, including those updates.
      await page.addStyleTag({
        content: `
        [data-glass-probe-menu] {
          position: absolute !important;
          top: var(--glass-probe-top, 0px) !important;
          left: var(--glass-probe-left, 0px) !important;
        }
      `,
      });
      for (const kind of ["text", "link", "image", "math", "columns", "table"]) {
        await test.step(kind, async () => {
          await editor.evaluate((element, kind) => {
            const editor = (element as HTMLElement & { editor: Editor }).editor;
            if (kind === "table") {
              const cells: number[] = [];
              editor.state.doc.descendants((node, pos) => {
                if (node.type.name !== "tableRow" || cells.length > 0) return;
                node.forEach((_cell, offset) => cells.push(pos + 1 + offset));
                return false;
              });
              if (!cells.length) throw new Error("Missing fixture table row");
              editor.commands.setCellSelection({ anchorCell: cells[0], headCell: cells.at(-1) });
              editor.commands.focus();
              editor.commands.scrollIntoView();
              return;
            }
            let position: number | undefined;
            editor.state.doc.descendants((node, pos) => {
              if (position !== undefined) return false;
              if (kind === "text" && node.isText && node.text === "Bold") position = pos;
              if (kind === "link" && node.marks.some((mark) => mark.type.name === "link"))
                position = pos + 1;
              if (kind === "image" && node.type.name === "image") position = pos;
              if (kind === "math" && node.type.name === "inlineMath") position = pos;
              if (kind === "columns" && node.type.name === "column") position = pos + 2;
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

          if (kind === "table") await page.getByRole("button", { name: "Cell actions" }).click();
          const menus = page.locator(".rich-text-editor__bubble-menu");
          const menu =
            kind === "table"
              ? menus.filter({ has: page.getByRole("menu", { name: "Cell actions", exact: true }) })
              : kind === "link"
                ? menus.filter({ has: page.getByRole("button", { name: /^Edit link:/ }) })
                : menus.filter({
                    has: page.getByRole("toolbar", {
                      name: {
                        text: "Selection formatting toolbar",
                        image: "Image actions",
                        math: "Formula actions",
                        columns: "Column layout actions",
                      }[kind],
                      exact: true,
                    }),
                  });
          await expect(menu).toBeVisible();
          // A dropdown starts scaled around its trigger. Sampling its opening frame would
          // capture bare stripes when screenshot() finishes that animation at full size.
          await expect(menu).not.toHaveAttribute("data-entering", "true");
          await expect(menu).toHaveCSS("backdrop-filter", `blur(${mode === "dark" ? 36 : 20}px)`);
          expect(
            await menu.evaluate((element) =>
              Boolean(element.closest("[data-slot='modal-container']"))
            )
          ).toBe(modal);

          // Keep the probe inside the editor: a sibling of the menu misses nested glass failures.
          await menu.evaluate((element) => {
            const menu = element as HTMLElement;
            const content = document.querySelector(".rich-text-editor__content")!;
            const contentRect = content.getBoundingClientRect();
            menu.dataset.glassProbeMenu = "";
            const origin = menu.getBoundingClientRect();
            const left = contentRect.left + 16;
            const top = contentRect.top + 16;
            menu.style.setProperty("--glass-probe-left", `${left - origin.left}px`);
            menu.style.setProperty("--glass-probe-top", `${top - origin.top}px`);
            const backdrop = document.createElement("div");
            backdrop.dataset.testid = "blur-probe";
            Object.assign(backdrop.style, {
              position: "absolute",
              top: "0px",
              left: "0px",
              width: `${menu.offsetWidth}px`,
              height: `${menu.offsetHeight}px`,
              background: "repeating-linear-gradient(90deg, black 0 4px, white 4px 8px)",
              pointerEvents: "none",
            });
            content.append(backdrop);
            const probeOrigin = backdrop.getBoundingClientRect();
            backdrop.style.left = `${left - probeOrigin.left}px`;
            backdrop.style.top = `${top - probeOrigin.top}px`;
          });
          await expect
            .poll(
              () =>
                menu.evaluate((element) => {
                  const menuRect = element.getBoundingClientRect();
                  const probeRect = document
                    .querySelector('[data-testid="blur-probe"]')!
                    .getBoundingClientRect();
                  return Math.max(
                    Math.abs(menuRect.left - probeRect.left),
                    Math.abs(menuRect.top - probeRect.top)
                  );
                }),
              { message: `${kind} menu must cover the editor's stripe probe` }
            )
            .toBeLessThan(1);

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
              // Compare pixels one stripe apart in the menu padding. This isolates the
              // stripes from the larger gradients in the menu material and its shadow.
              function stripeContrast({ data, width }: Awaited<ReturnType<typeof pixels>>) {
                const stripe = 4;
                const offsets = Array.from({ length: width - 40 - stripe }, (_, x) => x + 20);
                return (
                  offsets.reduce((total, x) => {
                    const index = (2 * width + x) * 4;
                    return total + Math.abs(data[index] - data[index + stripe * 4]);
                  }, 0) / offsets.length
                );
              }
              return { blurred: stripeContrast(a), clear: stripeContrast(b) };
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
            delete menu.dataset.glassProbeMenu;
            for (const property of ["backdrop-filter", "--glass-probe-top", "--glass-probe-left"]) {
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
  await toolbar.getByRole("button", { name: "Block type: Text", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  const typographyTrigger = toolbar.getByRole("button", { name: "Typography", exact: true });
  await expect(typographyTrigger).toBeFocused();
  await typographyTrigger.press("Enter");
  const typography = page.getByRole("dialog", { name: "Typography", exact: true });
  const fontFamily = typography.getByRole("button", { name: /Font family$/ });
  await fontFamily.focus();
  await expect(fontFamily).toBeFocused();
  await fontFamily.press("Enter");
  await page.getByRole("option", { name: "Monospace", exact: true }).click();
  await expect(editor.locator('[style*="font-family: monospace"]')).toHaveText("format");
  await expect(typography).toBeVisible();
  await expect(fontFamily).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(typography).toBeHidden();
  await expect(typographyTrigger).toBeFocused();
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

test("restored article drafts show working text and image menus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
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
  const draft = {
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Format", marks: [{ type: "bold" }] }],
        },
        {
          type: "image",
          attrs: {
            src: "/odyssey-hero.webp",
            alt: "Draft image",
            widthPercent: 35,
            alignment: "left",
          },
        },
      ],
    },
    postData: {},
    revision: "revision-1",
    savedAt: "2026-11-25T00:00:00Z",
  };
  await page.route("**/api/v1/user/me", (route) =>
    route.fulfill({ json: { code: 200, message: "OK", data: { id: 1, username: "writer" } } })
  );
  await page.route("**/api/v1/admin/posts/editor-drafts/new", (route) =>
    route.fulfill({ json: { code: 200, message: "OK", data: draft } })
  );
  await page.goto("/test/rich-text?modal=1&postId=new");
  await page.getByRole("button", { name: "Open editor", exact: true }).press("Enter");
  const editor = page.locator(editorSelector);
  await expect(editor.locator("strong")).toHaveText("Format");

  await editor.locator("strong").dblclick();
  const textMenu = page.getByRole("toolbar", { name: "Selection formatting toolbar", exact: true });
  await expect(textMenu).toBeVisible();
  await textMenu.getByRole("button", { name: "Italic", exact: true }).click();
  await expect(editor.locator("em")).toHaveText("Format");

  await editor.getByRole("img", { name: "Draft image", exact: true }).click();
  const imageMenu = page.getByRole("toolbar", { name: "Image actions", exact: true });
  await expect(
    imageMenu.getByRole("radio", { name: "Align image left", exact: true })
  ).toBeChecked();
  const centerAlignment = imageMenu.getByRole("radio", { name: "Align image center", exact: true });
  await centerAlignment.click();
  await expect(centerAlignment).toBeChecked();
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
