import { expect, test, type Locator, type Page } from "@playwright/test";

const moments = Array.from({ length: 14 }, (_, index) => ({
  id: 100 - index,
  content: `Note ${100 - index}. ${"An observation from the day. ".repeat(index % 3 === 0 ? 10 : 2)}`,
  likesCount: 0,
  commentsCount: 0,
  visibility: "public",
  authorName: "wei.li",
  images: Array.from({ length: index === 1 ? 1 : index === 2 ? 4 : 0 }, (_, image) => ({
    id: image + 1,
    fileId: image + 1,
    originalName: "IMG_4956.JPG",
    fileUrl: "/IMG_4956.JPG",
    thumbnailUrl: null,
    width: 1200,
    height: 800,
    altText: `Photo ${image + 1}`,
    sortOrder: image,
  })),
  topics: [],
  createdAt: index === 3 ? "" : "2026-11-01T06:00:00Z",
  updatedAt: "2026-11-01T06:00:00Z",
}));

async function prepare(page: Page, reducedMotion: "reduce" | "no-preference" = "reduce") {
  const requests: string[] = [];
  await page.emulateMedia({ reducedMotion });
  await page.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    requests.push(`${url.pathname}${url.search}`);
    const fulfill = (data: unknown) => route.fulfill({ json: { code: 200, message: "OK", data } });
    if (url.pathname === "/api/v1/public/moments") {
      const pageNumber = Number(url.searchParams.get("page") ?? 0);
      const size = Number(url.searchParams.get("size") ?? 12);
      return fulfill({
        list: moments.slice(pageNumber * size, (pageNumber + 1) * size),
        total: moments.length,
        page: pageNumber,
        size,
        totalPages: Math.ceil(moments.length / size),
      });
    }
    if (url.pathname === "/api/v1/public/moments/topics") {
      return fulfill([{ slug: "daily", count: moments.length }]);
    }
    if (url.pathname === "/api/v1/public/moments/cadence") {
      return fulfill({
        zone: "UTC",
        day: { start: "2026-11-04T00:00:00Z", active: [6, 12] },
        month: { start: "2026-11-01", days: 30, offset: 0, active: [0, 2] },
        year: { year: 2026, active: [40, 42] },
      });
    }
    return route.fulfill({ status: 503, json: { message: "Unavailable" } });
  });
  return requests;
}

async function sampleLayoutChange(page: Page, control: Locator) {
  await page.evaluate(() => {
    const card = document.getElementById("moment-99")!;
    const image = card.querySelector<HTMLImageElement>('img[alt="Photo 1"]')!;
    const body = document.querySelector('[data-slot="moment-feed-body"]')!;
    const read = () => {
      const bounds = card.getBoundingClientRect();
      const photo = image.getBoundingClientRect();
      return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        opacity: Number(getComputedStyle(card).opacity),
        bodyOpacity: Number(getComputedStyle(body).opacity),
        imageRatio: photo.height / photo.width,
        naturalRatio: image.naturalHeight / image.naturalWidth,
        imageVisible: photo.left >= bounds.left - 1 && photo.right <= bounds.right + 1,
      };
    };
    const samples = [read()];
    (window as typeof window & { momentLayoutSamples?: typeof samples }).momentLayoutSamples =
      samples;
    const sample = () => {
      samples.push(read());
      if (samples.length < 45) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await control.click({ force: true });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { momentLayoutSamples?: unknown[] }).momentLayoutSamples
            ?.length
      )
    )
    .toBe(45);
  const samples = await page.evaluate(
    () =>
      (
        window as typeof window & {
          momentLayoutSamples: {
            x: number;
            y: number;
            width: number;
            height: number;
            opacity: number;
            bodyOpacity: number;
            imageRatio: number;
            naturalRatio: number;
            imageVisible: boolean;
          }[];
        }
      ).momentLayoutSamples
  );
  const first = samples[0];
  const last = samples[samples.length - 1];
  const distance = (frame: typeof first) =>
    Math.hypot(frame.x - first.x, frame.y - first.y, frame.width - first.width);
  const total = distance(last);
  expect(total).toBeGreaterThan(4);
  expect(
    samples.filter((frame) => distance(frame) > 0.5 && distance(frame) < total - 0.5).length
  ).toBeGreaterThan(2);
  for (const frame of samples) {
    expect(frame.opacity).toBe(1);
    expect(frame.bodyOpacity).toBe(1);
    expect(frame.imageRatio).toBeCloseTo(frame.naturalRatio, 3);
    expect(frame.imageVisible).toBe(true);
  }
  await expect(page.locator("#moment-99")).toHaveCSS("transform", "none");
}

