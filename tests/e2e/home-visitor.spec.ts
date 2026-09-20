import { expect, test, type Page } from "@playwright/test";

const momentsPath = "/api/v1/public/moments";
const writingPath = "/api/v1/public/blog/posts/featured";
const envelope = (list: unknown[]) => ({
  code: 200,
  message: "OK",
  data: { list, page: 0, size: 18, total: list.length, totalPages: list.length ? 1 : 0 },
});
const moment = {
  id: 44,
  content: "A small visitor-facing note.",
  likesCount: 0,
  commentsCount: 0,
  visibility: "public",
  images: [],
  topics: [],
  createdAt: "2026-09-20T06:12:26",
  updatedAt: "2026-09-20T06:12:26",
};
const post = {
  id: 44,
  title: "An essay for visitors",
  slug: "visitor-essay",
  summary: "A short field note.",
  category: null,
  views: 0,
  likesCount: 0,
  publishedAt: "2026-09-20T06:12:26",
};

async function mockEmptyHome(page: Page) {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === momentsPath || path === writingPath) {
      return route.fulfill({ json: envelope([]) });
    }
    return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
  });
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`home hydrates with reduced motion at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockEmptyHome(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && /hydration|hydrated|didn't match/i.test(message.text())) {
        errors.push(message.text());
      }
    });
    await page.goto("/");
    await expect(page.locator("#home-hero-title")).toBeVisible();
    const hello = page.locator('svg[aria-label="Hello"]');
    await expect(hello).toBeVisible();
    await expect(hello.locator("animate")).toHaveCount(0);
    await expect(hello.locator("path")).toHaveAttribute("stroke-dasharray", "99 1");
    await expect(hello.locator("stop").first()).toHaveCSS("animation-name", "none");
    await expect(page.locator("#moments-showcase")).toHaveCount(0);
    await expect(page.locator("#writing")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(hello.locator("animate")).toHaveCount(4);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(hello.locator("animate")).toHaveCount(0);
    await expect(hello.locator("path")).toHaveAttribute("stroke-dasharray", "99 1");
    expect(errors).toEqual([]);
  });
}

for (const scenario of [
  { subject: "moments", path: momentsPath, section: "#moments-showcase", item: moment },
  { subject: "writing", path: writingPath, section: "#writing", item: post },
]) {
  test(`${scenario.subject} stays discoverable after failure and recovers with one retry`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockEmptyHome(page);
    let requests = 0;
    let releaseRetry: () => void = () => {};
    const retryGate = new Promise<void>((resolve) => {
      releaseRetry = resolve;
    });
    await page.route(`**${scenario.path}?**`, async (route) => {
      requests += 1;
      if (requests === 1) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
      await retryGate;
      return route.fulfill({ json: envelope([scenario.item]) });
    });
    await page.goto("/");
    const section = page.locator(scenario.section);
    await expect(
      section.getByText(`Couldn't load ${scenario.subject}.`, { exact: true })
    ).toBeVisible();
    const retry = section.getByRole("button", { name: `Retry loading ${scenario.subject}` });
    await retry.focus();
    await page.keyboard.press("Enter");
    try {
      await expect(retry).toBeDisabled();
      await expect.poll(() => requests).toBe(2);
    } finally {
      releaseRetry();
    }
    await expect(retry).toHaveCount(0);
    await expect(
      section.getByText(scenario.subject === "moments" ? moment.content : post.title, {
        exact: true,
      })
    ).toBeVisible();
    expect(requests).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    if (scenario.subject === "writing") {
      await expect(section.getByRole("link", { name: "Read the essay" })).toHaveAttribute(
        "href",
        "/single/visitor-essay"
      );
    }
  });
}

test("successful empty retry hides an empty section without a false error", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockEmptyHome(page);
  let requests = 0;
  await page.route(`**${momentsPath}?**`, (route) => {
    requests += 1;
    return requests === 1
      ? route.fulfill({ status: 503, json: { message: "Unavailable" } })
      : route.fulfill({ json: envelope([]) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Retry loading moments" }).click();
  await expect(page.locator("#moments-showcase")).toHaveCount(0);
  expect(requests).toBe(2);
});

for (const scenario of [
  {
    subject: "moments",
    path: momentsPath,
    section: "#moments-showcase",
    item: moment,
    text: moment.content,
  },
  { subject: "writing", path: writingPath, section: "#writing", item: post, text: post.title },
]) {
  test(`${scenario.subject} keeps cached content when reconnect refresh fails`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockEmptyHome(page);
    let requests = 0;
    await page.route(`**${scenario.path}?**`, (route) => {
      requests += 1;
      return requests === 2
        ? route.fulfill({ status: 503, json: { message: "Unavailable" } })
        : route.fulfill({ json: envelope([scenario.item]) });
    });
    await page.goto("/");
    const section = page.locator(scenario.section);
    await expect(section.getByText(scenario.text, { exact: true })).toBeVisible();
    await page.evaluate(() => {
      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("online"));
    });
    await expect(section.getByRole("status")).toContainText(
      `Couldn't refresh ${scenario.subject}.`
    );
    await expect(section.getByText(scenario.text, { exact: true })).toBeVisible();
    await section.getByRole("button", { name: `Retry loading ${scenario.subject}` }).click();
    await expect(section.getByRole("status")).toHaveCount(0);
    await expect(section.getByText(scenario.text, { exact: true })).toBeVisible();
    expect(requests).toBe(3);
  });
}
