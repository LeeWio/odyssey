import { expect, test, type Locator, type Page } from "@playwright/test";
import { designArticle } from "./fixtures/articles";

async function openArticle(page: Page, slug = "entrance-regression") {
  await page.goto(`/single/${slug}`);
  await expect(page.locator("[data-article-body]")).toBeVisible();
  await expect(page.getByRole("button", { name: "Share article", exact: true })).toBeVisible();
}

declare global {
  interface Window {
    readingMotionSamples: Array<{
      target: Element;
      startedAt: number;
      duration?: number;
      opacity?: number[];
      filter?: string[];
      transform?: string[];
    }>;
  }
}

async function trackReadingMotion(page: Page) {
  await page.addInitScript(() => {
    window.readingMotionSamples = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, options) {
      if (this.closest("[data-article-body]") && keyframes && !Array.isArray(keyframes)) {
        const duration = typeof options === "number" ? options : options?.duration;
        window.readingMotionSamples.push({
          target: this,
          startedAt: performance.now(),
          duration: typeof duration === "number" ? duration : undefined,
          opacity: Array.isArray(keyframes.opacity) ? keyframes.opacity.map(Number) : undefined,
          filter: Array.isArray(keyframes.filter) ? keyframes.filter.map(String) : undefined,
          transform: Array.isArray(keyframes.transform)
            ? keyframes.transform.map(String)
            : undefined,
        });
      }
      return animate.call(this, keyframes, options);
    };
  });
}

function sampleFor(target: Locator) {
  return target.evaluate((element) =>
    window.readingMotionSamples
      .filter((sample) => sample.target === element)
      .map(({ startedAt, duration, opacity, filter, transform }) => ({
        startedAt,
        duration,
        opacity,
        filter,
        transform,
      }))
  );
}

async function approachReadingUnit(target: Locator) {
  await target.evaluate((element) => {
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - innerHeight - 130);
  });
  await expect
    .poll(() => target.evaluate((element) => element.getBoundingClientRect().top - innerHeight))
    .toBeGreaterThan(80);
  await target.page().waitForTimeout(220);
  await target.evaluate(() => window.scrollBy(0, 70));
}

test("opens the server document in order and reveals paragraphs once on a normal scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page);
  const body = page.locator("[data-article-body]");
  const paragraphs = body.locator(":scope > p");
  const first = paragraphs.first();
  const second = paragraphs.nth(1);
  const third = paragraphs.nth(2);
  await expect.poll(async () => (await sampleFor(third)).length).toBe(1);
  const [firstReveal] = await sampleFor(first);
  const [secondReveal] = await sampleFor(second);
  const [thirdReveal] = await sampleFor(third);
  expect(firstReveal).toMatchObject({
    opacity: [0, 1],
    filter: ["blur(8px)", "blur(0px)"],
    transform: ["translate3d(0, 18px, 0) scale(0.99)", "translate3d(0, 0, 0) scale(1)"],
    duration: 680,
  });
  expect(secondReveal!.startedAt - firstReveal!.startedAt).toBeGreaterThanOrEqual(85);
  expect(thirdReveal!.startedAt - secondReveal!.startedAt).toBeGreaterThanOrEqual(85);
  expect(await sampleFor(body)).toEqual([]);
  await expect(first).toHaveCSS("opacity", "1");
  await expect(body).toHaveCSS("opacity", "1");
  const paragraph = paragraphs.nth(35);
  await expect(paragraph).toHaveAttribute("data-reading-pending", "");
  await expect(paragraph).toHaveCSS("opacity", "0");
  expect(await sampleFor(paragraph)).toEqual([]);

  await approachReadingUnit(paragraph);
  await expect.poll(async () => (await sampleFor(paragraph)).length).toBe(1);
  const started = await sampleFor(paragraph);
  expect(started[0]).toMatchObject({ opacity: [0, 1], filter: ["blur(8px)", "blur(0px)"] });
  await expect(paragraph).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.scrollTo(0, 0));
  await paragraph.scrollIntoViewIfNeeded();
  expect(await sampleFor(paragraph)).toEqual(started);
});

async function holdReaderScripts(page: Page) {
  let release = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/**/*.js", async (route) => {
    await ready;
    await route.continue();
  });
  return release;
}

