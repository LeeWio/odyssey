import { expect, test, type Page } from "@playwright/test";

import { designArticle } from "./fixtures/articles";

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });

function signIn(page: Page, username = "reader", role = "ROLE_USER") {
  return page.addInitScript(
    ({ username, role }) =>
      localStorage.setItem(
        "odyssey_auth",
        JSON.stringify({
          accessToken: "consolidated-journey-test",
          username,
          roles: [role],
          permissions: [],
          isAuthenticated: true,
        })
      ),
    { username, role }
  );
}

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" }, actionTimeout: 10000 });

test("article cards copy a full URL and use client navigation", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value: string) => {
          if (sessionStorage.getItem("reject-copy")) throw new Error("Clipboard blocked");
          sessionStorage.setItem("copied-url", value);
        },
      },
    });
  });
  await page.goto("/single?q=foundation");
  const card = page.getByRole("article", { name: designArticle.title, exact: true }).first();
  const share = card.getByRole("button", { name: "Share article", exact: true });
  await share.click();
  await expect(card.getByRole("button", { name: "Article link copied" })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("copied-url"))).toBe(
    new URL(`/single/${designArticle.slug}`, page.url()).href
  );

  await page.evaluate(() => sessionStorage.setItem("reject-copy", "1"));
  await card.getByRole("button", { name: "More article actions" }).click();
  await page.getByRole("menuitem", { name: "Copy article link" }).click();
  await expect(page.getByText("Unable to copy article link.")).toBeVisible();
  await expect(share).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.dataset.navigationTest = "preserved";
  });
  await card.getByRole("link", { name: designArticle.title }).click();
  await expect(page).toHaveURL(new RegExp(`/single/${designArticle.slug}$`), { timeout: 18000 });
  expect(await page.evaluate(() => document.documentElement.dataset.navigationTest)).toBe(
    "preserved"
  );
});

test("article card prompts guests to sign in before saving", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/single?q=foundation");
  const card = page.getByRole("article", { name: designArticle.title, exact: true }).first();
  await card.getByRole("button", { name: "More article actions" }).click();
  await page.getByRole("menuitem", { name: "Save for later" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Log In" })).toBeVisible();
});

test("article card reads and updates the account reading-list status", async ({ page }) => {
  await signIn(page);
  let saved = false;
  const writes: string[] = [];
  await page.route(`**/api/v1/user/library/reading-list/${designArticle.id}`, async (route) => {
    const method = route.request().method();
    if (method === "GET") return route.fulfill({ json: envelope(saved) });
    writes.push(method);
    saved = method === "PUT";
    return route.fulfill({ json: envelope(null) });
  });
  await page.route("**/api/v1/user/library/reading-list?**", (route) =>
    route.fulfill({
      json: envelope({
        list: saved ? [{ post: designArticle, addedAt: "2026-11-19T08:30:00Z" }] : [],
        total: Number(saved),
        page: 0,
        size: 6,
        totalPages: Number(saved),
      }),
    })
  );
  await page.goto("/single?q=foundation");
  const card = page.getByRole("article", { name: designArticle.title, exact: true }).first();
  const actions = card.getByRole("button", { name: "More article actions" });
  await actions.click();
  await page.getByRole("menuitem", { name: "Save for later" }).click();
  await expect.poll(() => writes).toEqual(["PUT"]);
  await page.goto("/library");
  await expect(
    page.getByRole("region", { name: "Read later", exact: true }).getByRole("link", {
      name: designArticle.title,
      exact: true,
    })
  ).toBeVisible();
  await page.goBack();
  await actions.click();
  await page.getByRole("menuitem", { name: "Remove from reading list" }).click();
  await expect.poll(() => writes).toEqual(["PUT", "DELETE"]);
});

const moment = (id: number) => ({
  id,
  content: `Liked fixture moment ${id}`,
  likesCount: 1,
  commentsCount: 0,
  visibility: "public",
  authorName: "Author",
  images: [],
  topics: [],
  createdAt: "2026-11-16T10:00:00Z",
  updatedAt: "2026-11-16T10:00:00Z",
});

test("liked moments and topics use their dedicated endpoints", async ({ page }) => {
  await signIn(page);
  const catalogCalls: string[] = [];
  await page.route("**/api/v1/public/moments**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/topics")) {
      return route.fulfill({ json: envelope([{ slug: "engineering", count: 4 }]) });
    }
    catalogCalls.push(url.pathname);
    return route.fulfill({ status: 500, json: envelope(null) });
  });
  await page.route("**/api/v1/user/moments/saved/ids", (route) =>
    route.fulfill({ json: envelope([]) })
  );
  await page.route("**/api/v1/user/moments/liked?**", (route) => {
    const pageIndex = Number(new URL(route.request().url()).searchParams.get("page"));
    return route.fulfill({
      json: envelope({
        list: [moment(200 - pageIndex)],
        total: 13,
        page: pageIndex + 1,
        size: 12,
        totalPages: 2,
      }),
    });
  });
  await page.goto("/moments/liked");
  await expect(page.getByText("Liked fixture moment 200")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Liked fixture moment 199")).toBeVisible();
  await page.goto("/moments/topics");
  await expect(page.getByRole("link", { name: "engineering" })).toBeVisible();
  expect(catalogCalls).toEqual([]);
});

