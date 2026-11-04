import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

interface GalleryCheck {
  canvas: HTMLCanvasElement;
  draws: number;
  uploaded: string[];
  peakAngle: number;
  peakWave: number;
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
        const entry: GalleryCheck = {
          canvas: this,
          draws: 0,
          uploaded: [],
          peakAngle: 0,
          peakWave: 0,
        };
        window.circularGalleryChecks.push(entry);
        const uniforms = new Map<WebGLUniformLocation, string>();
        const location = context.getUniformLocation.bind(context);
        context.getUniformLocation = (program, name) => {
          const result = location(program, name);
          if (result) uniforms.set(result, name);
          return result;
        };
        const uniform = context.uniform1f.bind(context);
        context.uniform1f = (location, value) => {
          const name = location && uniforms.get(location);
          if (name === "uAngle") entry.peakAngle = Math.max(entry.peakAngle, Math.abs(value));
          if (name === "uWave") entry.peakWave = Math.max(entry.peakWave, Math.abs(value));
          uniform(location, value);
        };
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

for (const width of [390, 1440]) {
  test(`the original gallery expands to the viewport and restores in both layouts at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const requests = await prepare(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/moments?topic=circular-fixture");
    const inline = page.locator("#moment-944 canvas");
    await expect(inline).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.circularGalleryChecks[0]?.uploaded.length))
      .toBe(4);
    const original = await inline.elementHandle();
    const beforeRequests = [...requests];

    for (const mode of ["List", "Grid"]) {
      await page.getByRole("radio", { name: mode, exact: true }).click();
      await inline.scrollIntoViewIfNeeded();
      const before = await inline.boundingBox();
      const scroll = await page.evaluate(() => scrollY);
      await inline.click({ position: { x: before!.width / 2, y: before!.height / 2 } });
      const dialog = page.getByRole("dialog", { name: "Image gallery", exact: true });
      const expanded = dialog.locator("canvas");
      await expect(dialog).toBeVisible();
      await expect
        .poll(async () => {
          const box = await expanded.boundingBox();
          return box ? { width: Math.round(box.width), height: Math.round(box.height) } : null;
        })
        .toEqual({ width, height: 900 });
      expect(await original!.evaluate((node) => node.closest('[role="dialog"]') !== null)).toBe(
        true
      );
      expect(await page.evaluate(() => window.circularGalleryChecks.length)).toBe(1);
      expect(requests).toEqual(beforeRequests);
      expect(
        await expanded.evaluate((element) =>
          (element as HTMLCanvasElement).getContext("webgl2")!.isContextLost()
        )
      ).toBe(false);
      const screenshot = await expanded.screenshot({
        path: testInfo.outputPath(`expanded-${width}-${mode}.png`),
      });
      const { data, info } = await sharp(screenshot)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let colored = 0;
      for (let index = 0; index < data.length; index += info.channels) {
        const channels = [data[index], data[index + 1], data[index + 2]];
        if (Math.max(...channels) - Math.min(...channels) > 20) colored++;
      }
      expect(colored).toBeGreaterThan(width * 100);
      await page.keyboard.press("ArrowRight");
      await expect(dialog.locator('[data-gallery-list] [aria-current="true"]')).toHaveAttribute(
        "aria-label",
        "Photo 2, 2 of 4"
      );
      const close = dialog.getByRole("button", { name: "Close", exact: true });
      await close.focus();
      for (let index = 0; index < 3; index++) {
        await page.keyboard.press("Tab");
        expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(
          true
        );
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(inline).toBeVisible();
      expect(await original!.evaluate((node) => node.closest("#moment-944") !== null)).toBe(true);
      expect(await page.evaluate(() => scrollY)).toBe(scroll);
      expect((await inline.boundingBox())!.height).toBe(before!.height);
      await page.screenshot({ path: testInfo.outputPath(`restored-${width}-${mode}.png`) });
      // Restore the first image with the original gallery keyboard navigation.
      await page.locator('#moment-944 [data-gallery-list] [aria-current="true"]').focus();
      await page.keyboard.press("ArrowLeft");
    }
    expect(errors).toEqual([]);
  });
}

test("keyboard opening, close-button dismissal, arc and wave rendering keep the original engine", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await prepare(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/moments?topic=circular-fixture&view=grid");
  const canvas = page.locator("#moment-944 canvas");
  await expect(canvas).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.circularGalleryChecks[0]?.peakAngle))
    .toBeGreaterThan(0);
  const original = await canvas.elementHandle();
  const trigger = page.locator('#moment-944 [data-gallery-list] [aria-current="true"]');
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Image gallery", exact: true });
  await expect(dialog.locator("canvas")).toBeVisible();
  await page.evaluate(() => {
    window.circularGalleryChecks[0].peakWave = 0;
  });
  await dialog.locator("canvas").hover();
  await page.mouse.wheel(300, 0);
  await expect
    .poll(() => page.evaluate(() => window.circularGalleryChecks[0]?.peakWave))
    .toBeGreaterThan(0);
  const box = await dialog.locator("canvas").boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 - 160, box!.y + box!.height / 2, { steps: 8 });
  await expect(dialog.locator('[aria-roledescription="carousel"]')).toHaveAttribute(
    "data-dragging",
    ""
  );
  await page.mouse.up();
  await expect(dialog.locator('[aria-roledescription="carousel"]')).not.toHaveAttribute(
    "data-dragging"
  );
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(canvas).toBeVisible();
  expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(page.locator('#moment-944 [data-gallery-list] [aria-current="true"]')).toBeFocused();
});