test("a slow reload keeps the first paint hidden until the ordered reveal starts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page);

  const release = await holdReaderScripts(page);
  const body = page.locator("[data-article-body]");
  const first = body.locator(":scope > p").first();
  const next = body.locator(":scope > p").nth(1);
  try {
    await page.reload({ waitUntil: "commit" });
    await expect(first).toHaveText("Paragraph 1. Read once, reveal once.");
    await expect(body).toHaveAttribute("data-reading-opening", "");
    await expect(body).toHaveCSS("opacity", "0");
    expect(
      await first.evaluate((element) => element.getBoundingClientRect().height)
    ).toBeGreaterThan(0);
    await page.waitForTimeout(800);
    await expect(body).toHaveCSS("opacity", "0");
    expect(await sampleFor(first)).toEqual([]);
  } finally {
    release();
  }

  await expect.poll(async () => (await sampleFor(first)).length).toBe(1);
  await expect(body).not.toHaveAttribute("data-reading-opening");
  await expect(body).toHaveCSS("opacity", "1");
  await expect.poll(async () => (await sampleFor(next)).length).toBe(1);
  const [firstReveal] = await sampleFor(first);
  const [nextReveal] = await sampleFor(next);
  expect(nextReveal!.startedAt - firstReveal!.startedAt).toBeGreaterThanOrEqual(85);
});

test("when startup times out the first viewport stays readable even after scripts arrive", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page);

  const release = await holdReaderScripts(page);
  const body = page.locator("[data-article-body]");
  const first = body.locator(":scope > p").first();
  try {
    await page.reload({ waitUntil: "commit" });
    await expect(body).toHaveCSS("opacity", "0");
    await expect(body).toHaveCSS("opacity", "1", { timeout: 4000 });
    await expect(first).toHaveCSS("opacity", "1");
  } finally {
    release();
  }

  await expect(body.locator(":scope > p").last()).toHaveAttribute("data-reading-pending", "");
  await expect(first).toHaveCSS("opacity", "1");
  expect(await sampleFor(first)).toEqual([]);
});

for (const [unit, descendant] of [
  ["ul:not([data-type]) > li", "p"],
  ["tr", "p"],
  ['[data-type="columns"]', "p"],
  ["figure", "img"],
] as const) {
  test(`reveals ${unit} as one semantic unit`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await trackReadingMotion(page);
    await openArticle(page, "entrance-nested");
    const target = page.locator("[data-article-body]").locator(unit).first();
    await approachReadingUnit(target);
    await expect.poll(async () => (await sampleFor(target)).length).toBe(1);
    if (unit === "figure") {
      expect((await sampleFor(target))[0]).toMatchObject({
        opacity: [0, 1],
        filter: ["blur(6px)", "blur(0px)"],
        transform: ["scale(1.025)", "scale(1)"],
        duration: 780,
      });
    }
    expect(await sampleFor(target.locator(descendant).first())).toEqual([]);
    await expect(target).toHaveCSS("opacity", "1");
  });
}

test("an active reveal cancels immediately on reduced motion and direct anchors stay visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page);
  const paragraph = page.locator("[data-article-body] > p").nth(35);
  await approachReadingUnit(paragraph);
  await expect
    .poll(() => paragraph.evaluate((element) => element.getAnimations().length))
    .toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => paragraph.evaluate((element) => element.getAnimations().length)).toBe(0);
  await expect(paragraph).toHaveCSS("opacity", "1");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/single/resume-reading#chapter-two");
  const chapter = page.locator("#chapter-two");
  await expect(chapter).toBeInViewport();
  await expect(chapter).toHaveCSS("opacity", "1");
  expect(await sampleFor(page.locator("[data-article-body]"))).toEqual([]);
  expect(await sampleFor(chapter)).toEqual([]);
});

test("a fast jump and settled reload keep the saved reading position visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page, "resume-reading");
  const body = page.locator("[data-article-body]");
  const chapter = body.locator("#chapter-two");
  await expect(body.locator("p").first()).toHaveCSS("opacity", "1");
  await chapter.evaluate((element) =>
    window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - 140)
  );
  await expect(chapter).toBeInViewport();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = sessionStorage.getItem("odyssey-reading-scroll");
        return saved ? Number(JSON.parse(saved).y) : 0;
      })
    )
    .toBeGreaterThan(600);
  expect(await sampleFor(chapter)).toEqual([]);

  const scrollBeforeReload = await page.evaluate(() => scrollY);
  await page.reload();
  await expect(chapter).toBeInViewport();
  await expect
    .poll(() => page.evaluate((position) => Math.abs(scrollY - position), scrollBeforeReload))
    .toBeLessThan(3);
  await expect(chapter).toHaveCSS("opacity", "1");
  expect(await sampleFor(body)).toEqual([]);
  expect(await sampleFor(chapter)).toEqual([]);
});

