import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

const photos = {
  long: { width: 1200, height: 4800 },
  landscape: { width: 1200, height: 800 },
  small: { width: 160, height: 120 },
};

async function prepare(page: Page, motion: "reduce" | "no-preference" = "reduce") {
  await page.emulateMedia({ reducedMotion: motion });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const fulfill = (data: unknown) => route.fulfill({ json: { code: 200, message: "OK", data } });
    if (path === "/api/v1/public/moments") {
      const list = ["long", "landscape", "small", "pair"].map((kind, index) => ({
        id: 301 + index,
        content: `Single image fixture: ${kind}`,
        likesCount: 0,
        commentsCount: 0,
        visibility: "public",
        authorName: "wei.li",
        images: Array.from({ length: kind === "pair" ? 2 : 1 }, (_, photo) => {
          const name = kind === "pair" ? "landscape" : kind;
          return {
            id: photo + 1,
            fileId: photo + 1,
            originalName: `${name}.svg`,
            fileUrl: `/assets/moment-image-${name}.svg`,
            thumbnailUrl: null,
            width: null,
            height: null,
            altText: `${kind} photo ${photo + 1}`,
            sortOrder: photo,
          };
        }),
        topics: [],
        createdAt: "2026-11-04T06:00:00Z",
        updatedAt: "2026-11-04T06:00:00Z",
      }));
      return fulfill({ list, total: list.length, page: 1, size: 12, totalPages: 1 });
    }
    if (path === "/api/v1/public/moments/topics") return fulfill([]);
    return route.fulfill({ status: 503, json: { message: "Unavailable" } });
  });
  await page.route("**/assets/moment-image-*.svg", (route) => {
    const key = /moment-image-(\w+)\.svg/.exec(route.request().url())![1] as keyof typeof photos;
    const { width, height } = photos[key];
    return route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#e4e4e7"/><rect width="${width}" height="${height / 4}" fill="#be123c"/><rect y="${(height * 3) / 4}" width="${width}" height="${height / 4}" fill="#0f766e"/><text x="20" y="${height / 2}" font-size="40">Full image preview</text></svg>`,
    });
  });
  return errors;
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 320, height: 640 },
  { width: 820, height: 900 },
]) {
  test(`single-image previews retain proportions and respect height budgets at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors = await prepare(page);
    await page.goto("/moments?topic=single-image-fixture&view=list");
    const photo = page.locator("#moment-301").getByAltText("long photo 1", { exact: true });
    await expect(photo).toBeVisible();
    await expect
      .poll(() => photo.evaluate((el) => (el as HTMLImageElement).naturalHeight))
      .toBe(4800);
    const imageNode = await photo.elementHandle();
    for (const mode of ["List", "Grid"] as const) {
      await page.getByRole("radio", { name: mode, exact: true }).click();
      const desktop = viewport.width >= 1024;
      const budget = desktop
        ? mode === "List"
          ? Math.min(viewport.height * 0.6, 560)
          : Math.min(viewport.height * 0.5, 360)
        : Math.min(viewport.height * 0.55, 420);
      await expect
        .poll(() => photo.evaluate((el) => el.getBoundingClientRect().height))
        .toBeCloseTo(budget, 0);
      const box = (await photo.boundingBox())!;
      expect(box.height / box.width).toBeCloseTo(4, 2);
      const card = (await page.locator("#moment-301").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(card.x);
      expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width);
      expect(
        await imageNode?.evaluate(
          (node) => node === document.querySelector('#moment-301 img[alt="long photo 1"]')
        )
      ).toBe(true);
      const landscape = page
        .locator("#moment-302")
        .getByAltText("landscape photo 1", { exact: true });
      const landscapeBox = (await landscape.boundingBox())!;
      expect(landscapeBox.height / landscapeBox.width).toBeCloseTo(2 / 3, 2);
      expect(landscapeBox.height).toBeLessThanOrEqual(budget + 1);
      const small = (await page
        .locator("#moment-303")
        .getByAltText("small photo 1")
        .boundingBox())!;
      expect(small.width).toBe(160);
      expect(small.height).toBe(120);
      const pair = page.locator("#moment-304").getByAltText("pair photo 1", { exact: true });
      expect(await pair.evaluate((el) => getComputedStyle(el).maxHeight)).toBe("none");
      await photo.scrollIntoViewIfNeeded();
      const preview = await photo.screenshot();
      const { data, info } = await sharp(preview)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const pixel = (fraction: number) => {
        const offset =
          (Math.floor(info.height * fraction) * info.width + Math.floor(info.width / 2)) *
          info.channels;
        return Array.from(data.subarray(offset, offset + 3));
      };
      expect(pixel(0.125)).toEqual([190, 18, 60]);
      expect(pixel(0.875)).toEqual([15, 118, 110]);
      await page.screenshot({
        path: testInfo.outputPath(`single-image-${mode.toLowerCase()}.png`),
      });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    expect(errors).toEqual([]);
  });
}

for (const viewport of [
  { width: 390, height: 900 },
  { width: 1440, height: 900 },
  { width: 320, height: 640 },
  { width: 844, height: 390 },
]) {
  test(`single-image reading keeps controls reachable and restores the feed at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors = await prepare(page);
    await page.goto("/moments?topic=single-image-fixture");
    const trigger = page.locator("#moment-301").getByRole("button", { name: "Open image 1 of 1" });
    await trigger.scrollIntoViewIfNeeded();
    const scrollY = await page.evaluate(() => window.scrollY);
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Image viewer" });
    const stage = dialog.getByRole("region", { name: "Image reading area" });
    const image = stage.getByAltText("long photo 1");
    await expect(dialog).toBeVisible();
    await expect(stage).toHaveAttribute("data-mode", "fit");
    await expect
      .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalHeight))
      .toBe(4800);
    const node = await image.elementHandle();
    const fitBox = (await image.boundingBox())!;
    const stageBox = (await stage.boundingBox())!;
    expect(fitBox.height / fitBox.width).toBeCloseTo(4, 2);
    expect(fitBox.height).toBeLessThanOrEqual(stageBox.height + 1);
    const read = dialog.getByRole("radio", { name: "Read at width", exact: true });
    await read.click();
    await expect(stage).toHaveAttribute("data-mode", "width");
    const readBox = (await image.boundingBox())!;
    expect(readBox.width).toBeGreaterThan(fitBox.width);
    expect(readBox.height / readBox.width).toBeCloseTo(4, 2);
    await expect
      .poll(() => stage.evaluate((el) => el.scrollHeight - el.clientHeight))
      .toBeGreaterThan(0);
    await expect(stage).toHaveCSS("scrollbar-width", "none");
    await expect(dialog.locator('[data-slot="modal-body"]')).toHaveCSS("scrollbar-width", "none");
    await stage.hover();
    await page.mouse.wheel(0, 180);
    await expect.poll(() => stage.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await stage.focus();
    await page.keyboard.press("End");
    await expect.poll(() => stage.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await expect
      .poll(() => stage.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop))
      .toBeLessThan(2);
    const controls = await read.boundingBox();
    await page.screenshot({ path: testInfo.outputPath("reading-bottom.png") });
    const fit = dialog.getByRole("radio", { name: "Fit window", exact: true });
    await fit.click();
    await expect.poll(() => stage.evaluate((el) => el.scrollTop)).toBe(0);
    await read.click();
    await expect.poll(() => stage.evaluate((el) => el.scrollTop)).toBe(0);
    expect(await read.boundingBox()).toEqual(controls);
    expect(
      await node?.evaluate(
        (el) => el === document.querySelector('[data-slot="moment-single-image-viewer"] img')
      )
    ).toBe(true);
    await expect(dialog.getByRole("button", { name: "Viewer size" })).toHaveCount(0);
    await expect(dialog).toHaveClass(/modal__dialog--cover/);
    const dialogBox = (await dialog.boundingBox())!;
    expect(dialogBox.width).toBeGreaterThan(viewport.width * 0.85);
    await expect(read).toBeChecked();
    await stage.focus();
    await expect(stage).toBeFocused();
    await expect(stage).toBeInViewport();
    const headerBox = (await dialog.locator('[data-slot="modal-header"]').boundingBox())!;
    const segmentBox = (await dialog
      .getByRole("radiogroup", { name: "Image display" })
      .boundingBox())!;
    expect(segmentBox.x).toBeGreaterThanOrEqual(headerBox.x);
    expect(segmentBox.x + segmentBox.width).toBeLessThanOrEqual(headerBox.x + headerBox.width + 1);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollY)).toBeLessThan(2);
    await trigger.click();
    await expect(stage).toHaveAttribute("data-mode", "width");
    await expect.poll(() => stage.evaluate((el) => el.scrollTop)).toBe(0);
    await page.keyboard.press("Escape");
    expect(errors).toEqual([]);
  });
}

