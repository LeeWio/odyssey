import { expect, test as base } from "@playwright/test";

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

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const article = (saved: boolean) => ({
  id: 123,
  slug: "reading-loop",
  title: "Reading loop article",
  contentType: "JSON",
  content: JSON.stringify({
    type: "doc",
    content: Array.from({ length: 30 }, (_, index) => ({
      type: "paragraph",
      content: [
        { type: "text", text: `Paragraph ${index + 1}. A note for the later-reading action.` },
      ],
    })),
  }),
  status: "PUBLISHED",
  isFeatured: false,
  views: 0,
  likesCount: 0,
  favoritesCount: 0,
  isInReadingList: saved,
  category: null,
  series: null,
  seriesOrder: null,
  createdAt: "2026-09-20T00:00:00Z",
  updatedAt: "2026-09-20T00:00:00Z",
});
const pageResult = (list: unknown[]) => ({
  list,
  page: 0,
  size: 6,
  total: list.length,
  totalPages: list.length === 0 ? 0 : 1,
});

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });

test("article save for later uses the library queue and returns there", async ({ page }) => {
  let saved = false;
  const methods: string[] = [];

  await page.addInitScript(() =>
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "article-reading-list-test",
        username: "reader",
        roles: ["ROLE_USER"],
        permissions: [],
        isAuthenticated: true,
      })
    )
  );
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/v1/user/me")
      return route.fulfill({ json: envelope({ id: 1, username: "reader" }) });
    if (path.endsWith("/unread/count")) return route.fulfill({ json: envelope(0) });
    if (path === "/api/v1/public/blog/posts/reading-loop")
      return route.fulfill({ json: envelope(article(saved)) });
    if (path.endsWith("/library/overview"))
      return route.fulfill({
        json: envelope({ continueReading: [], recentFavorites: [], recommendations: [] }),
      });
    if (path.endsWith("/library/preferences"))
      return route.fulfill({ json: envelope({ followedCategories: [], hiddenPostCount: 0 }) });
    if (path.endsWith("/library/favorites") || path.endsWith("/library/history"))
      return route.fulfill({ json: envelope(pageResult([])) });
    if (path.endsWith("/library/collections")) return route.fulfill({ json: envelope([]) });
    if (path.includes("/library/reading-list")) {
      if (request.method() === "PUT" || request.method() === "DELETE") {
        methods.push(request.method());
        saved = request.method() === "PUT";
        return route.fulfill({ json: envelope(null) });
      }
      return route.fulfill({
        json: envelope(
          pageResult(
            saved
              ? [
                  {
                    addedAt: "2026-09-20T00:00:00Z",
                    post: {
                      id: 123,
                      title: "Reading loop article",
                      slug: "reading-loop",
                      category: null,
                      views: 0,
                      likesCount: 0,
                    },
                  },
                ]
              : []
          )
        ),
      });
    }
    return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
  });

  await page.goto("/single/reading-loop");
  await expect(
    page.getByRole("heading", { name: "Reading loop article", exact: true })
  ).toBeVisible();
  await expect(page.locator('.ProseMirror[contenteditable="false"]')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 500));

  const save = page.getByRole("button", { name: "Save for later", exact: true });
  await save.press("Enter");
  const savedButton = page.getByRole("button", { name: "Saved for later", exact: true });
  await expect(savedButton).toHaveAttribute("aria-pressed", "true");
  expect(methods).toEqual(["PUT"]);

  await page.getByRole("button", { name: "Reading library", exact: true }).press("Enter");
  await expect(page).toHaveURL(/\/library$/);
  const readingList = page.getByRole("region", { name: "Read later", exact: true });
  await expect(
    readingList.getByRole("link", { name: "Reading loop article", exact: true })
  ).toHaveAttribute("href", "/single/reading-loop");
});