test("scrolling preserves the reader and does not replay revealed blocks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openArticle(page);
  const editor = page.locator("[data-article-body]");
  await expect(editor.locator(":scope > p")).toHaveCount(80);
  const originalEditor = await editor.elementHandle();
  if (!originalEditor) throw new Error("Reader was not mounted");

  const first = editor.locator(":scope > p").first();
  const last = editor.locator(":scope > p").last();
  await expect(last).toHaveAttribute("data-reading-pending", "");
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveCSS("opacity", "1");

  // Keep a record of even brief resets, rather than only checking the final frame.
  const replay = await first.evaluateHandle((block) => {
    const record = { replayed: false };
    const observer = new MutationObserver(() => {
      if (getComputedStyle(block).opacity !== "1") record.replayed = true;
    });
    observer.observe(block, { attributeFilter: ["data-reading-pending"] });
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
  const columns = editor.locator('[data-type="columns"]');
  const details = editor.locator(".odyssey-details");
  const image = editor.locator("figure");

  for (const target of [listItem, task, row, columns, details, image]) {
    await expect(target).toHaveAttribute("data-reading-pending", "");
  }
  await expect(editor.locator(".tableWrapper")).toHaveCSS("opacity", "1");
  await expect(row.locator("p")).toHaveCSS("opacity", "1");
  await expect(listItem.locator("p")).toHaveCSS("opacity", "1");

  for (const target of [listItem, task, row, columns, details, image]) {
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
  await expect(last).toHaveCSS("opacity", "0");
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

test("a tall block remains readable without blurring the entire surface", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page, "entrance-tall");
  const block = page.locator("[data-article-body] [data-reading-code]").last();
  await expect(block).toHaveCSS("opacity", "0");
  await approachReadingUnit(block);
  await expect(block).toHaveCSS("opacity", "1");
  expect(await sampleFor(block)).toEqual([]);
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
    await expect(page.locator("[data-article-body]")).toHaveCSS("opacity", "1");
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

for (const width of [390, 1600]) {
  test(`continuation fetches follow the visible reading surface at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    let catalogRequests = 0;
    let relatedRequests = 0;
    await page.route("**/api/v1/public/blog/posts/digest?**", (route) => {
      catalogRequests++;
      return route.fallback();
    });
    await page.route("**/api/v1/public/blog/posts/entrance-regression/related?**", (route) => {
      relatedRequests++;
      return route.fulfill({ json: { code: 200, message: "OK", data: [designArticle] } });
    });
    await openArticle(page);
    const footer = page.locator('section[aria-labelledby="article-same-subject"]');
    const rail = page.locator("[data-article-continue]");
    const relatedLink = { name: new RegExp(designArticle.title) };
    if (width >= 1536) {
      await expect(rail.getByRole("option", relatedLink)).toBeVisible();
      expect(relatedRequests).toBe(1);
    } else {
      await expect(rail).toBeHidden();
      expect(relatedRequests).toBe(0);
    }
    expect(catalogRequests).toBe(0);

    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByRole("link", relatedLink)).toBeVisible();
    await expect.poll(() => catalogRequests).toBe(1);
    expect(relatedRequests).toBe(1);
  });
}

for (const width of [390, 1440]) {
  test(`series detail follows the visible context at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    let requests = 0;
    await page.route("**/api/v1/public/columns/reading-series", (route) => {
      requests += 1;
      return route.fulfill({
        json: {
          code: 200,
          message: "OK",
          data: {
            id: 17,
            name: "Reading series",
            slug: "reading-series",
            isPublished: true,
            postsCount: 4,
            posts: [],
            createdAt: "2026-09-20T00:00:00Z",
          },
        },
      });
    });

    const pageview = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v1/public/analytics/pageviews") &&
        response.request().method() === "POST"
    );
    await openArticle(page, "entrance-series");
    await pageview;
    const rail = page.locator("[data-article-context]");
    if (width === 390) {
      await expect(rail).toBeHidden();
      expect(requests).toBe(0);
      await page.locator("#article-same-subject").scrollIntoViewIfNeeded();
      await expect(page.getByText("Part 2 of 4", { exact: true })).toBeVisible();
    } else {
      await expect(rail.getByText("Part 2 of 4", { exact: true })).toBeVisible();
    }
    expect(requests).toBe(1);
  });
}