test("robots and sitemap are available at the standard routes", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("/sitemap.xml");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(sitemap.headers()["content-type"]).toContain("xml");
  expect(await sitemap.text()).toContain("/single/design-foundation");
});

test("webhooks can be created, edited, paused and tested with a matching delivery", async ({
  page,
}) => {
  await signIn(page, "admin", "ROLE_ADMIN");
  const hooks: Record<string, unknown>[] = [];
  let submitted = false;
  let checked = 0;
  await page.route("**/api/v1/user/me", (route) =>
    route.fulfill({ json: envelope({ id: 1, username: "admin", nickname: "Administrator" }) })
  );
  await page.route("**/api/v1/admin/webhooks**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (method === "POST" && pathname.endsWith("/test")) {
      submitted = true;
      return route.fulfill({ json: envelope({ deliveryId: "fresh-test" }) });
    }
    if (pathname.endsWith("/logs")) {
      const list =
        submitted && ++checked > 1
          ? [
              {
                deliveryId: "fresh-test",
                event: "ping",
                responseCode: 204,
                isSuccess: true,
                attemptCount: 1,
                createdAt: "2026-11-19T08:30:00Z",
              },
            ]
          : [
              {
                deliveryId: "earlier",
                event: "POST_PUBLISHED",
                responseCode: 200,
                isSuccess: true,
                createdAt: "2026-11-18T08:30:00Z",
              },
            ];
      return route.fulfill({
        json: envelope({ list, total: list.length, page: 1, size: 10, totalPages: 1 }),
      });
    }
    if (method === "GET") return route.fulfill({ json: envelope(hooks) });
    const { secret, ...body } = route.request().postDataJSON();
    if (method === "POST") expect(secret).toBe("fixture-secret");
    if (method === "PUT") expect(secret).toBeUndefined();
    hooks[0] = { id: 1, ...body };
    return route.fulfill({ json: envelope(hooks[0]) });
  });
  await page.goto("/single");
  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("menuitem", { name: "Dashboard", exact: true }).press("Enter");
  const dashboard = page.getByRole("dialog", { name: "Dashboard Overlay" });
  await dashboard.getByRole("row", { name: "Webhooks", exact: true }).press("Enter");
  await dashboard.getByRole("button", { name: "Add webhook" }).click();
  const editor = page.getByRole("dialog", { name: "Add webhook" });
  await editor.getByRole("textbox", { name: "Name" }).fill("Fixture hook");
  await editor.getByRole("textbox", { name: "Target URL" }).fill("https://example.test/webhook");
  await editor.getByLabel("Signing secret").fill("fixture-secret");
  const event = editor.getByRole("checkbox", { name: "Moment published" });
  await editor.getByText("Moment published", { exact: true }).click();
  await expect(event).toBeChecked();
  await editor.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dashboard.getByText("Fixture hook", { exact: true })).toBeVisible();
  await dashboard.getByRole("button", { name: "Edit webhook" }).click();
  await page
    .getByRole("dialog", { name: "Edit webhook" })
    .getByRole("textbox", { name: "Name" })
    .fill("Edited hook");
  await page
    .getByRole("dialog", { name: "Edit webhook" })
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(dashboard.getByText("Edited hook", { exact: true })).toBeVisible();
  await dashboard.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(dashboard.getByText("Paused", { exact: true })).toBeVisible();
  await dashboard.getByRole("button", { name: "Enable", exact: true }).click();
  await expect(dashboard.getByText("Active", { exact: true })).toBeVisible();
  await dashboard.getByRole("button", { name: "Deliveries", exact: true }).click();
  const deliveries = page.getByRole("dialog", { name: "Deliveries for Edited hook" });
  await deliveries.getByRole("button", { name: "Send test" }).click();
  await expect(deliveries.getByText("Test queued. Waiting for a delivery record…")).toBeVisible();
  await expect(deliveries.getByText("The test was delivered successfully.")).toBeVisible();
});
