import { expect, test as base, type Page } from "@playwright/test";
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
        items: [{ title, url: "/blog", subtitle: "Search result" }],
      },
    ],
  },
});
const endpoint = "**/api/v1/public/search/unified?**";
async function openSearch(page: Page) {
  await page.goto("/newsletter/verify");
  await page.getByRole("button", { name: /Search, keyboard shortcut/ }).press("Enter");
  const input = page.getByPlaceholder("Search or jump to");
  await expect(input).toBeVisible();
  await page.getByRole("radio", { name: "Search", exact: true }).press("Space");
  return input;
}
test.use({ locale: "en-US" });
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
