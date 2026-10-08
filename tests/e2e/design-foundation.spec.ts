import { expect, test } from "@playwright/test";

const article = {
  id: 804,
  slug: "design-foundation",
  title: "A consistent space for reading and exploring",
  summary: "An article for checking the shared reading layout.",
  contentType: "JSON",
  content: JSON.stringify({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Reading rhythm" }] },
      ...Array.from({ length: 12 }, () => ({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Content comes first. Shared spacing and typography keep the reading experience predictable across screen sizes and themes.",
          },
        ],
      })),
    ],
  }),
  status: "PUBLISHED",
  isFeatured: true,
  views: 12,
  likesCount: 0,
  favoritesCount: 0,
  authorName: "Odyssey",
  category: null,
  series: null,
  seriesOrder: null,
  tags: [],
  publishedAt: "2026-10-01T00:00:00Z",
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};

test.use({ locale: "en-US" });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.includes("/public/blog/posts") && path !== "/api/v1/public/moments") {
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    }
    const data = path.endsWith("/design-foundation")
      ? article
      : path.endsWith("/related")
        ? []
        : {
            list: path.endsWith("/featured") ? [article] : [],
            page: 0,
            size: 6,
            total: 0,
            totalPages: 0,
          };
    return route.fulfill({ json: { code: 200, message: "OK", data } });
  });
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`dashboard shares the page container at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Admin overview", exact: true })).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    const header = page.getByRole("heading", { name: "Admin overview", exact: true });
    expect((await header.boundingBox())!.width).toBeLessThanOrEqual(viewport.width);
    const container = header.locator("../../..");
    await expect(container).toHaveCSS("max-width", "none");
    expect((await container.boundingBox())!.width).toBe(viewport.width);
    await page.screenshot({ path: testInfo.outputPath("dashboard.png") });
  });

  test(`home shares section boundaries at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("#writing-title")).toBeVisible();
    const sections = page.locator(
      'section[aria-labelledby="explore-odyssey-title"], #writing, section[aria-labelledby="gallery-showcase-title"], #footprints-showcase, #guestbook, #faq'
    );
    await expect(sections).toHaveCount(6);
    const boundaries = await sections.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { left: rect.left, width: rect.width, padding: style.paddingInlineStart };
      })
    );
    for (const boundary of boundaries) expect(boundary).toEqual(boundaries[0]);
    for (const boundary of boundaries) {
      expect(boundary.left).toBe(0);
      expect(boundary.width).toBe(viewport.width);
    }
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({ path: testInfo.outputPath("home.png") });
    await page.locator("#writing").scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("writing.png") });

    const developmentLog = page.locator('section[aria-labelledby="github-activity-title"]');
    await developmentLog.scrollIntoViewIfNeeded();
    const introduction = developmentLog.locator(":scope > div").first();
    await expect(introduction).toHaveCSS("text-align", "center");
    await expect(introduction).toHaveCSS("position", "static");
    const introductionBounds = (await introduction.boundingBox())!;
    const activityBounds = (await developmentLog.locator(":scope > div").nth(1).boundingBox())!;
    expect(activityBounds.y).toBeGreaterThanOrEqual(
      introductionBounds.y + introductionBounds.height
    );
    expect(Math.abs(activityBounds.x - introductionBounds.x)).toBeLessThan(1);
    expect(Math.abs(activityBounds.width - introductionBounds.width)).toBeLessThan(1);
    await page.screenshot({ path: testInfo.outputPath("development-log.png") });
  });

  test(`reading supports every theme at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/single/design-foundation");
    await expect(page.getByRole("heading", { name: article.title })).toBeVisible();
    const prose = page.locator(".odyssey-article-prose");
    await expect(prose.locator(".ProseMirror > p")).toHaveCount(12);
    await expect(prose.getByRole("heading", { name: "Reading rhythm" })).toHaveCSS(
      "letter-spacing",
      "normal"
    );
    await expect(prose.locator(".ProseMirror > p").first()).toHaveCSS("line-height", "32px");
    expect((await page.locator("[data-reading-content]").boundingBox())!.width).toBeLessThanOrEqual(
      768
    );

    for (const variant of ["mouve", "glass", "brutalism"]) {
      for (const mode of ["light", "dark"]) {
        await page.evaluate(
          ({ variant, mode }) => {
            const root = document.documentElement;
            root.dataset.theme = `${variant}-${mode}`;
            root.dataset.themeVariant = variant;
            root.dataset.themeMode = mode;
            root.dataset.themeResolvedMode = mode;
            root.classList.toggle("dark", mode === "dark");
            root.classList.toggle("light", mode === "light");
          },
          { variant, mode }
        );
        await expect(prose).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        );
        await page.screenshot({ path: testInfo.outputPath(`reading-${variant}-${mode}.png`) });
      }
    }
  });
}
