import { expect, test, type Page } from "@playwright/test";

async function openArticle(page: Page, slug = "entrance-regression") {
  await page.goto(`/single/${slug}`);
  await expect(page.locator("[data-article-body]")).toBeVisible();
  await expect(page.getByRole("button", { name: "Share article", exact: true })).toBeVisible();
}

test("scrolling preserves the reader and does not replay revealed blocks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openArticle(page);
  const editor = page.locator("[data-article-body]");
  await expect(editor.locator(":scope > p")).toHaveCount(80);
  const originalEditor = await editor.elementHandle();
  if (!originalEditor) throw new Error("Reader was not mounted");

  const first = editor.locator(":scope > p").first();
  const last = editor.locator(":scope > p").last();
  await expect(last).toHaveCSS("opacity", "1");
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveCSS("opacity", "1");

  // Keep a record of even brief resets, rather than only checking the final frame.
  const replay = await first.evaluateHandle((block) => {
    const record = { replayed: false };
    const observer = new MutationObserver(() => {
      if (getComputedStyle(block).opacity !== "1") record.replayed = true;
    });
    observer.observe(block, { attributes: true, attributeFilter: ["style"] });
    return { record, observer };
  });

  for (let pass = 0; pass < 2; pass += 1) {
    await last.scrollIntoViewIfNeeded();
    await expect(last).toHaveCSS("opacity", "1");
    await first.scrollIntoViewIfNeeded();
    // The page updates its action bar after scrolling has settled for 700ms.
    await page.waitForTimeout(850);
    expect(await originalEditor.evaluate((node) => node.isConnected)).toBe(true);
    await expect(first).toHaveCSS("opacity", "1");
    expect(await replay.evaluate(({ record }) => record.replayed)).toBe(false);
  }

  await replay.evaluate(({ observer }) => observer.disconnect());
});

test("nested reading units wait for the viewport without animating parent and child together", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openArticle(page, "entrance-nested");
  const editor = page.locator("[data-article-body]");
  const row = editor.locator("tr").first();
  const listItem = editor.locator("ul:not([data-type]) > li").first();
  const task = editor.locator('li[data-type="taskItem"]').first();
  const columnParagraph = editor.locator('[data-type="column"] p').first();
  const details = editor.locator(".odyssey-details");
  const image = editor.locator("figure img");

  for (const target of [listItem, task, row, columnParagraph, details, image]) {
    await expect(target).toHaveCSS("opacity", "1");
  }
  await expect(editor.locator(".tableWrapper")).toHaveCSS("opacity", "1");
  await expect(row.locator("p")).toHaveCSS("opacity", "1");
  await expect(listItem.locator("p")).toHaveCSS("opacity", "1");

  for (const target of [listItem, task, row, columnParagraph, details, image]) {
    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveCSS("opacity", "1");
    await expect(target).toHaveCSS("transform", /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  }
});

test("reduced motion reveals pending content immediately and never re-hides it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openArticle(page);
  const last = page.locator("[data-article-body] > p").last();
  await expect(last).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(last).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveCSS("opacity", "1");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/single/entrance-regression");
  await expect(page.locator("[data-article-body]")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator("[data-article-body] > p").last()).toHaveCSS("opacity", "1");
});

test("a block taller than the viewport still reveals on entry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openArticle(page, "entrance-tall");
  const block = page.locator("[data-article-body] pre").last();
  await expect(block).toHaveCSS("opacity", "1");
  await block.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect(block).toHaveCSS("opacity", "1");
});

test("code blocks expose a copy action", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => window.localStorage.setItem("copied-code", value),
      },
    });
  });
  await openArticle(page, "entrance-copy");

  const codeBlock = page.locator("[data-reading-code]");
  await expect(codeBlock.getByRole("button", { name: "Copy code" })).toBeVisible();
  await codeBlock.getByRole("button", { name: "Copy code" }).click();
  await expect(page.getByText("Code copied.", { exact: true })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("copied-code")))
    .toBe("const answer = 42;");
});

test("the document and stored anchors are readable without browser JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, locale: "en-US" });
  try {
    const page = await context.newPage();
    await page.goto("/single/mobile-reading");
    await expect(page.getByRole("heading", { name: "Chapter one", exact: true })).toHaveAttribute(
      "id",
      "chapter-one"
    );
    await expect(page.locator("[data-article-body] pre").first()).toBeVisible();
    await expect(page.locator("[data-article-body] [contenteditable]")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("a failed viewer refresh does not replace the server article", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "reader-fixture",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    );
  });
  const path = "/api/v1/public/blog/posts/entrance-copy";
  await page.route(`**${path}`, (route) =>
    route.fulfill({ status: 503, json: { message: "Viewer unavailable" } })
  );
  const request = page.waitForResponse(
    (response) => new URL(response.url()).pathname === path && response.status() === 503
  );
  await openArticle(page, "entrance-copy");
  await request;
  await expect(page.locator("[data-article-body] code")).toHaveText("const answer = 42;");
});
