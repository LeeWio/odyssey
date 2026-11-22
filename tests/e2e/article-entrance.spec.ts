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
      target: HTMLElement;
      startedAt: number;
      opacity: number;
      blur: number;
      y: number;
      scale: number;
      readableWhileMoving: boolean;
    }>;
  }
}

async function trackReadingMotion(page: Page) {
  await page.addInitScript(() => {
    window.readingMotionSamples = [];
    const active = new WeakMap<HTMLElement, (typeof window.readingMotionSamples)[number]>();
    new MutationObserver((records) => {
      for (const { target } of records) {
        if (!(target instanceof HTMLElement)) continue;
        const { filter, opacity } = target.style;
        if (opacity === "" && !filter.startsWith("blur(")) {
          active.delete(target);
          continue;
        }
        if (!target.closest("[data-article-body]")) continue;

        const blur = filter.startsWith("blur(") ? Number.parseFloat(filter.slice(5)) : 0;
        const sample = active.get(target);
        const readable = Number(opacity) >= 0.94 && blur <= 0.75;
        if (sample?.readableWhileMoving || (sample && !readable)) continue;

        const transform = getComputedStyle(target).transform;
        const matrix = new DOMMatrixReadOnly(transform === "none" ? undefined : transform);
        if (sample) {
          sample.readableWhileMoving = matrix.m42 > 2;
        } else {
          const start = {
            target,
            startedAt: performance.now(),
            opacity: Number(opacity),
            blur,
            y: matrix.m42,
            scale: matrix.m11,
            readableWhileMoving: false,
          };
          active.set(target, start);
          window.readingMotionSamples.push(start);
        }
      }
    }).observe(document, { attributes: true, attributeFilter: ["style"], subtree: true });
  });
}

function sampleFor(target: Locator) {
  return target.evaluate((element) =>
    window.readingMotionSamples
      .filter((sample) => sample.target === element)
      .map(({ startedAt, opacity, blur, y, scale }) => ({ startedAt, opacity, blur, y, scale }))
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
  expect(firstReveal).toMatchObject({ opacity: 0, blur: 7, y: 16, scale: 1 });
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
  expect(started[0]).toMatchObject({ opacity: 0, blur: 7, y: 16, scale: 1 });
  await expect(paragraph).toHaveCSS("filter", "none");
  await expect(paragraph).toHaveCSS("transform", "none");
  await expect(paragraph).toHaveCSS("opacity", "1");
  expect(
    await paragraph.evaluate(
      (element) =>
        window.readingMotionSamples.find(({ target }) => element === target)?.readableWhileMoving
    )
  ).toBe(true);
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

async function savePositionBefore(target: Locator, gap: number) {
  const y = await target.evaluate((element, bottomGap) => {
    window.scrollTo(
      0,
      Math.floor(element.getBoundingClientRect().top + scrollY - innerHeight - bottomGap)
    );
    return scrollY;
  }, gap);
  expect(y).toBeGreaterThan(0);
  await expect
    .poll(() =>
      target
        .page()
        .evaluate(() => JSON.parse(sessionStorage.getItem("odyssey-reading-scroll") ?? "null")?.y)
    )
    .toBe(y);
  return y;
}

test("plays new reveals across desktop wheel steps after a mid-article reload @smoke", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page);
  const paragraphs = page.locator("[data-article-body] > p");
  const next = paragraphs.nth(35);
  const later = paragraphs.nth(39);
  const y = await savePositionBefore(next, 40);

  await page.reload();
  await expect(next).toHaveAttribute("data-reading-pending", "");
  expect(await sampleFor(next)).toEqual([]);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
  await page.mouse.move(640, 850);

  await page.mouse.wheel(0, 120);
  await expect.poll(async () => (await sampleFor(next)).length).toBe(1);
  await page.mouse.wheel(0, 120);
  await expect.poll(async () => (await sampleFor(later)).length).toBe(1);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y + 240);
});

