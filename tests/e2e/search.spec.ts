import { expect, test as base, type Page } from "@playwright/test";

import { resumeArticle } from "./fixtures/articles";
const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
const result = (title: string) => ({
  code: 200,
  message: "OK",
  data: {
    groups: [
      {
        type: "POST",
        label: "Articles",
        items: [{ title, url: "/single", subtitle: "Search result" }],
      },
    ],
  },
});
const endpoint = "**/api/v1/public/search/unified?**";
const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
async function openSearch(page: Page, route = "/newsletter/verify") {
  await page.goto(route);
  await expect(page.getByRole("radiogroup", { name: "Color mode" })).toBeAttached();
  await page.getByRole("button", { name: /Search, keyboard shortcut/ }).press("Enter");
  const input = page.getByRole("searchbox", { name: "Search commands" });
  await expect(input).toBeVisible();
  await page.getByRole("radio", { name: "Search", exact: true }).press("Space");
  return input;
}
test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({ status: 503, json: { message: "Unmocked API request" } })
  );
});

test("replacing a keyword hides previous results while the next search is pending", async ({
  page,
}) => {
  const response = Promise.withResolvers<void>();
  await page.route(endpoint, async (route) => {
    const keyword = new URL(route.request().url()).searchParams.get("keyword");
    if (keyword === "beta") await response.promise;
    await route.fulfill({ json: result(keyword === "alpha" ? "Alpha article" : "Beta article") });
  });
  try {
    const input = await openSearch(page);
    await input.fill("alpha");
    await expect(page.getByText("Alpha article", { exact: true })).toBeVisible();
    await input.fill("beta");
    await expect(page.getByText("Alpha article", { exact: true })).toHaveCount(0);
    await expect(
      page.getByText("Searching across your workspace...", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("No matching results", { exact: true })).toHaveCount(0);
    response.resolve();
    await expect(page.getByText("Beta article", { exact: true })).toBeVisible();
    await input.fill("");
    await expect(page.getByText("Beta article", { exact: true })).toHaveCount(0);
  } finally {
    response.resolve();
  }
});

test("local scopes suppress remote search requests and errors", async ({ page }) => {
  const keywords: string[] = [];
  await page.route(endpoint, async (route) => {
    keywords.push(new URL(route.request().url()).searchParams.get("keyword")!);
    await route.fulfill({ status: 503, json: { message: "Search unavailable" } });
  });
  const input = await openSearch(page);
  await input.fill("unavailable");
  await expect(
    page.getByText("Search is temporarily unavailable. Please try again shortly.", { exact: true })
  ).toBeVisible();
  await page.getByRole("radio", { name: "Themes", exact: true }).press("Space");
  await input.fill("dark");
  await expect(page.getByText(/Search is temporarily unavailable/)).toHaveCount(0);
  await expect(page.getByText("Searching across your workspace...", { exact: true })).toHaveCount(
    0
  );
  // Observe beyond the search debounce to confirm local-only typing makes no request.
  await page.waitForTimeout(400);
  expect(keywords).toEqual(["unavailable"]);
});

test("a late older search cannot replace the current results", async ({ page }) => {
  const old = Promise.withResolvers<void>();
  let started = false;
  await page.route(endpoint, async (route) => {
    const keyword = new URL(route.request().url()).searchParams.get("keyword");
    if (keyword === "alpha") {
      started = true;
      await old.promise;
    }
    await route.fulfill({ json: result(keyword === "alpha" ? "Alpha article" : "Beta article") });
  });
  try {
    const input = await openSearch(page);
    await input.fill("alpha");
    await expect.poll(() => started).toBe(true);
    await input.fill("beta");
    await expect(page.getByText("Beta article", { exact: true })).toBeVisible();
    const delivered = page.waitForResponse((response) => response.url().includes("keyword=alpha"));
    old.resolve();
    await delivered;
    await expect(page.getByText("Alpha article", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Beta article", { exact: true })).toBeVisible();
  } finally {
    old.resolve();
  }
});

test("finds an article, records a chapter, and resumes at it from the library", async ({
  page,
}) => {
  const post = resumeArticle;
  let checkpoint = { progressPercent: 0, positionAnchor: "" };
  await page.addInitScript(() =>
    localStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "search-library-fixture",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    )
  );
  await page.route("**/api/v1/**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/v1/user/me")
      return route.fulfill({ json: envelope({ id: 1, username: "reader" }) });
    if (path === `/api/v1/public/blog/posts/${post.slug}`)
      return route.fulfill({ json: envelope(post) });
    if (path === `/api/v1/user/library/posts/${post.id}/progress` && request.method() === "PUT") {
      checkpoint = request.postDataJSON();
      return route.fulfill({
        json: envelope({ post, ...checkpoint, lastReadAt: "2026-11-19T08:00:00Z" }),
      });
    }
    if (path === "/api/v1/user/library/overview") {
      return route.fulfill({
        json: envelope({
          continueReading: [{ post, ...checkpoint, lastReadAt: "2026-11-19T08:00:00Z" }],
          recentFavorites: [],
          recommendations: [],
        }),
      });
    }
    return route.fallback();
  });
  await page.route(endpoint, (route) =>
    route.fulfill({
      json: envelope({
        groups: [
          {
            type: "POST",
            label: "Articles",
            items: [{ title: post.title, url: `/single/${post.slug}` }],
          },
        ],
      }),
    })
  );

  const search = await openSearch(page);
  await search.fill("  reading  ");
  const result = page.getByRole("menuitem", { name: post.title });
  await expect(result.locator("mark")).toHaveText("reading");
  await result.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/single/${post.slug}$`), { timeout: 18000 });
  const chapter = page.getByRole("heading", { name: "Chapter two", exact: true });
  await expect(chapter).toHaveAttribute("id", "chapter-two");
  await expect(page.getByRole("button", { name: "On this page", exact: true })).toBeVisible();
  await chapter.evaluate((heading) =>
    window.scrollTo(0, window.scrollY + heading.getBoundingClientRect().top - 100)
  );
  await expect
    .poll(() => ({
      anchor: checkpoint.positionAnchor,
      inProgress: checkpoint.progressPercent > 0 && checkpoint.progressPercent < 100,
    }))
    .toEqual({ anchor: "chapter-two", inProgress: true });

  await page.goto("/library");
  const resume = page
    .getByRole("region", { name: "Continue reading", exact: true })
    .getByRole("link", { name: new RegExp(post.title) });
  await expect(resume).toHaveAttribute("href", `/single/${post.slug}#chapter-two`);
  await resume.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/single/${post.slug}#chapter-two$`));
  await expect
    .poll(() => chapter.evaluate((heading) => Math.abs(heading.getBoundingClientRect().top - 112)))
    .toBeLessThan(2);
});

test("opens the existing filtered project listing from a project result", async ({ page }) => {
  await page.route(endpoint, (route) =>
    route.fulfill({
      json: envelope({
        groups: [
          {
            type: "PROJECT",
            label: "Projects",
            items: [{ title: "Reader tools", url: "/projects?q=reader-tools" }],
          },
        ],
      }),
    })
  );
  await page.route("**/api/v1/public/projects", (route) =>
    route.fulfill({
      json: envelope([
        {
          id: 1,
          name: "Reader tools",
          slug: "reader-tools",
          sortOrder: 1,
          isPublished: true,
          createdAt: "2026-11-19T08:00:00Z",
        },
        {
          id: 2,
          name: "Other project",
          slug: "other-project",
          sortOrder: 2,
          isPublished: true,
          createdAt: "2026-11-19T08:00:00Z",
        },
      ]),
    })
  );
  const search = await openSearch(page);
  await search.fill("reader");
  await page.getByRole("menuitem", { name: "Reader tools" }).press("Enter");
  await expect(page).toHaveURL(/\/projects\?q=reader-tools$/);
  await expect(page.getByRole("heading", { name: "Reader tools", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Other project", exact: true })).toHaveCount(0);
});
