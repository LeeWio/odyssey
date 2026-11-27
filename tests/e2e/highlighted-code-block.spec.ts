import { expect, test } from "@playwright/test";

test("edits source inline and manages snippets and line numbers in the settings menu", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text: string) => localStorage.setItem("copied-snippet", text) },
    });
  });
  await page.goto("/test/rich-text");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  const editor = page.locator('.ProseMirror[contenteditable="true"]');
  await editor.locator("p").first().click();
  await page.getByRole("button", { name: "Insert highlighted code block" }).click();
  const block = editor.locator("[data-code-widget]");
  const settings = page.getByRole("toolbar", { name: "Code block settings" });
  const source = block.getByRole("textbox", { name: "Source code" });
  const lineNumbers = block.locator("[data-code-line-numbers]");
  const header = block.locator("[data-slot='widget-header']");
  const copy = header.getByRole("button", { name: "Copy code" });

  await expect(header.getByRole("radio", { name: "Untitled" })).toBeChecked();
  await expect(header.getByRole("button")).toHaveCount(1);
  await expect(copy).toBeVisible();
  await expect(page.getByRole("button", { name: "Code block settings" })).toHaveCount(0);
  await source.focus();
  await expect(settings).toBeVisible();
  await expect(block.getByRole("toolbar", { name: "Code block settings" })).toHaveCount(0);

  await settings.getByRole("button", { name: "Rename snippet" }).click();
  const rename = page.getByRole("dialog", { name: "Rename snippet" });
  const renameField = rename.getByRole("textbox", { name: "Snippet name" });
  const saveName = rename.getByRole("button", { name: "Save", exact: true });
  await expect(renameField).toBeFocused();
  await expect(renameField).toHaveValue("");
  await expect(saveName).toBeDisabled();
  await renameField.pressSequentially("Basic");
  await expect(saveName).toBeEnabled();
  await renameField.press("Enter");
  const first = block.getByRole("radio", { name: "Basic", exact: true });
  await expect(first).toBeChecked();

  await source.pressSequentially("const total = 42;");
  await source.press("Enter");
  await expect(source).toHaveValue("const total = 42;\n");
  await expect(source).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(source).toHaveCSS("backdrop-filter", "none");
  await expect(lineNumbers).toHaveJSProperty("textContent", "1\n2");
  await expect(settings.getByRole("textbox", { name: "Source code" })).toHaveCount(0);
  await settings.getByRole("button", { name: /Language/ }).click();
  await page.getByRole("option", { name: "TypeScript", exact: true }).click();
  const lineToggle = settings.getByRole("switch", { name: "Show line numbers" });
  await expect(lineToggle).toBeChecked();
  await lineToggle.press("Space");
  await expect(lineToggle).not.toBeChecked();
  await expect(lineNumbers).toHaveCount(0);

  const add = settings.getByRole("button", { name: "Add code snippet" });
  await add.click();
  const addDialog = page.getByRole("dialog", { name: "Add code snippet" });
  const name = addDialog.getByRole("textbox", { name: "Snippet name" });
  await expect(name).toBeFocused();
  await expect(addDialog.getByRole("button", { name: "Add", exact: true })).toBeDisabled();
  await name.fill("Canceled");
  await name.press("Escape");
  await expect(name).toBeHidden();
  await expect(block.getByRole("radio", { name: "Canceled" })).toHaveCount(0);
  await add.click();
  await name.fill("example.ts");
  const viewportBeforeAdding = await page.evaluate(() => window.scrollY);
  await name.press("Enter");
  const second = block.getByRole("radio", { name: "example.ts" });
  await expect(second).toBeChecked();
  await expect(second.locator("[data-slot=segment-indicator]")).toHaveCSS("translate", "none");
  const firstBounds = (await first.boundingBox())!;
  expect(firstBounds.y).toBeGreaterThanOrEqual(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(viewportBeforeAdding);
  await page.mouse.click(
    firstBounds.x + firstBounds.width / 2,
    firstBounds.y + firstBounds.height / 2
  );
  await expect(first).toBeChecked();
  await second.click();
  await source.fill("  <sample>\n");

  await copy.click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("copied-snippet")))
    .toBe("  <sample>\n");
  await block.getByRole("radio", { name: "Basic" }).press("Space");
  await expect(block.locator("[data-code-token]").first()).toHaveText("const");
  await expect(source).toHaveValue("const total = 42;\n");
  await copy.click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("copied-snippet")))
    .toBe("const total = 42;\n");
  await expect(lineNumbers).toHaveCount(0);
  await expect(editor.locator('pre code[class="language-typescript"]')).toHaveCount(1);

  await page.getByTestId("save-draft").click();
  await page.reload();
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  await expect(block.getByRole("radio", { name: "Basic" })).toBeChecked();
  await expect(lineNumbers).toHaveCount(0);
  await expect(source).toHaveValue("const total = 42;\n");
  await block.getByRole("radio", { name: "example.ts" }).click();
  await expect(source).toHaveValue("  <sample>\n");
  await expect(lineToggle).not.toBeChecked();
  await lineToggle.press("Space");
  await expect(lineNumbers).toHaveCount(1);
  await settings.getByRole("button", { name: "Remove snippet" }).click();
  await expect(block.getByRole("radio", { name: "example.ts" })).toHaveCount(0);
  await expect(source).toHaveValue("const total = 42;\n");
  await editor.locator("p").first().click();
  await expect(settings).toBeHidden();
});