test("a mid-article reload reveals every visible paragraph including the clipped first one @smoke", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page);
  const paragraphs = page.locator("[data-article-body] > p");
  const firstIndex = 27;
  const offset = await paragraphs.nth(firstIndex).evaluate((element) => {
    window.scrollTo(0, Math.round(element.getBoundingClientRect().top + scrollY + 9));
    return scrollY;
  });
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(sessionStorage.getItem("odyssey-reading-scroll") ?? "null")?.y)
    )
    .toBe(offset);

  await page.reload();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(offset);
  const visible = await paragraphs.evaluateAll((blocks) =>
    blocks.flatMap((block, index) => {
      const rect = block.getBoundingClientRect();
      const transform = getComputedStyle(block).transform;
      const y = new DOMMatrixReadOnly(transform === "none" ? undefined : transform).m42;
      return rect.bottom - y > 0 && rect.top - y < innerHeight ? [index] : [];
    })
  );
  expect(visible[0]).toBe(firstIndex);
  expect(visible.length).toBeGreaterThan(10);

  await expect
    .poll(() =>
      paragraphs.evaluateAll((blocks, expected) => {
        const visible = new Set(expected);
        return window.readingMotionSamples
          .map(({ target }) => blocks.indexOf(target))
          .filter((index) => visible.has(index));
      }, visible)
    )
    .toEqual(visible);
  await expect(paragraphs.nth(visible.at(-1)!)).toHaveCSS("transform", "none");
});

test("a mid-article reload waits for a nearby image before choosing the visible reveal order", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  let holdImage = false;
  let releaseImage = () => {};
  const imageReady = new Promise<void>((resolve) => {
    releaseImage = resolve;
  });
  await page.route("**/odyssey-hero.webp", async (route) => {
    if (holdImage) await imageReady;
    await route.continue();
  });
  await openArticle(page, "entrance-nested");
  const body = page.locator("[data-article-body]");
  const image = body.getByRole("img", { name: "Schema fixture" });
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalHeight))
    .toBeGreaterThan(0);
  const paragraphs = body.locator(":scope > p");
  const first = paragraphs.nth(84);
  const last = paragraphs.nth(92);
  const offset = await savePositionBefore(first, -550);
  holdImage = true;
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(offset);
    await expect(body).toHaveAttribute("data-reading-opening", "");
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.readingMotionSamples.length)).toBe(0);
  } finally {
    releaseImage();
  }
  await expect.poll(async () => (await sampleFor(first)).length).toBe(1);
  await expect.poll(async () => (await sampleFor(last)).length).toBe(1);
  const starts = await paragraphs.evaluateAll((blocks) =>
    window.readingMotionSamples.map(({ target }) => blocks.indexOf(target))
  );
  expect(starts.filter((index) => index >= 84 && index <= 92)).toEqual(
    Array.from({ length: 9 }, (_, index) => 84 + index)
  );
  await expect(body).not.toHaveAttribute("data-reading-opening");
});

test("reveals every visible paragraph in order during regular wheel steps @smoke", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page);
  const paragraphs = page.locator("[data-article-body] > p");
  const first = paragraphs.nth(35);
  const y = await savePositionBefore(first, 40);

  await page.reload();
  await expect(first).toHaveAttribute("data-reading-pending", "");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
  await page.mouse.move(640, 850);
  for (let step = 1; step <= 6; step += 1) {
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(y + step * 120);
    await page.waitForTimeout(185);
  }
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y + 720);
  await expect(first).toBeInViewport();
  await expect(paragraphs.nth(46)).toBeInViewport();

  await expect
    .poll(() =>
      paragraphs.evaluateAll((blocks) => {
        const visible: Element[] = blocks.slice(35, 47);
        return window.readingMotionSamples
          .map(({ target }) => visible.indexOf(target))
          .filter((index) => index >= 0);
      })
    )
    .toEqual(Array.from({ length: 12 }, (_, index) => index));
});

