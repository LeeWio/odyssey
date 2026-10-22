import { expect, test, type Locator } from "@playwright/test";
import { THEME_MODE_STORAGE_KEY, THEME_VARIANT_STORAGE_KEY } from "../../lib/theme";

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
        await expect(editor.locator("th")).toHaveCSS("padding", "8px 12px");
        await expect(editor.locator("th p")).toHaveCSS("margin", "0px");
        await expect(editor.locator('[data-type="detailsContent"] p')).toHaveCSS("margin", "0px");
        await expect(editor.locator("[data-type=block-math]")).toHaveCSS("overflow-x", "auto");
        const columns = editor.locator('[data-type="column"]');
        const firstColumn = await columns.nth(0).boundingBox();
        const secondColumn = await columns.nth(1).boundingBox();
        expect(firstColumn).not.toBeNull();
        expect(secondColumn).not.toBeNull();
        if (width < 640)
          expect(secondColumn!.y).toBeGreaterThan(firstColumn!.y + firstColumn!.height);
        else expect(secondColumn!.y).toBeCloseTo(firstColumn!.y, 0);
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
