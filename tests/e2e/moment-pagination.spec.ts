import { expect, test, type Page } from "@playwright/test";

const moments = Array.from({ length: 30 }, (_, index) => ({
  id: 30 - index,
  content: `Note ${30 - index}. ${"A small observation. ".repeat((index % 3) + 1)}`,
  likesCount: 0,
  commentsCount: 0,
  visibility: "public",
  authorName: "wei.li",
  images: Array.from({ length: index % 12 === 0 ? 4 : 0 }, (_, image) => ({
    id: image + 1,
    fileId: image + 1,
    originalName: "zelda-landscape.jpg",
    fileUrl: "/zelda-landscape.jpg",
    thumbnailUrl: null,
    width: 1200,
    height: 800,
    altText: `Photo ${image + 1}`,
    sortOrder: image,
  })),
  topics: [{ id: 1, slug: "daily" }],
  createdAt: "2026-11-04T06:00:00Z",
  updatedAt: "2026-11-04T06:00:00Z",
}));

async function prepare(page: Page) {
  const requests: string[] = [];
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    requests.push(`${url.pathname}${url.search}`);
    const fulfill = (data: unknown) => route.fulfill({ json: { code: 200, message: "OK", data } });
    if (url.pathname === "/api/v1/public/moments") {
      const current = Number(url.searchParams.get("page") ?? 0);
      const size = Number(url.searchParams.get("size") ?? 12);
      const entries = url.searchParams.get("topic") === "short" ? moments.slice(0, 2) : moments;
      return fulfill({
        list: entries.slice(current * size, (current + 1) * size),
        total: entries.length,
        page: current + 1,
        size,
        totalPages: Math.ceil(entries.length / size),
      });
    }
    if (url.pathname.endsWith("/topics")) {
      return fulfill([
        { slug: "daily", count: 30 },
        { slug: "short", count: 2 },
      ]);
    }
    if (url.pathname.endsWith("/cadence")) {
      return fulfill({
        zone: "UTC",
        day: { start: "2026-11-04T00:00:00Z", active: [6] },
        month: { start: "2026-11-01", days: 30, offset: 0, active: [3] },
        year: { year: 2026, active: [43] },
      });
    }
    return route.fulfill({ status: 503, body: "Unmocked request" });
  });
  return requests;
}

