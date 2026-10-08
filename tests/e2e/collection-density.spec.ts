import { expect, test } from "@playwright/test";
import messages from "../../messages/en.json";

const projects = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `Collection item ${String(index + 1).padStart(2, "0")}`,
  slug: `collection-${index + 1}`,
  description: "A published collection entry with a useful description.",
  previewUrl: `https://example.com/project-${index + 1}`,
  githubUrl: index % 2 === 0 ? `https://github.com/example/project-${index + 1}` : "",
  starsCount: index,
  sortOrder: index,
  isPublished: true,
  createdAt: "2026-10-01T00:00:00Z",
}));

test.use({ locale: "en-US" });

for (const collection of [
  { path: "/projects", grid: "projects-grid", copy: messages.Projects, columns: [1, 2, 3, 5, 6] },
  { path: "/links", grid: "friend-links-grid", copy: messages.Links, columns: [1, 2, 4, 6, 8] },
]) {
  test(`${collection.path} fills the page and adds columns without refetching`, async ({
    page,
  }, testInfo) => {
    let requests = 0;
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/v1/public/projects" || path === "/api/v1/public/friend-links") {
        requests += 1;
        const data = path.endsWith("/projects")
          ? projects
          : projects.map((project) => ({
              ...project,
              url: project.previewUrl,
              status: "APPROVED",
              updatedAt: project.createdAt,
            }));
        return route.fulfill({ json: { code: 200, message: "OK", data } });
      }
      return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(collection.path);
    const grid = page.getByTestId(collection.grid);
    await expect(grid.locator(":scope > *")).toHaveCount(12);
    await expect(
      page.getByRole("heading", { level: 1, name: collection.copy.title })
    ).toBeVisible();

    for (const [index, width] of [390, 820, 1440, 1920, 2560].entries()) {
      await page.setViewportSize({ width, height: 900 });
      const container = grid.locator("../..");
      await expect(container).toHaveCSS("max-width", "none");
      expect((await container.boundingBox())!.width).toBe(width);
      await expect
        .poll(() =>
          grid.evaluate((element) => {
            const boxes = [...element.children].map((child) => child.getBoundingClientRect());
            return boxes.filter((box) => Math.abs(box.top - boxes[0]!.top) < 1).length;
          })
        )
        .toBe(collection.columns[index]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      await grid.scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`${collection.grid}-${width}.png`) });
    }

    const search = page.getByRole("searchbox", { name: collection.copy.searchLabel });
    await search.fill("Collection item 12");
    await expect(grid.locator(":scope > *")).toHaveCount(1);
    expect((await grid.locator(":scope > *").first().boundingBox())!.width).toBeLessThan(500);
    await page.setViewportSize({ width: 390, height: 844 });
    await search.fill("no-matching-entry");
    await expect(grid).toHaveCount(0);
    await page
      .getByRole("button", {
        name:
          collection.path === "/projects" ? messages.Projects.showAll : messages.Links.clearSearch,
        exact: true,
      })
      .filter({
        hasText:
          collection.path === "/projects" ? messages.Projects.showAll : messages.Links.clearSearch,
      })
      .click();
    await expect(grid.locator(":scope > *")).toHaveCount(12);
    expect(requests).toBe(1);
  });
}
