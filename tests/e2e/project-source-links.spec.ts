import { expect, test } from "@playwright/test";

const projects = [
  { id: 1, name: "Nexus CMS", slug: "nexus", githubUrl: "https://github.com/LeeWio/nexus" },
  {
    id: 2,
    name: "Starry Weather",
    slug: "starry-weather",
    githubUrl: "https://github.com/YourUsername/starry-weather",
  },
].map((project) => ({
  ...project,
  sortOrder: project.id,
  isPublished: true,
  createdAt: "2026-07-24T06:31:54",
}));

test.use({ locale: "en-US" });
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/public/projects", (route) =>
    route.fulfill({ json: { code: 200, message: "OK", data: projects } })
  );
});

test("counts and filters only projects with real source links", async ({ page }) => {
  await page.goto("/projects");
  const results = page.getByTestId("projects-grid");
  await expect(results.getByText("Starry Weather", { exact: true })).toBeVisible();
  const source = results.getByRole("link", { name: "Source", exact: true });
  await expect(source).toHaveCount(1);
  await expect(source).toHaveAttribute("href", "https://github.com/LeeWio/nexus");

  const sourceFilter = page.getByRole("row", { name: /Source available/ });
  await expect(sourceFilter).toContainText("1");
  await sourceFilter.press("Space");
  await expect(results.getByText("Starry Weather", { exact: true })).toHaveCount(0);
  await expect(source).toBeVisible();
});

test("omits placeholder source links from home project previews", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#projects-showcase");
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByText("Starry Weather", { exact: true })).toBeVisible();
  await expect(section.locator('a[href^="https://github.com/"]')).toHaveCount(1);
  await expect(section.locator('a[href="https://github.com/LeeWio/nexus"]')).toBeVisible();
});
