import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

interface GalleryCheck {
  canvas: HTMLCanvasElement;
  draws: number;
  uploaded: string[];
}

declare global {
  interface Window {
    circularGalleryChecks: GalleryCheck[];
  }
}

const fixture = readFileSync("public/zelda-landscape.jpg");

async function prepare(page: Page, missingPhoto = false) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.circularGalleryChecks = [];
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      options?: unknown
    ) {
      const context = original.call(this, kind, options);
      if (
        context instanceof WebGL2RenderingContext &&
        !window.circularGalleryChecks.some((entry) => entry.canvas === this)
      ) {
        const entry: GalleryCheck = { canvas: this, draws: 0, uploaded: [] };
        window.circularGalleryChecks.push(entry);
        const draw = context.drawElements.bind(context);
        context.drawElements = (...args) => {
          entry.draws++;
          return draw(...args);
        };
        const upload = context.texImage2D.bind(context);
        context.texImage2D = ((...args: unknown[]) => {
          const source = args.at(-1);
          if (source instanceof HTMLImageElement) entry.uploaded.push(source.currentSrc);
          return (upload as (...values: unknown[]) => void)(...args);
        }) as typeof context.texImage2D;
      }
      return context;
    } as typeof original;
  });
  const imageRequests: string[] = [];
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith("/api/v1/public/files/circular-")) {
      imageRequests.push(path);
      // Reproduce the upload server: ordinary same-origin image requests succeed,
      // but an unnecessary CORS Origin header is rejected.
      if (route.request().headers().origin)
        return route.fulfill({ status: 403, body: "Invalid CORS request" });
      if (missingPhoto && path.endsWith("-2.jpg"))
        return route.fulfill({ status: 404, body: "File missing" });
      return route.fulfill({ contentType: "image/jpeg", body: fixture });
    }
    const data =
      path === "/api/v1/public/moments"
        ? {
            list: [
              {
                id: 944,
                content: "Uploaded photo collection",
                authorName: "wei.li",
                likesCount: 0,
                commentsCount: 0,
                visibility: "public",
                topics: [],
                images: Array.from({ length: 4 }, (_, index) => ({
                  id: index + 1,
                  fileId: index + 1,
                  originalName: `photo-${index}.jpg`,
                  fileUrl: `/api/v1/public/files/circular-${index}.jpg`,
                  thumbnailUrl: null,
                  width: 1200,
                  height: 800,
                  altText: `Photo ${index + 1}`,
                  sortOrder: index,
                })),
                createdAt: "2026-11-04T06:00:00Z",
                updatedAt: "2026-11-04T06:00:00Z",
              },
            ],
            total: 1,
            page: 0,
            size: 12,
            totalPages: 1,
          }
        : path.endsWith("/topics")
          ? []
          : path.endsWith("/cadence")
            ? {
                zone: "UTC",
                day: { start: "2026-11-04T00:00:00Z", active: [] },
                month: { start: "2026-11-01", days: 30, offset: 0, active: [] },
                year: { year: 2026, active: [] },
              }
            : null;
    return data === null
      ? route.fulfill({ status: 503, body: "Unmocked request" })
      : route.fulfill({ json: { code: 200, message: "OK", data } });
  });
  return imageRequests;
}

for (const width of [390, 1440]) {
  test(`uploaded photos reach a live WebGL canvas in both layouts at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const requests = await prepare(page);
    await page.goto("/moments?topic=circular-fixture");
    const canvas = page.locator("#moment-944 canvas");
    await expect(canvas).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.circularGalleryChecks.find((entry) => entry.canvas.closest("#moment-944"))
              ?.uploaded.length ?? 0
        )
      )
      .toBe(4);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.circularGalleryChecks.find((entry) => entry.canvas.closest("#moment-944"))
              ?.draws ?? 0
        )
      )
      .toBeGreaterThan(0);
    expect(
      await canvas.evaluate((element) =>
        (element as HTMLCanvasElement).getContext("webgl2")!.isContextLost()
      )
    ).toBe(false);
    const node = await canvas.elementHandle();
    const before = [...requests];
    for (const mode of ["List", "Grid"]) {
      await page.getByRole("radio", { name: mode, exact: true }).click();
      await canvas.scrollIntoViewIfNeeded();
      const screenshot = await canvas.screenshot({
        path: testInfo.outputPath(`gallery-${width}-${mode}.png`),
      });
      const pixels = await sharp(screenshot).removeAlpha().raw().toBuffer();
      let colored = 0;
      for (let index = 0; index < pixels.length; index += 3) {
        const channels = [pixels[index], pixels[index + 1], pixels[index + 2]];
        if (Math.max(...channels) - Math.min(...channels) > 20) colored++;
      }
      expect(colored).toBeGreaterThan(500);
      expect(
        await node?.evaluate((element) => element === document.querySelector("#moment-944 canvas"))
      ).toBe(true);
    }
    expect(requests).toEqual(before);
    expect(errors).toEqual([]);
  });
}

test("one missing source file does not prevent the other photos from rendering", async ({
  page,
}) => {
  await prepare(page, true);
  await page.goto("/moments?topic=circular-fixture");
  await expect(page.locator("#moment-944 canvas")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.circularGalleryChecks.find((entry) => entry.canvas.closest("#moment-944"))
            ?.uploaded.length ?? 0
      )
    )
    .toBe(3);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.circularGalleryChecks.find((entry) => entry.canvas.closest("#moment-944"))
            ?.draws ?? 0
      )
    )
    .toBeGreaterThan(0);
});
