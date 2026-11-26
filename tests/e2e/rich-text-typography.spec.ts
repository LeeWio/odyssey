import { expect, test, type Locator } from "@playwright/test";
import type { Editor } from "@tiptap/react";
import { THEME_MODE_STORAGE_KEY, THEME_VARIANT_STORAGE_KEY } from "../../lib/theme";

test("typography presets apply and reset selected text and paragraph spacing", async ({ page }) => {
  await page.goto("/test/rich-text?typography=1");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  const editor = page.locator('.ProseMirror[contenteditable="true"]');
  await editor.evaluate((element) => {
    const editor = (element as HTMLElement & { editor: Editor }).editor;
    editor.commands.setContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Styled selection",
              marks: [{ type: "bold" }, { type: "textStyle", attrs: { color: "#ef4444" } }],
            },
            { type: "text", text: " and the rest of the paragraph." },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: "A separate paragraph." }] },
      ],
    });
    editor.commands.focus();
    editor.commands.setTextSelection({ from: 1, to: 17 });
  });

  const toolbar = page.getByRole("toolbar", { name: "Selection formatting toolbar" });
  await toolbar.getByRole("button", { name: "Typography" }).click();
  const typography = page.getByRole("dialog", { name: "Typography" });
  await expect(typography.getByRole("heading", { name: "Custom" })).toBeVisible();
  const presets = typography.getByRole("radiogroup", { name: "Presets" });
  const editorial = presets.getByRole("radio", { name: "Editorial" });
  const compact = presets.getByRole("radio", { name: "Compact" });
  await editorial.click();
  await expect(editorial).toBeChecked();
  const selection = editor.getByText("Styled selection", { exact: true });
  await expect(selection).toHaveCSS("font-family", "Georgia");
  await expect(selection).toHaveCSS("font-size", "18px");

  await compact.click();
  await expect(compact).toBeChecked();
  await expect(editor.locator("p").first()).toHaveCSS("line-height", "20px");
  await expect(editor.getByText("A separate paragraph.")).toHaveCSS("line-height", "28px");
  await typography.getByRole("button", { name: "Increase Font size" }).click();
  await expect(compact).not.toBeChecked();
  await expect(selection).toHaveCSS("font-size", "15px");

  await presets.getByRole("radio", { name: "Default" }).click();
  await expect(selection).toHaveCSS("font-size", "16px");
  await expect(selection).toHaveCSS("color", "rgb(239, 68, 68)");
  await expect(editor.locator("p").first()).toHaveCSS("line-height", "28px");

  await compact.click();
  await page.keyboard.press("Escape");
  await expect(typography).toBeHidden();
  await page.getByTestId("toggle-reading").click();
  const reader = page.locator('.ProseMirror[contenteditable="false"]');
  await expect(reader.locator("p").first()).toHaveCSS("line-height", "20px");
  await expect(reader.getByText("Styled selection", { exact: true })).toHaveCSS(
    "font-size",
    "14px"
  );
});

test("the text color picker colors formatted text in the editor and reader", async ({ page }) => {
  await page.goto("/test/rich-text?typography=1");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  const editor = page.locator('.ProseMirror[contenteditable="true"]');
  await editor.evaluate((element) => {
    const editor = (element as HTMLElement & { editor: Editor }).editor;
    const text = (label: string, ...marks: string[]) => ({
      type: "text",
      text: label,
      marks: marks.map((type) => ({ type })),
    });
    const highlightedBold = (
      label: string,
      attrs: { backgroundColor: string; fontSize?: string }
    ) => ({
      type: "text",
      text: label,
      marks: [{ type: "bold" }, { type: "textStyle", attrs }],
    });
    editor.commands.setContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            text("Plain "),
            text("Bold ", "bold"),
            text("Italic ", "italic"),
            text("Bold italic ", "bold", "italic"),
            text("Underline ", "underline"),
            text("Strike ", "strike"),
            highlightedBold("Highlighted bold", { backgroundColor: "#fef08a", fontSize: "20px" }),
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [
                text("Default bold", "bold"),
                text(" / "),
                highlightedBold("Highlight only", { backgroundColor: "#fef08a" }),
              ],
            },
          ],
        },
      ],
    });
    editor.commands.focus();
    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.firstChild!.nodeSize - 1 });
  });

  const toolbar = page.getByRole("toolbar", { name: "Selection formatting toolbar" });
  await toolbar.getByRole("button", { name: "Color formatting" }).click();
  await page
    .getByRole("listbox", { name: "Text color presets" })
    .getByRole("option")
    .first()
    .click();
  await page.keyboard.press("Escape");

  for (const root of [editor, page.locator('.ProseMirror[contenteditable="false"]')]) {
    if (root !== editor) await page.getByTestId("toggle-reading").click();
    for (const label of [
      "Bold",
      "Italic",
      "Bold italic",
      "Underline",
      "Strike",
      "Highlighted bold",
    ]) {
      await expect(root.getByText(label, { exact: true })).toHaveCSS("color", "rgb(239, 68, 68)");
    }
    await expect(root.locator("p > span").filter({ hasText: /^Plain / })).toHaveCSS(
      "color",
      "rgb(239, 68, 68)"
    );
    await expect(root.getByText("Highlighted bold")).toHaveCSS("font-size", "20px");
    await expect(root.getByText("Highlighted bold").locator("..")).toHaveCSS(
      "background-color",
      "rgb(254, 240, 138)"
    );
    const defaultBoldColor = await root
      .getByText("Default bold")
      .evaluate((element) => getComputedStyle(element).color);
    await expect(root.getByText("Highlight only")).toHaveCSS("color", defaultBoldColor);
  }
});