test("allows multiple snippets only in Segment chrome", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text: string) => localStorage.setItem("copied-snippet", text) },
    });
  });
  await page.goto("/test/rich-text?preview=highlighted-code");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  const editor = page.locator('.ProseMirror[contenteditable="true"]');
  const block = editor.locator("[data-code-block-editor]").first();
  const settings = page.getByRole("toolbar", { name: "Code block settings" });
  const appearance = settings.getByRole("button", { name: /Code block appearance/ });
  const source = block.getByRole("textbox", { name: "Source code" });
  const addSnippet = settings.getByRole("button", { name: "Add code snippet" });
  const windows = block.locator('[data-code-chrome="windows"]');
  const minimal = block.locator('[data-code-chrome="none"]');
  const snippet = 'print("Chrome preview")';

  await source.focus();
  await appearance.click();
  await expect(page.getByRole("option", { name: "Windows", exact: true })).toBeDisabled();
  await expect(page.getByRole("option", { name: "None", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(block.getByRole("radio", { name: "Basic", exact: true })).toBeChecked();
  await expect(block.getByRole("radio", { name: "example.py", exact: true })).toBeVisible();
  await settings.getByRole("button", { name: "Remove snippet" }).click();

  await appearance.click();
  await page.getByRole("option", { name: "Windows", exact: true }).click();
  await expect(windows).toHaveCount(1);
  await expect(addSnippet).toHaveCount(0);
  await expect(block.locator('[data-slot="widget-title"]')).toHaveText("example.py");
  await source.fill(snippet);
  await windows.getByRole("button", { name: "Copy code" }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("copied-snippet")))
    .toBe(snippet);
  const lineToggle = settings.getByRole("switch", { name: "Show line numbers" });
  await lineToggle.press("Space");
  await expect(block.locator("[data-code-line-numbers]")).toHaveCount(0);

  await appearance.click();
  await page.getByRole("option", { name: "None", exact: true }).click();
  await expect(minimal).toHaveCount(1);
  await expect(addSnippet).toHaveCount(0);
  await expect(block.locator('[data-slot="widget-header"]')).toHaveCount(0);
  await expect(block.getByRole("button", { name: "Copy code" })).toHaveCount(0);
  await expect(source).toHaveValue(snippet);
  await page.getByTestId("save-draft").click();
  await page.reload();
  await expect(minimal).toHaveCount(1);

  await page.getByTestId("toggle-reading").click();
  const reading = page.locator('[data-code-chrome="none"]').first();
  await expect(reading.locator("code")).toHaveText(snippet);

  await page.getByTestId("toggle-reading").click();
  await source.focus();
  await appearance.click();
  await page.getByRole("option", { name: "Segment", exact: true }).click();
  await expect(block.getByRole("radio", { name: "example.py" })).toBeChecked();
  await expect(source).toHaveValue(snippet);
  await expect(addSnippet).toBeVisible();
});

