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
const article = (id: number) => ({
  addedAt: "2026-09-20T00:00:00Z",
  post: {
    id,
    title: `Read later ${id}`,
    slug: `read-later-${id}`,
    category: null,
    views: 0,
    likesCount: 0,
  },
});
const result = (list: ReturnType<typeof article>[], total = list.length) => ({
  list,
  page: 0,
  size: 6,
  total,
  totalPages: Math.ceil(total / 6),
});

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });

test("shows the later-reading queue and removes an entry with its own pending state", async ({
  page,
}) => {
  let entries = [article(1), article(2)];
  let removeCalls = 0;

  await page.addInitScript(() =>
    sessionStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "reading-list-test",
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
    if (path.endsWith("/library/overview"))
      return route.fulfill({
        json: envelope({ continueReading: [], recentFavorites: [], recommendations: [] }),
      });
    if (path.endsWith("/library/preferences"))
      return route.fulfill({ json: envelope({ followedCategories: [], hiddenPostCount: 0 }) });
    if (path.endsWith("/library/favorites") || path.endsWith("/library/history"))
      return route.fulfill({ json: envelope(result([])) });
    if (path.endsWith("/library/collections")) return route.fulfill({ json: envelope([]) });
    if (path.includes("/library/reading-list")) {
      if (request.method() === "DELETE") {
        removeCalls += 1;
        const postId = Number(path.split("/").at(-1));
        entries = entries.filter(({ post }) => post.id !== postId);
        return route.fulfill({ json: envelope(null) });
      }
      return route.fulfill({ json: envelope(result(entries)) });
    }
    return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
  });

  await page.goto("/library");
  const readingList = page.getByRole("region", { name: "Read later", exact: true });
  await expect(readingList.getByRole("link", { name: /Read later [12]$/ })).toHaveCount(2);
  await expect(
    readingList.getByRole("link", { name: "Read later 1", exact: true })
  ).toHaveAttribute("href", "/single/read-later-1");

  const remove = readingList.getByRole("button", {
    name: "Remove Read later 1 from reading list",
    exact: true,
  });
  await remove.press("Enter");
  await expect.poll(() => removeCalls).toBe(1);
  await expect(readingList.getByRole("link", { name: /Read later [12]$/ })).toHaveCount(1);
  await expect(readingList.getByText("Read later 2", { exact: true })).toBeVisible();
});
