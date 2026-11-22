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
  const actions = card.getByRole("button", { name: "More article actions" });
  const copy = page.getByRole("menuitem", { name: "Copy article link" });
  await actions.click();
  await copy.click();
  await expect(page.getByText("Article link copied", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("copied-url"))).toBe(
    new URL(`/single/${designArticle.slug}`, page.url()).href
  );

  await page.evaluate(() => sessionStorage.setItem("reject-copy", "1"));
  await actions.click();
  await copy.click();
  await expect(page.getByText("Unable to copy article link.")).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.dataset.navigationTest = "preserved";
  });
  await card.getByRole("link", { name: designArticle.title }).press("Enter");
  await expect(page).toHaveURL(new RegExp(`/single/${designArticle.slug}$`), { timeout: 18000 });
  expect(await page.evaluate(() => document.documentElement.dataset.navigationTest)).toBe(
    "preserved"
  );
});

test("article card opens the author's articles with the keyboard", async ({ page }) => {
  await page.goto("/single?q=foundation");
  const card = page.getByRole("article", { name: designArticle.title, exact: true }).first();
  const link = card.getByRole("link", { name: designArticle.authorName, exact: true });
  const path = `/single/authors/${encodeURIComponent(designArticle.authorName)}`;
  await expect(link).toHaveAttribute("href", path);
  await link.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${path}$`), { timeout: 18000 });
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
  await expect(page.getByRole("button", { name: "Open account menu" })).toBeVisible();
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
  await expect(page.getByRole("button", { name: "Open account menu" })).toBeVisible();
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

test("webhooks can be managed, retried and tested with a matching delivery", async ({ page }) => {
  await signIn(page, "admin", "ROLE_ADMIN");
  const hooks: Record<string, unknown>[] = [];
  let submitted = false;
  let checked = 0;
  let attempts = 1;
  const earlierDelivery = () => ({
    deliveryId: "earlier",
    event: "POST_PUBLISHED",
    responseCode: attempts === 3 ? 204 : 502,
    isSuccess: attempts === 3,
    attemptCount: attempts,
    inProgress: false,
    createdAt: "2026-11-18T08:30:00Z",
  });
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
    if (method === "POST" && pathname.endsWith("/logs/earlier/redeliver")) {
      expect(new URL(route.request().url()).searchParams.get("attemptCount")).toBe(
        String(attempts)
      );
      attempts += 1;
      return route.fulfill({ json: envelope(earlierDelivery()) });
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
          : [earlierDelivery()];
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
  const retry = deliveries.getByRole("button", { name: "Retry", exact: true });
  await expect(deliveries.getByText("1 attempt")).toBeVisible();
  await retry.click();
  await expect(deliveries.getByText("The delivery failed again.")).toBeVisible();
  await expect(deliveries.getByText("2 attempts")).toBeVisible();
  await retry.click();
  await expect(deliveries.getByText("The retry was delivered.")).toBeVisible();
  await expect(deliveries.getByText("3 attempts")).toBeVisible();
  await expect(retry).toHaveCount(0);
  await deliveries.getByRole("button", { name: "Send test" }).click();
  await expect(deliveries.getByText("Test queued. Waiting for a delivery record…")).toBeVisible();
  await expect(deliveries.getByText("The test was delivered successfully.")).toBeVisible();
});

test("notification delivery operations filter, inspect and retry a failed email", async ({
  page,
}) => {
  await signIn(page, "admin", "ROLE_ADMIN");
  let retried = false;
  let retryRequest: Record<string, unknown> | null = null;
  const delivery = (status: "FAILED" | "QUEUED") => ({
    id: 7,
    notificationId: 4,
    channel: "EMAIL",
    status,
    attempts: 2,
    maxAttempts: status === "FAILED" ? 5 : 10,
    lastError: status === "FAILED" ? "SMTP timeout" : null,
    nextAttemptAt: status === "FAILED" ? null : "2026-11-19T08:01:00Z",
    deliveredAt: null,
    createdAt: "2026-11-19T08:00:00Z",
    retryable: status === "FAILED",
    context: null,
  });

  await page.route("**/api/v1/user/me", (route) =>
    route.fulfill({ json: envelope({ id: 1, username: "admin", nickname: "Administrator" }) })
  );
  await page.route("**/api/v1/admin/notifications/deliveries**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() === "POST" && pathname.endsWith("/retry")) {
      retryRequest = request.postDataJSON();
      retried = true;
      return route.fulfill({ json: envelope(delivery("QUEUED")) });
    }
    if (pathname.endsWith("/overview")) {
      return route.fulfill({
        json: envelope({
          counts: {
            QUEUED: retried ? 1 : 0,
            SENDING: 0,
            FAILED: retried ? 0 : 1,
            DELIVERED: 0,
            ABANDONED: 0,
          },
          pending: retried ? 1 : 0,
          overdue: retried ? 0 : 1,
          oldestPendingAt: retried ? "2026-11-19T08:01:00Z" : null,
          observedAt: "2026-11-19T08:00:00Z",
        }),
      });
    }
    if (pathname.endsWith("/retries")) {
      return route.fulfill({
        json: envelope({ list: [], total: 0, page: 1, size: 20, totalPages: 0 }),
      });
    }
    if (/\/deliveries\/7$/.test(pathname)) {
      return route.fulfill({ json: envelope(delivery(retried ? "QUEUED" : "FAILED")) });
    }
    return route.fulfill({
      json: envelope({
        list: [delivery(retried ? "QUEUED" : "FAILED")],
        total: 1,
        page: 1,
        size: 20,
        totalPages: 1,
      }),
    });
  });

  await page.goto("/single");
  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("menuitem", { name: "Dashboard", exact: true }).press("Enter");
  const dashboard = page.getByRole("dialog", { name: "Dashboard Overlay" });
  await dashboard.getByRole("row", { name: "Notification delivery", exact: true }).press("Enter");
  await expect(
    dashboard.getByRole("heading", { name: "Notification delivery", exact: true })
  ).toBeVisible();
  await expect(dashboard.getByText("Delivery #7", { exact: true })).toBeVisible();
  await dashboard.getByRole("button", { name: "Details", exact: true }).click();
  const details = page.getByRole("dialog", { name: "Delivery #7" });
  await expect(details.getByText("SMTP timeout", { exact: true })).toBeVisible();
  await details.getByRole("button", { name: "Retry delivery", exact: true }).click();
  const retryDialog = page.getByRole("dialog", { name: "Retry notification delivery" });
  await retryDialog.getByRole("textbox", { name: "Reason" }).fill("Provider health check passed.");
  await retryDialog.getByRole("button", { name: "Retry delivery", exact: true }).click();
  await expect.poll(() => retryRequest).toMatchObject({ reason: "Provider health check passed." });
  expect((retryRequest as unknown as Record<string, unknown>).requestId).toEqual(
    expect.any(String)
  );
  await expect(details.getByText("Queued", { exact: true })).toBeVisible();
});