for (const mode of ["List", "Grid"] as const) {
  test(`${mode} reveals initial and newly loaded cards in reading order`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepare(page, "no-preference");
    await page.addInitScript(() => {
      const samples: { at: number; cards: { opacity: number; y: number; scale: number }[] }[] = [];
      (window as typeof window & { momentEntranceSamples?: typeof samples }).momentEntranceSamples =
        samples;
      let started: number | undefined;
      const sample = (now: number) => {
        const cards = Array.from(document.querySelectorAll('ol > li[id^="moment-"]')).slice(0, 3);
        if (cards.length === 3) {
          started ??= now;
          samples.push({
            at: now - started,
            cards: cards.map((card) => {
              const style = getComputedStyle(card);
              const matrix = new DOMMatrixReadOnly(
                style.transform === "none" ? undefined : style.transform
              );
              return { opacity: Number(style.opacity), y: matrix.m42, scale: matrix.m11 };
            }),
          });
          if (now - started > 1000) return;
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    let release: () => void = () => {};
    let held = true;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/v1/public/moments?**", async (route) => {
      if (held) await pending;
      return route.fallback();
    });
    await page.goto("/moments?topic=daily");
    const feed = page.getByRole("region", { name: "Moments feed" });
    if (mode === "Grid") await feed.getByRole("radio", { name: mode, exact: true }).click();
    held = false;
    release();
    const assertSequence = async () => {
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (
                window as typeof window & { momentEntranceSamples?: { at: number }[] }
              ).momentEntranceSamples?.at(-1)?.at ?? 0
          )
        )
        .toBeGreaterThan(1000);
      const samples = await page.evaluate(
        () =>
          (
            window as typeof window & {
              momentEntranceSamples: {
                at: number;
                cards: { opacity: number; y: number; scale: number }[];
              }[];
            }
          ).momentEntranceSamples
      );
      const starts = [0, 1, 2].map(
        (index) => samples.find((frame) => frame.cards[index].opacity > 0.02)!.at
      );
      for (let index = 1; index < starts.length; index++) {
        expect(starts[index] - starts[index - 1]).toBeGreaterThan(100);
        expect(starts[index] - starts[index - 1]).toBeLessThan(240);
      }
      expect(samples[0].cards[1].opacity).toBe(0);
      expect(samples[0].cards[1].y).toBeCloseTo(16, 1);
      for (const frame of samples) {
        for (const card of frame.cards) {
          expect(card.scale).toBeCloseTo(1, 3);
          expect(card.y).toBeGreaterThanOrEqual(0);
          expect(card.y).toBeLessThanOrEqual(16);
        }
      }
      expect(samples.at(-1)?.cards.every((card) => card.opacity === 1 && card.y === 0)).toBe(true);
      const finished = samples.find((frame) => frame.cards[0].opacity === 1)!.at;
      expect(finished - starts[0]).toBeGreaterThan(250);
      expect(finished - starts[0]).toBeLessThan(500);
    };
    await assertSequence();
    await expect(feed.locator("[data-view]")).toHaveAttribute("data-view", mode.toLowerCase());
    await expect
      .poll(() =>
        feed
          .locator("ol > li")
          .evaluateAll((cards) => cards.every((card) => getComputedStyle(card).opacity === "1"))
      )
      .toBe(true);

    // Existing IDs must not participate in the next batch's entrance schedule.
    await feed.getByRole("button", { name: "Load more notes", exact: true }).click();
    await expect(feed.locator("ol > li")).toHaveCount(14);
    await expect(page.locator("#moment-100")).toHaveCSS("opacity", "1");
    await expect(page.locator("#moment-100")).toHaveCSS("transform", "none");
    await expect(page.locator("#moment-87")).toHaveCSS("opacity", "1");
    if (mode === "List") {
      await page.reload();
      await assertSequence();
    }
  });
}