async function measureBlocks(editor: Locator) {
  return editor.evaluate((root) =>
    Array.from(root.children).map((element) => {
      const style = getComputedStyle(element);
      return {
        tag: element.tagName,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
      };
    })
  );
}

for (const width of [360, 768, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`HeroUI prose composition at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 960 });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: theme as "light" | "dark" });
      await page.addInitScript(
        ({ modeKey, variantKey, mode }) => {
          localStorage.setItem(modeKey, mode);
          localStorage.setItem(variantKey, "mouve");
        },
        { modeKey: THEME_MODE_STORAGE_KEY, variantKey: THEME_VARIANT_STORAGE_KEY, mode: theme }
      );
      await page.route("https://www.youtube-nocookie.com/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<html><body>Video fixture</body></html>" })
      );
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/test/rich-text?typography=1");
      await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
      await expect(page.locator("html")).toHaveAttribute("data-theme", `mouve-${theme}`);
      const tableRadius = await page.evaluate(() => {
        const reference = document.createElement("div");
        reference.className = "table-root table-root--primary";
        reference.hidden = true;
        document.body.append(reference);
        const radius = getComputedStyle(reference).borderRadius;
        reference.remove();
        return radius;
      });

      let editMetrics: Awaited<ReturnType<typeof measureBlocks>> | undefined;
      for (const mode of ["edit", "read"]) {
        if (mode === "read") await page.getByTestId("toggle-reading").click();
        const editor = page.locator(`.ProseMirror[contenteditable="${mode === "edit"}"]`);
        await expect(editor).toBeVisible();
        await expect(editor).toHaveClass(/typography-prose/);
        await expect(editor).toHaveCSS("font-size", "16px");
        await expect(editor).toHaveCSS("line-height", "28px");
        await expect(editor.locator(":scope > :first-child")).toHaveCSS("margin-top", "0px");
        await expect(editor.locator(":scope > :last-child")).toHaveCSS("margin-bottom", "0px");
        for (const [tag, size, line, margin] of [
          ["h1", "36px", "40px", "32px"],
          ["h2", "30px", "36px", "32px"],
          ["h3", "24px", "32px", "24px"],
        ]) {
          const heading = editor.locator(tag).last();
          await expect(heading).toHaveCSS("font-size", size);
          await expect(heading).toHaveCSS("line-height", line);
          await expect(heading).toHaveCSS("letter-spacing", "normal");
          await expect(heading).toHaveCSS("margin-top", margin);
          await expect(heading).toHaveCSS("margin-bottom", "16px");
        }
        const paragraphs = editor.locator(":scope > p");
        await expect(paragraphs.first()).toHaveCSS("line-height", "28px");
        const paragraphGap = await paragraphs
          .nth(1)
          .evaluate(
            (element) =>
              element.getBoundingClientRect().top -
              element.previousElementSibling!.getBoundingClientRect().bottom
          );
        expect(paragraphGap).toBeCloseTo(16, 0);
        await expect(editor.locator("blockquote")).toHaveCSS("border-inline-start-width", "4px");
        await expect(editor.locator("blockquote p")).toHaveCSS("margin-top", "0px");
        await expect(editor.locator('ul[data-type="taskList"]').first()).toHaveCSS(
          "list-style-type",
          "none"
        );
        const task = editor.locator(".node-taskItem").first();
        await expect(task.locator("p")).toHaveCSS("margin-top", "0px");
        await expect(task.locator("p")).toHaveCSS("margin-bottom", "0px");
        await expect(task.locator("p")).toHaveCSS("text-decoration-line", "line-through");
        const parentTask = editor.locator(':scope > ul[data-type="taskList"] > li').nth(1);
        if (mode === "edit") {
          await parentTask.locator('[data-slot="checkbox-content"]').first().click();
        }
        await expect(parentTask.locator("[data-node-view-content-react] > p").first()).toHaveCSS(
          "text-decoration-line",
          "line-through"
        );
        await expect(editor.getByText("Nested child task", { exact: true })).toHaveCSS(
          "text-decoration-line",
          "none"
        );
        await expect(editor.locator("li > p").first()).toHaveCSS("line-height", "28px");
        await expect(editor.locator('ol[start="3"]')).toHaveCount(1);
        await expect(editor.locator("pre").last()).toHaveCSS("padding", "16px");
        await expect(editor.locator("pre code").last()).toHaveCSS("padding", "0px");
        await expect(editor.locator("pre code").last()).toHaveCSS("font-size", "14px");
        expect(
          await editor
            .locator("pre")
            .last()
            .evaluate((element) => element.scrollWidth > element.clientWidth)
        ).toBe(true);
        await expect(editor.locator("hr")).toHaveCSS("margin-top", "32px");
        const image = editor.getByRole("img", { name: "Schema fixture" });
        await expect(image).toHaveCSS("margin", "0px");
        await expect
          .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(0);
        await expect(editor.locator("figcaption")).toHaveCSS("margin-top", "8px");
        await expect(editor.locator("figcaption p")).toHaveCSS("font-size", "14px");
        await expect(editor.locator("figcaption p")).toHaveCSS("line-height", "24px");
        for (const selector of [
          ".node-image",
          ".node-audio",
          ".node-attachment",
          ".node-columns",
        ]) {
          await expect(editor.locator(selector)).toHaveCSS("margin-top", "16px");
          await expect(editor.locator(selector)).toHaveCSS("margin-bottom", "16px");
        }
        const tableWrapper = editor.locator(".tableWrapper");
        await expect(tableWrapper).toHaveCSS("border-radius", tableRadius);
        const squareRadius = await tableWrapper.evaluate((element) => {
          const previous = element.style.getPropertyValue("--radius");
          const priority = element.style.getPropertyPriority("--radius");
          try {
            element.style.setProperty("--radius", "0px");
            return getComputedStyle(element).borderRadius;
          } finally {
            if (previous) element.style.setProperty("--radius", previous, priority);
            else element.style.removeProperty("--radius");
          }
        });
        expect(squareRadius).toBe("0px");
        await expect(editor.locator("th")).toHaveCSS(
          "padding",
          width < 640 ? "10px 12px" : "12px 16px"
        );
        await expect(editor.locator("th p")).toHaveCSS("margin", "0px");
        await expect(editor.locator('[data-type="detailsContent"] p')).toHaveCSS("margin", "0px");
        await expect(editor.locator("[data-type=block-math]")).toHaveCSS("overflow-x", "auto");
        const columns = editor.locator('[data-type="column"]');
        const firstColumn = await columns.nth(0).boundingBox();
        const secondColumn = await columns.nth(1).boundingBox();
        expect(firstColumn).not.toBeNull();
        expect(secondColumn).not.toBeNull();
        expect(secondColumn!.y).toBeCloseTo(firstColumn!.y, 0);
        expect(secondColumn!.x).toBeGreaterThan(firstColumn!.x + firstColumn!.width);
        const iframe = await editor.locator("iframe").boundingBox();
        expect(iframe!.width / iframe!.height).toBeCloseTo(16 / 9, 1);
        await expect(editor.getByText("An explicit author format remains intact.")).toHaveCSS(
          "font-size",
          "20px"
        );
        await expect(editor.getByText("An explicit author format remains intact.")).toHaveCSS(
          "line-height",
          "40px"
        );
        await expect(editor.getByText("An explicit author format remains intact.")).toHaveCSS(
          "font-family",
          "monospace"
        );
        await expect(
          editor.getByText("An explicit author format remains intact.").locator("..")
        ).toHaveCSS("text-align", "center");
        await expect(editor.locator('[data-type="mention"]')).toHaveText("@Typography");
        await expect(editor.locator('[data-type="emoji"]')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        );
        const overflow = await editor.evaluate((root) => {
          const bounds = root.getBoundingClientRect();
          return [...root.children]
            .filter((child) => child.getBoundingClientRect().right > bounds.right + 1)
            .map((child) => child.className || child.tagName);
        });
        expect(overflow).toEqual([]);
        const metrics = await measureBlocks(editor);
        if (mode === "edit") editMetrics = metrics;
        else expect(metrics).toEqual(editMetrics);
        await page.screenshot({
          path: testInfo.outputPath(`${mode}-${width}-${theme}.png`),
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
    });
  }
}