test("a fast scroll reveals each visible paragraph in order and leaves the viewport settled", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page);
  const paragraphs = page.locator("[data-article-body] > p");
  const first = paragraphs.nth(35);
  const y = await savePositionBefore(first, 40);

  await page.reload();
  await expect(first).toHaveAttribute("data-reading-pending", "");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
  const afterBurst = await page.evaluate(async () => {
    for (let step = 0; step < 6; step += 1) {
      await new Promise(requestAnimationFrame);
      window.scrollBy(0, 120);
    }
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return performance.now();
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y + 720);
  await expect(paragraphs.nth(35)).toBeInViewport();
  await expect(paragraphs.nth(46)).toBeInViewport();
  await expect
    .poll(() =>
      paragraphs.evaluateAll((blocks) => {
        const measured = blocks.slice(35, 47);
        return window.readingMotionSamples
          .map(({ target }) => measured.indexOf(target))
          .filter((index) => index >= 0);
      })
    )
    .toEqual(Array.from({ length: 12 }, (_, index) => index));
  const [last] = await sampleFor(paragraphs.nth(46));
  expect(last!.startedAt - afterBurst).toBeLessThan(180);
  await expect(paragraphs.nth(46)).toHaveCSS("opacity", "1");
  await expect(paragraphs.nth(46)).toHaveCSS("filter", "none");
  await expect(paragraphs.nth(46)).toHaveCSS("transform", "none");

  await page.waitForTimeout(200);
  const nextIndex = await paragraphs.evaluateAll((blocks) =>
    blocks.findIndex((block) => block.hasAttribute("data-reading-pending"))
  );
  expect(nextIndex).toBeGreaterThan(46);
  await page.mouse.move(640, 850);
  await page.mouse.wheel(0, 120);
  await expect.poll(async () => (await sampleFor(paragraphs.nth(nextIndex))).length).toBe(1);
});

test("reveals the next paragraph when scrolling on the first frame after restoring a position", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page);
  const next = page.locator("[data-article-body] > p").nth(35);
  const y = await savePositionBefore(next, 100);
  await page.addInitScript(() => {
    if (
      (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type !==
      "reload"
    )
      return;
    const observer = new MutationObserver((records) => {
      if (!records.some(({ attributeName }) => attributeName === "data-reading-pending")) return;
      observer.disconnect();
      window.scrollBy(0, 60);
    });
    observer.observe(document, { attributes: true, subtree: true });
  });

  await page.reload();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y + 60);
  await expect.poll(async () => (await sampleFor(next)).length).toBe(1);
});

test("reveals a pending paragraph brought into view by layout after reload", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page);
  const next = page.locator("[data-article-body] > p").nth(35);
  const y = await savePositionBefore(next, 40);

  await page.reload();
  await expect(next).toHaveAttribute("data-reading-pending", "");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
  await next.evaluate((element) => {
    element.style.position = "relative";
    element.style.top = "-70px";
  });

  await expect.poll(async () => (await sampleFor(next)).length).toBe(1);
  expect(await page.evaluate(() => scrollY)).toBe(y);
});

test("uses a positive saved offset when the browser leaves the article at the top", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openArticle(page);
  const next = page.locator("[data-article-body] > p").nth(35);
  const y = await savePositionBefore(next, 100);
  await page.evaluate(() => {
    history.scrollRestoration = "manual";
  });

  await page.reload();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
  await expect(page.locator("[data-article-body]")).not.toHaveAttribute("data-reading-resume-y");
  await expect(next).toHaveAttribute("data-reading-pending", "");
});