for (const width of [390, 1440]) {
  test(`Motion view switching is interruptible and isolated at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const requests = await prepare(page, "no-preference");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/moments?topic=daily");
    const feed = page.getByRole("region", { name: "Moments feed" });
    const body = feed.locator('[data-slot="moment-feed-body"]');
    const layout = feed.locator("[data-view]");
    const segment = feed.getByRole("radiogroup", { name: "Moment view" });
    const grid = segment.getByRole("radio", { name: "Grid", exact: true });
    const list = segment.getByRole("radio", { name: "List", exact: true });
    const sidebar = page.getByRole("navigation", { name: "Moments feed" });
    await expect(feed.locator("ol > li")).toHaveCount(12);
    await expect(body).toHaveCSS("opacity", "1");
    await expect(body).toHaveCSS("transform", "none");
    await expect
      .poll(() =>
        feed
          .locator("ol > li")
          .evaluateAll((cards) =>
            cards.every(
              (card) =>
                getComputedStyle(card).opacity === "1" &&
                getComputedStyle(card).transform === "none"
            )
          )
      )
      .toBe(true);
    const firstCard = await page.locator("#moment-100").elementHandle();
    const image = page.locator("#moment-99").getByAltText("Photo 1", { exact: true });
    await expect
      .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    const imageNode = await image.elementHandle();
    const sidebarNode = await sidebar.elementHandle();
    const month = sidebar.getByRole("radio", { name: "Month", exact: true });
    await month.click();
    await expect(sidebar.locator('[data-slot="moment-cadence-dots"]')).toHaveCSS("opacity", "1");
    const before = [...requests];
    const url = page.url();
    await sampleLayoutChange(page, grid);
    await expect(grid).toBeChecked();
    await expect(layout).toHaveAttribute("data-view", "grid");
    await expect(body).toHaveCSS("opacity", "1");
    await expect(segment.locator('[data-slot="segment-indicator"]')).toBeHidden();
    await expect(segment.locator('[data-slot="moment-view-indicator"]')).toBeVisible();
    await sampleLayoutChange(page, list);
    await grid.click({ force: true });
    await list.click({ force: true });
    await expect(list).toBeChecked();
    await expect(layout).toHaveAttribute("data-view", "list");
    await expect(body).toHaveCSS("opacity", "1");
    await expect(body).toHaveCSS("transform", "none");
    await expect(page.locator("#moment-99")).toHaveCSS("transform", "none");
    expect(
      await firstCard?.evaluate((node) => node === document.getElementById("moment-100"))
    ).toBe(true);
    expect(
      await imageNode?.evaluate(
        (node) => node === document.querySelector('#moment-99 img[alt="Photo 1"]')
      )
    ).toBe(true);
    expect(await sidebarNode?.evaluate((node) => node.isConnected)).toBe(true);
    await expect(month).toBeChecked();
    expect(requests).toEqual(before);
    const expectedUrl = new URL(url);
    expectedUrl.searchParams.set("view", "list");
    expect(page.url()).toBe(expectedUrl.href);
    await page.screenshot({ path: testInfo.outputPath(`motion-list-${width}.png`) });

    await grid.click();
    await expect(layout).toHaveAttribute("data-view", "grid");
    await expect(body).toHaveCSS("opacity", "1");
    await feed.getByRole("button", { name: "Load more notes", exact: true }).click();
    await expect(feed.locator("ol > li")).toHaveCount(14);
    await expect(page.locator("#moment-87")).toHaveCSS("opacity", "1");
    expect(
      await firstCard?.evaluate((node) => node === document.getElementById("moment-100"))
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`motion-grid-${width}.png`) });
    expect(errors).toEqual([]);
  });
}

test("reduced motion interrupts a view transition without leaving invisible content", async ({
  page,
}) => {
  await prepare(page, "no-preference");
  await page.goto("/moments?topic=daily");
  const feed = page.getByRole("region", { name: "Moments feed" });
  const body = feed.locator('[data-slot="moment-feed-body"]');
  await expect(feed.locator("ol > li")).toHaveCount(12);
  await expect(body).toHaveCSS("opacity", "1");
  await feed.getByRole("radio", { name: "Grid", exact: true }).click({ force: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(feed.locator("[data-view]")).toHaveAttribute("data-view", "grid");
  await expect(body).toHaveCSS("opacity", "1");
  await expect(body).toHaveCSS("transform", "none");
  await expect(page.locator("#moment-99")).toHaveCSS("transform", "none");
  await feed.getByRole("radio", { name: "List", exact: true }).click();
  await expect(feed.locator("[data-view]")).toHaveAttribute("data-view", "list");
  await expect(body).toHaveCSS("opacity", "1");
  await expect(page.locator("#moment-99")).toHaveCSS("transform", "none");
  await expect
    .poll(() =>
      feed
        .locator("ol > li")
        .evaluateAll((cards) =>
          cards.every(
            (card) =>
              getComputedStyle(card).opacity === "1" && getComputedStyle(card).transform === "none"
          )
        )
    )
    .toBe(true);
});

test("refreshed content with known IDs does not replay card entrances", async ({ page }) => {
  await prepare(page, "no-preference");
  await page.route("**/api/v1/public/moments/topics", (route) =>
    route.fulfill({
      json: {
        code: 200,
        message: "OK",
        data: [
          { slug: "daily", count: 14 },
          { slug: "revisit", count: 1 },
        ],
      },
    })
  );
  await page.route("**/api/v1/public/moments?**", (route) => {
    if (new URL(route.request().url()).searchParams.get("topic") !== "revisit")
      return route.fallback();
    return route.fulfill({
      json: {
        code: 200,
        message: "OK",
        data: {
          list: [{ ...moments[0], content: "Updated existing note" }],
          total: 1,
          page: 0,
          size: 12,
          totalPages: 1,
        },
      },
    });
  });
  await page.goto("/moments?topic=daily");
  await expect(page.locator("#moment-100")).toHaveCSS("opacity", "1");
  await page.evaluate(() => {
    const samples: number[] = [];
    (window as typeof window & { refreshedCardSamples?: number[] }).refreshedCardSamples = samples;
    const sample = () => {
      const card = document.getElementById("moment-100");
      if (card) samples.push(Number(getComputedStyle(card).opacity));
    };
    const observer = new MutationObserver(sample);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
    });
    sample();
    setTimeout(() => observer.disconnect(), 2000);
  });
  await page.getByRole("navigation", { name: "Moments feed" }).getByText("revisit").click();
  await expect(page.locator("#moment-100")).toContainText("Updated existing note");
  await expect(page.locator("#moment-100")).toHaveCSS("opacity", "1");
  await expect(page.locator("#moment-100")).toHaveCSS("transform", "none");
  expect(
    await page.evaluate(() =>
      (window as typeof window & { refreshedCardSamples: number[] }).refreshedCardSamples.every(
        (opacity) => opacity === 1
      )
    )
  ).toBe(true);
});

test("filter requests preserve the old feed, current layout and sidebar state", async ({
  page,
}) => {
  await prepare(page, "no-preference");
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/public/moments/topics", (route) =>
    route.fulfill({
      json: {
        code: 200,
        message: "OK",
        data: [
          { slug: "daily", count: 14 },
          { slug: "slow", count: 1 },
          { slug: "empty", count: 0 },
        ],
      },
    })
  );
  await page.route("**/api/v1/public/moments?**", async (route) => {
    const topic = new URL(route.request().url()).searchParams.get("topic");
    if (topic !== "slow" && topic !== "empty") return route.fallback();
    if (topic === "slow") await pending;
    const list = topic === "slow" ? [{ ...moments[0], id: 333, content: "Filtered note" }] : [];
    return route.fulfill({
      json: {
        code: 200,
        message: "OK",
        data: {
          list,
          total: list.length,
          page: 0,
          size: 12,
          totalPages: list.length ? 1 : 0,
        },
      },
    });
  });
  await page.goto("/moments?topic=daily");
  const feed = page.getByRole("region", { name: "Moments feed" });
  const body = feed.locator('[data-slot="moment-feed-body"]');
  const sidebar = page.getByRole("navigation", { name: "Moments feed" });
  await expect(feed.locator("ol > li")).toHaveCount(12);
  const card = await page.locator("#moment-100").elementHandle();
  const month = sidebar.getByRole("radio", { name: "Month", exact: true });
  await month.click();
  await sidebar.getByText("slow").click();
  await expect(body).toHaveAttribute("aria-busy", "true");
  await expect(body).toHaveCSS("opacity", "0.72");
  expect(await card?.evaluate((node) => node.isConnected)).toBe(true);
  await expect(feed.locator("ol > li")).toHaveCount(12);
  await feed.getByRole("radio", { name: "Grid", exact: true }).click();
  await expect(feed.locator("[data-view]")).toHaveAttribute("data-view", "grid");
  release();
  await expect(page.locator("#moment-333")).toBeVisible();
  await expect(feed.locator("ol > li")).toHaveCount(1);
  await expect(body).toHaveCSS("opacity", "1");
  await expect(month).toBeChecked();
  await expect(feed.getByRole("radio", { name: "Grid", exact: true })).toBeChecked();
  await sidebar.getByText("empty").click();
  await expect(feed.locator("ol > li")).toHaveCount(0);
  await expect(body).toHaveCSS("opacity", "1");
  await expect(month).toBeChecked();
});

test("failed topic changes keep readable cards and retry only the requested topic", async ({
  page,
}) => {
  await prepare(page, "no-preference");
  let attempts = 0;
  await page.route("**/api/v1/public/moments/topics", (route) =>
    route.fulfill({
      json: {
        code: 200,
        message: "OK",
        data: [
          { slug: "daily", count: 14 },
          { slug: "retry-topic", count: 1 },
        ],
      },
    })
  );
  await page.route("**/api/v1/public/moments?**", (route) => {
    if (new URL(route.request().url()).searchParams.get("topic") !== "retry-topic")
      return route.fallback();
    attempts += 1;
    if (attempts === 1) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    return route.fulfill({
      json: {
        code: 200,
        message: "OK",
        data: {
          list: [{ ...moments[0], id: 444, content: "Retry succeeded" }],
          total: 1,
          page: 0,
          size: 12,
          totalPages: 1,
        },
      },
    });
  });
  await page.goto("/moments?topic=daily");
  const feed = page.getByRole("region", { name: "Moments feed" });
  await expect(feed.locator("ol > li")).toHaveCount(12);
  const card = await page.locator("#moment-100").elementHandle();
  await page.getByRole("navigation", { name: "Moments feed" }).getByText("retry-topic").click();
  await expect(
    feed.getByText("The feed could not be loaded right now. Please try again.")
  ).toBeVisible();
  expect(await card?.evaluate((node) => node.isConnected)).toBe(true);
  await expect(feed.locator("ol > li")).toHaveCount(12);
  await expect(feed.locator('[data-slot="moment-feed-body"]')).toHaveCSS("opacity", "1");
  await feed.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator("#moment-444")).toBeVisible();
  await expect(feed.locator("ol > li")).toHaveCount(1);
  await expect(
    feed.getByText("The feed could not be loaded right now. Please try again.")
  ).toHaveCount(0);
  expect(attempts).toBe(2);
});

for (const width of [390, 820, 1024, 1440, 1920, 2560, 3440]) {
  test(`List/Grid only reflows existing cards at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const requests = await prepare(page);
    await page.goto("/moments?topic=daily");
    const feed = page.getByRole("region", { name: "Moments feed" });
    const list = feed.locator("ol");
    const cards = list.locator(":scope > li");
    const segment = feed.getByRole("radiogroup", { name: "Moment view" });
    const listButton = segment.getByRole("radio", { name: "List", exact: true });
    const gridButton = segment.getByRole("radio", { name: "Grid", exact: true });
    const sidebar = page.getByRole("navigation", { name: "Moments feed" });
    const month = sidebar.getByRole("radio", { name: "Month", exact: true });

    await expect(cards).toHaveCount(12);
    await expect(listButton).toBeChecked();
    await expect(segment).toHaveClass(/segment--sm/);
    await expect(segment).not.toHaveClass(/segment--ghost/);
    await expect(cards.locator("time")).toHaveCount(0);
    await expect(list).toHaveCSS("column-count", "auto");
    await expect(list).toHaveCSS("column-width", "auto");
    await expect(list).toHaveCSS("display", "block");

    await month.click();
    await expect(month).toBeChecked();
    await expect(sidebar.getByText("daily")).toBeVisible();
    const photo = cards.nth(2).getByAltText("Photo 1");
    await expect(photo).toBeVisible();
    await expect
      .poll(() =>
        cards
          .locator('img[alt^="Photo"]')
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0
            )
          )
      )
      .toBe(true);
    const cardNode = await cards.first().locator('[data-slot="moment-content"]').elementHandle();
    const imageNode = await photo.elementHandle();
    const sidebarNode = await sidebar.elementHandle();
    const url = page.url();
    const before = [...requests];

    await page.screenshot({ path: testInfo.outputPath(`list-${width}.png`) });
    await gridButton.click();
    await expect(gridButton).toBeChecked();
    await expect(list).toHaveCSS("display", "block");
    await expect(list).toHaveCSS("column-width", "320px");
    await expect(list).toHaveCSS("column-count", "4");
    await expect(list).toHaveCSS("column-gap", "16px");
    const fullWidth = await list.evaluate((node) => ({
      content: node.getBoundingClientRect().width,
      available: node.parentElement!.getBoundingClientRect().width,
    }));
    expect(fullWidth.content).toBeCloseTo(fullWidth.available, 0);
    const positions = await cards.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height, bottom } = element.getBoundingClientRect();
        return { x: Math.round(x), y, width, height, bottom };
      })
    );
    const columns = [...new Set(positions.map(({ x }) => x))];
    if (width >= 1920) {
      // A tall unbreakable image card can leave the last balanced column unused.
      expect(columns.length).toBeGreaterThanOrEqual(3);
      expect(columns.length).toBeLessThanOrEqual(4);
      expect(positions[0].width * 4 + 3 * 16).toBeCloseTo(fullWidth.content, 0);
    } else {
      expect(columns).toHaveLength(width === 390 || width === 1024 ? 1 : width === 820 ? 2 : 3);
    }
    for (const x of columns) {
      const column = positions.filter((position) => position.x === x);
      for (let index = 1; index < column.length; index += 1) {
        expect(column[index].y - column[index - 1].bottom).toBeCloseTo(16, 0);
      }
    }
    expect(positions[0].height).not.toBeCloseTo(positions[1].height, 0);
    const imageSizing = await photo.evaluate((element) => {
      const image = element as HTMLImageElement;
      return {
        displayedRatio: image.clientHeight / image.clientWidth,
        naturalRatio: image.naturalHeight / image.naturalWidth,
        explicitSize: image.hasAttribute("width") || image.hasAttribute("height"),
        aspectRatio: getComputedStyle(image).aspectRatio,
        fullyVisible: (image.parentElement?.clientHeight ?? 0) >= image.clientHeight,
      };
    });
    expect(imageSizing.displayedRatio).toBeCloseTo(imageSizing.naturalRatio, 2);
    expect(imageSizing.explicitSize).toBe(false);
    expect(imageSizing.aspectRatio).toBe("auto");
    expect(imageSizing.fullyVisible).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({ path: testInfo.outputPath(`grid-${width}.png`) });

    await listButton.focus();
    await page.keyboard.press("Enter");
    await expect(listButton).toBeChecked();
    await expect(listButton).toBeFocused();
    expect(
      await cardNode?.evaluate(
        (node) => node === document.querySelector('#moment-100 [data-slot="moment-content"]')
      )
    ).toBe(true);
    expect(await imageNode?.evaluate((node) => node.isConnected)).toBe(true);
    expect(await sidebarNode?.evaluate((node) => node.isConnected)).toBe(true);
    await expect(month).toBeChecked();
    const expectedUrl = new URL(url);
    expectedUrl.searchParams.set("view", "list");
    expect(page.url()).toBe(expectedUrl.href);
    expect(requests).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );

    await gridButton.click();
    await feed.getByRole("button", { name: "Load more notes", exact: true }).click();
    await expect(cards).toHaveCount(14);
    await listButton.click();
    await expect(cards).toHaveCount(14);
    await expect(cards.last()).toHaveAttribute("id", "moment-87");
    expect(errors).toEqual([]);
  });
}

