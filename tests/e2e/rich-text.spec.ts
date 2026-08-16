import { expect, test } from "@playwright/test";

const editorSelector = '.ProseMirror[contenteditable="true"]';

test.beforeEach(async ({ page }) => {
  await page.goto("/test/rich-text", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
});

test("loads the persisted schema fixture in the real editor", async ({ page }) => {
  const editor = page.locator(editorSelector);

  await expect(editor).toBeVisible();
  await expect(editor.locator("h1")).toHaveText("Odyssey schema fixture");
  await expect(page.getByTestId("schema-nodes")).toContainText("columns");
  await expect(page.getByTestId("schema-nodes")).toContainText("details");
  await expect(page.getByTestId("schema-nodes")).toContainText("table");
  await expect(page.getByTestId("schema-nodes")).toContainText("taskList");
  await expect(editor.locator('ul[data-type="taskList"]')).toHaveCount(2);
  await expect(editor.locator("li.odyssey-task-item")).toHaveCount(3);
  await expect(editor.locator('pre code[class="language-typescript"]')).toContainText(
    "const stable = true;"
  );
  await expect(page.getByText(/\d+ characters, \d+ words/)).toBeVisible();
  await expect(page.getByTestId("draft-status")).not.toContainText("Content error");
});

test("creates a task list from the HeroUI toolbar", async ({ page }) => {
  const editor = page.locator(editorSelector);
  const paragraph = editor.locator("p").filter({ hasText: "Bold and linked text" });

  await paragraph.click();
  await page.getByRole("button", { name: "Toggle task list" }).click();
  await expect(editor.locator("ul.odyssey-task-list")).toHaveCount(3);
  await expect(editor.locator("li.odyssey-task-item")).toHaveCount(4);
});

test("preserves nested tasks and code language after save and reload", async ({ page }) => {
  const editor = page.locator(editorSelector);
  const completedTask = page.getByRole("checkbox", { name: /Completed task/ });

  await expect(completedTask).toBeChecked();
  await completedTask.click();
  await expect(completedTask).not.toBeChecked();

  await page.getByTestId("save-draft").click();
  await expect(page.getByTestId("draft-status")).toHaveText("Draft saved");
  await page.reload();
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");

  await expect(editor.locator('ul[data-type="taskList"]')).toHaveCount(2);
  await expect(editor.locator("li.odyssey-task-item")).toHaveCount(3);
  await expect(page.getByRole("checkbox", { name: /Completed task/ })).not.toBeChecked();
  await expect(editor.locator('pre code[class="language-typescript"]')).toContainText(
    "const stable = true;"
  );
});

test("supports find and replace from keyboard and mouse", async ({ page }) => {
  const editor = page.locator(editorSelector);

  await editor.locator("p").first().click();
  await page.keyboard.press("Meta+f");
  await expect(page.getByRole("dialog", { name: "Find and replace" })).toBeVisible();

  await page.getByPlaceholder("Find").fill("Nested");
  await expect(page.getByText("1 / 3")).toBeVisible();
  await page.getByPlaceholder("Replace").fill("Layered");
  await page.getByRole("button", { name: "Replace all" }).click();
  await expect(editor).not.toContainText("Nested");
  await expect(editor).toContainText("Layered child task");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Find and replace" })).toBeHidden();
  await page.getByRole("button", { name: "Find and replace" }).click();
  await expect(page.getByRole("dialog", { name: "Find and replace" })).toBeVisible();
});

test("applies find options and regex examples", async ({ page }) => {
  const editor = page.locator(editorSelector);

  await editor.locator("p").first().click();
  await page.keyboard.press("Meta+f");
  await page.getByPlaceholder("Find").fill("nested");
  await expect(page.getByText("1 / 3")).toBeVisible();

  await page.getByRole("switch", { name: "Match case" }).press("Space");
  await expect(page.getByText("0 / 0")).toBeVisible();
  await page.getByRole("switch", { name: "Match case" }).press("Space");

  await page.getByPlaceholder("Find").fill("Nest");
  await expect(page.getByText("1 / 3")).toBeVisible();
  await page.getByRole("switch", { name: "Whole words" }).press("Space");
  await expect(page.getByText("0 / 0")).toBeVisible();

  await page.getByRole("switch", { name: "Use regular expression" }).press("Space");
  await expect(page.getByRole("switch", { name: "Whole words" })).toBeDisabled();
  await page.getByRole("button", { name: /Either term/ }).click();
  await expect(page.getByPlaceholder("Find")).toHaveValue("cat|tiptap");
});

test("selects, reorders, duplicates and deletes blocks from the drag handle menu", async ({
  page,
}) => {
  const editor = page.locator(editorSelector);
  const paragraph = editor.locator("p").filter({ hasText: "Bold and linked text" });

  await paragraph.hover();
  await expect(page.getByRole("button", { name: "Block actions" })).toBeVisible();
  await page.getByRole("button", { name: "Block actions" }).click();
  await expect(page.getByRole("menu", { name: "Block actions" })).toBeVisible();
  await expect(paragraph).toHaveClass(/ProseMirror-selectednode/);

  await page.getByRole("menuitem", { name: "Move down" }).click();
  await expect(editor.locator(":scope > ul").first()).toHaveText("List item");
  await expect(editor.locator(":scope > p").first()).toContainText("Bold and linked text");
  await page.getByTestId("save-draft").click();
  await expect(page.getByTestId("draft-status")).toHaveText("Draft saved");
  await page.reload();
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  await expect(editor.locator(":scope > ul").first()).toHaveText("List item");
  await expect(editor.locator(":scope > p").first()).toContainText("Bold and linked text");

  await paragraph.hover();
  await page.getByRole("button", { name: "Block actions" }).click();
  await page.getByRole("menuitem", { name: "Duplicate" }).click();
  await expect(editor.locator("p").filter({ hasText: "Bold and linked text" })).toHaveCount(2);

  await editor.locator("p").filter({ hasText: "Bold and linked text" }).last().hover();
  await page.getByRole("button", { name: "Block actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(editor.locator("p").filter({ hasText: "Bold and linked text" })).toHaveCount(1);
});

test("filters and inserts blocks from the slash menu with the keyboard", async ({ page }) => {
  const editor = page.locator(editorSelector);
  const emptyParagraph = editor.locator("p").last();

  await emptyParagraph.click();
  await page.keyboard.type("/h2");
  await expect(page.getByRole("listbox", { name: "Insert block" })).toBeVisible();
  await expect(page.getByRole("option", { name: /Heading 2/ })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(editor.locator("h2").last()).toBeEmpty();
});

test("animates paragraph and heading transformations and respects reduced motion", async ({
  page,
}) => {
  const editor = page.locator(editorSelector);
  const paragraph = editor.locator("p").filter({ hasText: "Bold and linked text" });

  await paragraph.click();
  await page.getByRole("button", { name: "Block type: Text" }).click();
  await page.getByRole("menuitemradio", { name: "Heading 2" }).click();

  const heading = editor.locator("h2").filter({ hasText: "Bold and linked text" });
  const animations = await heading.evaluate((element) =>
    element.getAnimations().map((animation) => ({
      duration: animation.effect?.getTiming().duration,
      keyframes: animation.effect instanceof KeyframeEffect ? animation.effect.getKeyframes() : [],
    }))
  );

  expect(animations).toHaveLength(1);
  expect(animations[0]?.duration).toBe(200);
  expect(animations[0]?.keyframes[0]).toHaveProperty("fontSize");

  await page.waitForTimeout(250);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await heading.click();
  await page.getByRole("button", { name: "Block type: Heading 2" }).click();
  await page.getByRole("menuitemradio", { name: "Text" }).click();
  await expect(editor.locator("p").filter({ hasText: "Bold and linked text" })).toBeVisible();
  await expect(
    editor
      .locator("p")
      .filter({ hasText: "Bold and linked text" })
      .evaluate((element) =>
        element.getAnimations().filter((animation) => animation.playState !== "finished")
      )
  ).resolves.toHaveLength(0);
});

test("changes the code language and preserves it after reload", async ({ page }) => {
  const editor = page.locator(editorSelector);

  await editor.locator("pre").click();
  await page.getByRole("button", { name: "Code language: TypeScript" }).click();
  await page.getByRole("menuitemradio", { name: "Python" }).click();
  await expect(editor.locator('pre code[class="language-python"]')).toContainText(
    "const stable = true;"
  );

  await page.getByTestId("save-draft").click();
  await page.reload();
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  await expect(editor.locator('pre code[class="language-python"]')).toContainText(
    "const stable = true;"
  );
});

test("opens shortcut help by mouse and keyboard", async ({ page }) => {
  const editor = page.locator(editorSelector);

  await page.getByRole("button", { name: "Shortcuts" }).click();
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Shortcuts" })).toBeFocused();

  await editor.locator("p").first().click();
  await page.keyboard.press("Meta+/");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
});

test("edits, formats, saves and recovers a local draft", async ({ page }) => {
  const editor = page.locator(editorSelector);
  const firstParagraph = editor.locator("p").first();

  await firstParagraph.click();
  await page.keyboard.press("End");
  await page.keyboard.type(" persisted browser marker");
  await expect(editor).toContainText("persisted browser marker");

  await page.getByRole("button", { name: /^Block type:/ }).click();
  await page.getByRole("menuitemradio", { name: "Heading 2" }).click();
  await expect(editor.locator("h2")).toContainText("persisted browser marker");

  await page.getByTestId("save-draft").click();
  await expect(page.getByTestId("draft-status")).toHaveText("Draft saved");

  await page.reload();
  await expect(page.getByTestId("draft-status")).toHaveText("Editor ready");
  await expect(page.locator(editorSelector)).toContainText("persisted browser marker");

  await page.getByTestId("clear-editor").click();
  await expect(page.locator(editorSelector)).not.toContainText("persisted browser marker");
  await page.getByTestId("restore-draft").click();
  await expect(page.getByTestId("draft-status")).toHaveText("Draft restored");
  await expect(page.locator(editorSelector)).toContainText("persisted browser marker");
});
