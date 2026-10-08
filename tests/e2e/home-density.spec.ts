import { expect, test } from "@playwright/test";

const projects = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `Project ${index + 1}`,
  slug: `project-${index + 1}`,
  description: "A published project with a useful description.",
  previewUrl: `https://example.com/project-${index + 1}`,
  sortOrder: index,
  isPublished: true,
  createdAt: "2026-10-01T00:00:00Z",
}));

const links = projects.map((project) => ({
  ...project,
  url: project.previewUrl,
  status: "APPROVED",
  updatedAt: project.createdAt,
}));

const posts = projects.map((project) => ({
  id: project.id,
  title: `Essay ${project.id}`,
  slug: `essay-${project.id}`,
  summary: project.description,
  category: null,
  views: 0,
  likesCount: 0,
}));

test.use({ locale: "en-US" });

test("home reveals more real content as its container grows without refetching", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests = { projects: 0, links: 0, writing: 0 };
  await page.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    let data: unknown;
    if (url.pathname === "/api/v1/public/projects") {
      requests.projects += 1;
      data = projects;
    } else if (url.pathname === "/api/v1/public/friend-links") {
      requests.links += 1;
      data = links;
    } else if (url.pathname.endsWith("/featured")) {
      requests.writing += 1;
      expect(url.searchParams.get("size")).toBe("12");
      data = { list: posts, total: 12, page: 0, size: 12, totalPages: 1 };
    } else if (url.pathname === "/api/v1/public/moments") {
      data = { list: [], total: 0, page: 0, size: 18, totalPages: 0 };
    } else {
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    }
    return route.fulfill({ json: { code: 200, message: "OK", data } });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const projectGrid = page.getByTestId("home-projects-grid");
  const linkGrid = page.getByTestId("home-links-grid");
  await expect(projectGrid.locator(":scope > div")).toHaveCount(12);
  await expect(linkGrid.locator(":scope > div")).toHaveCount(12);
  const slides = page.getByTestId("home-writing-slide");
  await expect(slides).toHaveCount(12);

  for (const viewport of [
    { width: 390, columns: 1, preview: 3, carousel: 1, gallery: 3 },
    { width: 820, columns: 2, preview: 4, carousel: 2, gallery: 4 },
    { width: 1440, columns: 4, preview: 8, carousel: 4, gallery: 4 },
    { width: 1920, columns: 6, preview: 12, carousel: 6, gallery: 4 },
    { width: 2560, columns: 8, preview: 12, carousel: 6, gallery: 4 },
    { width: 390, columns: 1, preview: 3, carousel: 1, gallery: 3 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: 900 });
    for (const grid of [projectGrid, linkGrid]) {
      await expect(grid.locator(":scope > div:visible")).toHaveCount(viewport.preview);
      const layout = await grid.evaluate((element) => {
        const children = [...element.children].filter(
          (child) => getComputedStyle(child).display !== "none"
        );
        const boxes = children.map((child) => child.getBoundingClientRect());
        const first = boxes[0]!;
        return {
          columns: boxes.filter((box) => Math.abs(box.top - first.top) < 1).length,
          cardWidth: first.width,
          overflow: boxes.some((box) => box.left < 0 || box.right > innerWidth),
          overlap: boxes.some((box, index) =>
            boxes
              .slice(index + 1)
              .some(
                (other) =>
                  Math.min(box.right, other.right) - Math.max(box.left, other.left) > 1 &&
                  Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top) > 1
              )
          ),
        };
      });
      expect(layout.columns).toBe(viewport.columns);
      expect(layout.cardWidth).toBeGreaterThanOrEqual(288);
      expect(layout.cardWidth).toBeLessThan(390);
      expect(layout.overflow).toBe(false);
      expect(layout.overlap).toBe(false);
    }
    await expect(page.getByTestId("home-explore-grid").locator(":scope > div:visible")).toHaveCount(
      6
    );
    await expect(page.getByTestId("home-gallery-grid").locator(":scope > div:visible")).toHaveCount(
      viewport.gallery
    );
    await expect
      .poll(async () => {
        const widths = await slides.first().evaluate((slide) => ({
          slide: slide.getBoundingClientRect().width,
          track: slide.parentElement!.getBoundingClientRect().width,
        }));
        return Math.round(widths.track / widths.slide);
      })
      .toBe(viewport.carousel);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await projectGrid.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`projects-${viewport.width}.png`) });
  }

  expect(requests).toEqual({ projects: 1, links: 1, writing: 1 });
  await page.locator("#writing").scrollIntoViewIfNeeded();
  await expect(page.locator("#writing").getByRole("button", { name: /next/i })).toBeEnabled();
  await page.locator("#writing").getByRole("button", { name: /next/i }).click();
  await expect(page.locator("#writing").getByRole("button", { name: /previous/i })).toBeEnabled();
});