for (const savedY of [0, 800]) {
  test(`keeps a scroll made before hydration on reload with a saved offset of ${savedY}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await openArticle(page);
    const body = page.locator("[data-article-body]");
    const last = body.locator(":scope > p").last();
    await expect(last).toHaveAttribute("data-reading-pending", "");
    await page.evaluate((y) => {
      history.scrollRestoration = "manual";
      window.scrollTo(0, y);
    }, savedY);
    await expect
      .poll(() =>
        page.evaluate(
          () => JSON.parse(sessionStorage.getItem("odyssey-reading-scroll") ?? "null")?.y
        )
      )
      .toBe(savedY);

    const release = await holdReaderScripts(page);
    try {
      await page.reload({ waitUntil: "commit" });
      if (savedY) await expect(body).toHaveAttribute("data-reading-resume-y", String(savedY));
      else await expect(body).toHaveAttribute("data-reading-opening", "");
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.mouse.move(640, 850);
      await page.mouse.wheel(0, 120);
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(120);
      await expect(body).not.toHaveAttribute("data-reading-opening");
      await expect(body).not.toHaveAttribute("data-reading-resume-y");
    } finally {
      release();
    }

    await expect(last).toHaveAttribute("data-reading-pending", "");
    expect(await page.evaluate(() => scrollY)).toBe(120);
  });
}

test.describe("touch reading motion", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("reveals new content during a touch swipe after a mid-article reload", async ({
    page,
    context,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await trackReadingMotion(page);
    await openArticle(page);
    const next = page.locator("[data-article-body] > p").nth(35);
    const y = await savePositionBefore(next, 100);

    await page.reload();
    await expect(next).toHaveAttribute("data-reading-pending", "");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);

    const input = await context.newCDPSession(page);
    try {
      await input.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 195, y: 730 }],
      });
      await input.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 195, y: 590 }],
      });
      // Keep the finger down until the reveal starts so a fling cannot skip the target.
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y + 100);
      await expect.poll(async () => (await sampleFor(next)).length).toBe(1);
    } finally {
      await input.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await input.detach();
    }
  });
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
      const [figureReveal] = await sampleFor(target);
      expect(figureReveal).toMatchObject({ opacity: 0, blur: 6, y: 8 });
      expect(figureReveal?.scale).toBeCloseTo(1.025, 3);
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
  await expect(paragraph).toHaveCSS("filter", /^blur\(/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(paragraph).toHaveCSS("filter", "none");
  await expect(paragraph).toHaveCSS("transform", "none");
  await expect(paragraph).toHaveCSS("opacity", "1");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/single/resume-reading#chapter-two");
  const chapter = page.locator("#chapter-two");
  await expect(chapter).toBeInViewport();
  await expect(chapter).toHaveCSS("opacity", "1");
  expect(await sampleFor(page.locator("[data-article-body]"))).toEqual([]);
  expect(await sampleFor(chapter)).toEqual([]);

  await page.reload();
  await expect(chapter).toBeInViewport();
  await expect.poll(async () => (await sampleFor(chapter)).length).toBe(1);
  await expect(chapter).toHaveCSS("opacity", "1");
});

test("a fast jump and reload reveal the settled reading position", async ({ page }) => {
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
  await expect.poll(async () => (await sampleFor(chapter)).length).toBe(1);

  const scrollBeforeReload = await page.evaluate(() => scrollY);
  await page.reload();
  await expect(chapter).toBeInViewport();
  await expect
    .poll(() => page.evaluate((position) => Math.abs(scrollY - position), scrollBeforeReload))
    .toBeLessThan(3);
  await expect(chapter).toHaveCSS("opacity", "1");
  expect(await sampleFor(body)).toEqual([]);
  await expect.poll(async () => (await sampleFor(chapter)).length).toBe(1);
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
    observer.observe(block, { attributeFilter: ["data-reading-pending", "style"] });
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

test("a tall block fades in without blurring the entire surface", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await trackReadingMotion(page);
  await openArticle(page, "entrance-tall");
  const block = page.locator("[data-article-body] [data-reading-code]").last();
  await expect(block).toHaveCSS("opacity", "0");
  await approachReadingUnit(block);
  await expect.poll(async () => (await sampleFor(block)).length).toBe(1);
  const [reveal] = await sampleFor(block);
  expect(reveal).toMatchObject({ opacity: 0.65, blur: 0, y: 0, scale: 1 });
  await expect(block).toHaveCSS("opacity", "1");
  await expect(block).toHaveCSS("filter", "none");
  await expect(block).toHaveCSS("transform", "none");
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