test("view URLs survive reloads, filtering and browser history without refetching on selection", async ({
  page,
}) => {
  const requests = await prepare(page);
  const documentRequests: string[] = [];
  const serverRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") documentRequests.push(request.url());
    if (request.headers()["rsc"] === "1") serverRequests.push(request.url());
  });
  await page.goto("/moments?topic=daily&view=grid#moment-100");
  const feed = page.getByRole("region", { name: "Moments feed" });
  const layout = feed.locator("[data-view]");
  const grid = feed.getByRole("radio", { name: "Grid", exact: true });
  const list = feed.getByRole("radio", { name: "List", exact: true });
  await expect(feed.locator("ol > li")).toHaveCount(12);
  await expect(grid).toBeChecked();
  const firstCard = await page.locator("#moment-100").elementHandle();
  const before = [...requests];
  const documentsBefore = [...documentRequests];
  const serverBefore = [...serverRequests];
  await list.click();
  await expect(layout).toHaveAttribute("data-view", "list");
  await expect(page).toHaveURL(/topic=daily&view=list#moment-100$/);
  await grid.click();
  await expect(layout).toHaveAttribute("data-view", "grid");
  expect(await firstCard?.evaluate((node) => node.isConnected)).toBe(true);
  expect(requests).toEqual(before);
  expect(documentRequests).toEqual(documentsBefore);
  expect(serverRequests).toEqual(serverBefore);

  await page.reload();
  await expect(grid).toBeChecked();
  await expect(layout).toHaveAttribute("data-view", "grid");
  await list.click();
  await page.reload();
  await expect(list).toBeChecked();
  await expect(layout).toHaveAttribute("data-view", "list");

  await grid.click();
  await page.getByRole("navigation", { name: "Moments feed" }).getByText("daily").click();
  await expect(page).toHaveURL(/\/moments\?view=grid$/);
  await expect(grid).toBeChecked();
  await expect(feed.locator("ol > li")).toHaveCount(12);
  await page.evaluate(() => {
    window.history.pushState(null, "", "/moments?view=list");
  });
  await expect(list).toBeChecked();
  await page.goBack();
  await expect(grid).toBeChecked();
  await page.goForward();
  await expect(list).toBeChecked();
});

test("natural images retain keyboard access to the image viewer", async ({ page }) => {
  await prepare(page);
  await page.goto("/moments?topic=daily");
  const trigger = page.locator("#moment-99").getByRole("button", { name: "Open image 1 of 1" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeHidden();
  await expect(trigger).toBeFocused();
});