test("@smoke switches Frame independently of the selected snippet and preserves it in reading mode", async ({
  page,
}) => {
  await page.goto("/test/rich-text?preview=highlighted-code");
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  const block = page.locator("[data-code-widget]").first();
  const content = block.locator('[data-slot="widget-content"]');
  const frame = page
    .getByRole("toolbar", { name: "Code block settings" })
    .getByRole("button", { name: /Frame/ });
  const second = block.getByRole("radio", { name: "example.py" });

  await expect(block).toHaveAttribute("data-code-frame", "inset");
  await expect(content).not.toHaveCSS("margin-inline-start", "0px");
  await second.click();
  await frame.click();
  await page.getByRole("option", { name: "Solid", exact: true }).click();
  await expect(block).toHaveAttribute("data-code-frame", "solid");
  await expect(content).toHaveCSS("margin-inline-start", "0px");
  await expect(content).toHaveCSS("margin-bottom", "0px");
  await expect(content).toHaveCSS("border-top-left-radius", "0px");
  await expect(second).toBeChecked();
  await expect(block.getByRole("textbox", { name: "Source code" })).toHaveValue(
    /print\(greeting\)/
  );

  await page.getByTestId("save-draft").click();
  await page.reload();
  await expect(block).toHaveAttribute("data-code-frame", "solid");
  await page.getByTestId("toggle-reading").click();
  await expect(block).toHaveAttribute("data-code-frame", "solid");
  await expect(content).toHaveCSS("margin-inline-start", "0px");
  await expect(block.locator("code")).toContainText("const greeting");
});

test("renders the first snippet on the server and switches and copies on narrow screens", async ({
  browser,
  baseURL,
  page,
}) => {
  const noScript = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
    colorScheme: "light",
  });
  try {
    const articleUrl = new URL("/single/highlighted-code", baseURL);
    await noScript.addCookies([
      { name: "odyssey_theme_mode", value: "light", url: articleUrl.origin },
    ]);
    const serverPage = await noScript.newPage();
    await serverPage.goto(articleUrl.href);
    await expect(serverPage.getByRole("radio", { name: "Basic" })).toBeChecked();
    const keyword = serverPage.locator("[data-code-token]").first();
    await expect(keyword).toHaveText("export");
    await expect(keyword).toHaveCSS("color", "rgb(215, 58, 73)");
    await expect(serverPage.locator("[data-code-line-numbers]")).toHaveCount(1);
  } finally {
    await noScript.close();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("odyssey_theme_mode", "dark");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text: string) => localStorage.setItem("copied-snippet", text) },
    });
  });
  await page.goto("/single/highlighted-code");
  const block = page.locator("[data-code-widget]");
  const keyword = block.locator("[data-code-token]").first();
  await expect(keyword).toHaveCSS("color", "rgb(249, 117, 131)");
  await block.getByRole("radio", { name: "example.py" }).click();
  await expect(block.getByRole("radio", { name: "example.py" })).toBeChecked();
  await expect(block.locator("pre")).toHaveCSS("overflow-x", "auto");
  expect(await block.locator("pre").evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await block.getByRole("button", { name: "Copy code" }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("copied-snippet")))
    .toBe(`message = "${"A long line ".repeat(18)}"\nprint(message)\n`);
});

test("inserts a widget from the slash menu and selects its language in the article editor modal", async ({
  page,
}) => {
  await page.goto("/test/rich-text?modal=1");
  await page.getByRole("button", { name: "Open editor", exact: true }).click();
  const editor = page.locator('.ProseMirror[contenteditable="true"]');
  await editor.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("/highlighted");
  await page.getByRole("option", { name: /^Highlighted code block/ }).click();

  const block = editor.locator("[data-code-widget]");
  await block.getByRole("textbox", { name: "Source code" }).focus();
  const settings = page.getByRole("toolbar", { name: "Code block settings" });
  await settings.getByRole("button", { name: /Language/ }).click();
  await page.getByRole("option", { name: "Python", exact: true }).click();
  await settings.getByRole("button", { name: "Rename snippet" }).click();
  const name = page.getByRole("dialog", { name: "Rename snippet" }).getByRole("textbox");
  await name.fill("Props");
  await name.press("Enter");
  await block.getByRole("textbox", { name: "Source code" }).fill("def answer():\n    return 42");
  await expect(block.getByRole("radio", { name: "Props" })).toBeChecked();
  await expect(block.locator("[data-code-token]").first()).toHaveText("def");
});