test("multi-image carousel keeps its existing navigation without the single-image mode control", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/moments?topic=single-image-fixture");
  await page.locator("#moment-304").getByRole("button", { name: "Open image 1 of 2" }).click();
  const dialog = page.getByRole("dialog", { name: "Image viewer" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-slot="modal-body"]')).toHaveCSS("scrollbar-width", "none");
  await expect(dialog.getByRole("radiogroup", { name: "Image display" })).toHaveCount(0);
  await expect(dialog.locator('[data-slot="carousel-thumbnail"]')).toHaveCount(2);
  await expect(dialog.getByRole("button", { name: "Viewer size" })).toHaveCount(0);
  await expect(dialog.locator('[data-slot="carousel-next"]')).toBeVisible();
  await dialog.locator('[data-slot="carousel-next"]').click();
  await expect(dialog.locator('[data-slot="carousel-thumbnail"]').nth(1)).toHaveAttribute(
    "data-selected",
    "true"
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("single-image modes retain the image during rapid changes and settle with reduced motion", async ({
  page,
}) => {
  const errors = await prepare(page, "no-preference");
  await page.goto("/moments?topic=single-image-fixture");
  await page.locator("#moment-301").getByRole("button", { name: "Open image 1 of 1" }).click();
  const dialog = page.getByRole("dialog", { name: "Image viewer" });
  const stage = dialog.getByRole("region", { name: "Image reading area" });
  const node = await stage.locator("img").elementHandle();
  const imageRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("moment-image-long.svg")) imageRequests.push(request.url());
  });
  for (const mode of [
    "Read at width",
    "Fit window",
    "Read at width",
    "Fit window",
    "Read at width",
  ]) {
    await dialog.getByRole("radio", { name: mode, exact: true }).click({ force: true });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(stage).toHaveCSS("opacity", "1");
  await expect(stage).toHaveCSS("transform", "none");
  await expect(stage).toHaveAttribute("data-mode", "width");
  expect(
    await node?.evaluate(
      (el) => el === document.querySelector('[data-slot="moment-single-image-viewer"] img')
    )
  ).toBe(true);
  expect(imageRequests).toEqual([]);
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});