for (const width of [390, 1440]) {
  for (const view of ["list", "grid"]) {
    test(`${view} replaces pages and preserves URL/history at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const requests = await prepare(page);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`/moments?view=${view}`);
      const feed = page.getByRole("region", { name: "Moments feed" });
      const pagination = feed.getByRole("navigation", { name: "Moments pages" });
      const sidebar = page.getByRole("navigation", { name: "Moments feed" });
      await expect(feed.locator("ol > li")).toHaveCount(12);
      await expect(pagination.getByRole("button", { name: "Page 1", exact: true })).toHaveAttribute(
        "aria-current",
        "page"
      );
      await expect(
        pagination.getByRole("button", { name: "Previous", exact: true })
      ).toBeDisabled();
      const canvas = await page.locator("#moment-30 canvas").elementHandle();
      const sidebarNode = await sidebar.elementHandle();
      await sidebar.getByRole("radio", { name: "Month", exact: true }).click();
      const serverRequests: string[] = [];
      page.on("request", (request) => {
        if (request.isNavigationRequest() || request.headers().rsc === "1") {
          serverRequests.push(request.url());
        }
      });

      await pagination.getByRole("button", { name: "Next", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`view=${view}&page=2$`));
      await expect(feed.locator("ol > li")).toHaveCount(12);
      await expect(page.locator("#moment-18")).toBeAttached();
      await expect(page.locator("#moment-30")).toHaveCount(0);
      await expect(feed).toBeFocused();
      await expect(feed).toBeInViewport();
      expect(await canvas?.evaluate((node) => node.isConnected)).toBe(false);
      expect(await sidebarNode?.evaluate((node) => node.isConnected)).toBe(true);
      await expect(sidebar.getByRole("radio", { name: "Month", exact: true })).toBeChecked();
      await expect(pagination.getByRole("button", { name: "Page 2", exact: true })).toHaveAttribute(
        "aria-current",
        "page"
      );
      expect(serverRequests).toEqual([]);
      expect(requests.filter((url) => url.startsWith("/api/v1/public/moments?"))).toHaveLength(2);

      const nextView = view === "list" ? "Grid" : "List";
      const before = [...requests];
      await feed.getByRole("radio", { name: nextView, exact: true }).click();
      expect(new URL(page.url()).searchParams.get("page")).toBe("2");
      expect(requests).toEqual(before);
      await page.reload();
      await expect(page.locator("#moment-18")).toBeAttached();
      await expect(feed.locator("ol > li")).toHaveCount(12);
      await expect(feed.getByRole("radio", { name: nextView, exact: true })).toBeChecked();

      await pagination.getByRole("button", { name: "Page 3", exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect(feed.locator("ol > li")).toHaveCount(6);
      await expect(page.locator("#moment-6")).toBeAttached();
      await expect(pagination.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
      await expect(feed).toBeFocused();
      await page.goBack();
      await expect(page.locator("#moment-18")).toBeAttached();
      await page.goForward();
      await expect(page.locator("#moment-6")).toBeAttached();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      expect(errors).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`pagination-${view}-${width}.png`) });
    });
  }
}

test("keeps the old page while loading, retains it on error, and retries without losing the sidebar", async ({
  page,
}) => {
  await prepare(page);
  const response = Promise.withResolvers<void>();
  let fail = true;
  await page.route("**/api/v1/public/moments?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("page") === "1" && fail) {
      await response.promise;
      fail = false;
      return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    }
    return route.fallback();
  });
  await page.goto("/moments?view=grid");
  const feed = page.getByRole("region", { name: "Moments feed" });
  const body = feed.locator('[data-slot="moment-feed-body"]');
  await expect(page.locator("#moment-30")).toBeAttached();
  const card = await page.locator("#moment-30").elementHandle();
  await feed.getByRole("button", { name: "Next", exact: true }).click();
  await expect(body).toHaveAttribute("aria-busy", "true");
  await expect(feed.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  expect(await card?.evaluate((node) => node === document.getElementById("moment-30"))).toBe(true);
  response.resolve();
  await expect(feed.getByRole("status").filter({ hasText: "could not be loaded" })).toBeVisible();
  expect(await card?.evaluate((node) => node.isConnected)).toBe(true);
  await expect(feed.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
  await feed.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator("#moment-18")).toBeAttached();
  await expect(page.locator("#moment-30")).toHaveCount(0);
  await expect(feed.locator("ol > li")).toHaveCount(12);
});

test("topic selection resets pagination but retains Grid, and a single page needs no controls", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/moments?page=3&topic=daily&view=grid");
  const feed = page.getByRole("region", { name: "Moments feed" });
  await expect(page.locator("#moment-6")).toBeAttached();
  await page
    .getByRole("navigation", { name: "Moments feed" })
    .getByText("short", { exact: false })
    .click();
  await expect(page).toHaveURL(/\/moments\?topic=short&view=grid$/);
  await expect(feed.locator("ol > li")).toHaveCount(2);
  await expect(feed.getByRole("radio", { name: "Grid", exact: true })).toBeChecked();
  await expect(feed.getByRole("navigation", { name: "Moments pages" })).toHaveCount(0);
});

test("out-of-range pages normalize to the last page, and malformed pages use the first", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/moments?page=99&view=grid");
  await expect(page).toHaveURL(/page=3&view=grid$/);
  await expect(page.locator("#moment-6")).toBeAttached();
  await page.goto("/moments?page=invalid&view=list");
  await expect(page).toHaveURL(/\/moments\?view=list$/);
  await expect(page.locator("#moment-30")).toBeAttached();
});

test("leaving a page stops its WebGL drawing and releases the gallery textures", async ({
  page,
}) => {
  await prepare(page);
  await page.addInitScript(() => {
    type Check = { canvas: HTMLCanvasElement; draws: number; released: number };
    const checks: Check[] = [];
    (window as typeof window & { paginationGalleryChecks: Check[] }).paginationGalleryChecks =
      checks;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      options?: unknown
    ) {
      const context = original.call(this, kind, options);
      if (
        context instanceof WebGL2RenderingContext &&
        !checks.some((entry) => entry.canvas === this)
      ) {
        const check = { canvas: this, draws: 0, released: 0 };
        checks.push(check);
        const draw = context.drawElements.bind(context);
        context.drawElements = (...args) => {
          check.draws++;
          return draw(...args);
        };
        const release = context.deleteTexture.bind(context);
        context.deleteTexture = (texture) => {
          check.released++;
          release(texture);
        };
      }
      return context;
    } as typeof original;
  });
  await page.goto("/moments?view=grid");
  await expect(page.locator("#moment-30 canvas")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { paginationGalleryChecks: { draws: number }[] })
            .paginationGalleryChecks[0]?.draws ?? 0
      )
    )
    .toBeGreaterThan(0);
  await page
    .getByRole("region", { name: "Moments feed" })
    .getByRole("button", { name: "Next", exact: true })
    .click();
  await expect(page.locator("#moment-18 canvas")).toBeAttached();
  const read = () =>
    page.evaluate(() => {
      const check = (
        window as typeof window & {
          paginationGalleryChecks: { canvas: HTMLCanvasElement; draws: number; released: number }[];
        }
      ).paginationGalleryChecks[0];
      return { connected: check.canvas.isConnected, draws: check.draws, released: check.released };
    });
  await expect.poll(async () => (await read()).released).toBeGreaterThan(0);
  const stopped = await read();
  expect(stopped.connected).toBe(false);
  // Wait for active rendering on the new page, then ensure the old one stayed stopped.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { paginationGalleryChecks: { draws: number }[] })
            .paginationGalleryChecks[1]?.draws ?? 0
      )
    )
    .toBeGreaterThan(4);
  expect(await read()).toEqual(stopped);
});
