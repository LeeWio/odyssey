import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const endpoint = "/api/v1/public/friend-links";
const links = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  name: index === 1 ? "AnUnbrokenName".repeat(10) : `Friend ${index + 1}`,
  url: `https://friend-${index + 1}.example`,
  avatar:
    index === 0
      ? "https://avatars.example/portrait.webp"
      : index === 2
        ? "https://avatars.example/missing.webp"
        : "",
  description:
    index === 3
      ? "  "
      : "Independent notes on the things that make everyday life interesting. ".repeat(3),
  email: null,
  status: "APPROVED",
  sortOrder: index,
  isPublished: true,
  createdAt: "2026-10-20T06:00:00Z",
  updatedAt: "2026-10-20T06:00:00Z",
}));
const response = (data: unknown) => ({ code: 200, message: "OK", data });

async function prepare(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({ status: 503, json: { message: "Unavailable" } })
  );
  await page.route("https://avatars.example/**", (route) =>
    route.request().url().endsWith("portrait.webp")
      ? route.fulfill({ contentType: "image/webp", body: readFileSync("public/music.webp") })
      : route.fulfill({ status: 404, body: "Not found" })
  );
}

test.use({ locale: "en-US" });

test("HeroUI cards stay ordered, aligned and keyboard accessible across viewports", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await prepare(page);
  let requests = 0;
  await page.route(`**${endpoint}`, (route) => {
    requests += 1;
    return route.fulfill({
      json: response([
        { ...links[0], id: 99, sortOrder: -1, url: "javascript:alert(1)" },
        ...links.toReversed(),
      ]),
    });
  });
  await page.goto("/");
  const section = page.locator("#friend-links-showcase");
  const heading = section.getByRole("link", { name: "Near & Far", exact: true });
  const directory = section.getByRole("list", { name: "Friends" });
  await expect(heading).toHaveAttribute("href", "/links");
  await expect(section.getByText("Good company knows no distance.", { exact: true })).toBeVisible();
  await expect(section.locator('a[href="/links"]')).toHaveCount(1);
  await expect(section.getByText("Visit the full blogroll", { exact: true })).toHaveCount(0);
  await expect(directory.locator(":scope > li")).toHaveCount(6);
  await expect(directory.locator('[data-slot="card"]')).toHaveCount(6);
  await expect(directory.locator('[data-slot="card-title"]')).toHaveCount(6);
  expect(
    await directory
      .getByRole("link", { includeHidden: true })
      .evaluateAll((elements) => elements.map((element) => element.getAttribute("href")))
  ).toEqual(links.slice(0, 6).map((link) => `${link.url}/`));

  for (const { width, columns, count } of [
    { width: 390, columns: 1, count: 4 },
    { width: 820, columns: 2, count: 6 },
    { width: 1440, columns: 3, count: 6 },
    { width: 2560, columns: 3, count: 6 },
    { width: 390, columns: 1, count: 4 },
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await section.scrollIntoViewIfNeeded();
    const entries = directory.locator(":scope > li:visible");
    await expect(entries).toHaveCount(count);
    const geometry = await entries.evaluateAll((elements) => {
      const boxes = elements.map((element) => element.getBoundingClientRect());
      return {
        columns: new Set(boxes.map((box) => Math.round(box.left))).size,
        heights: new Set(boxes.map((box) => Math.round(box.height))).size,
        footersAligned: elements.every((element, index) => {
          const footer = element.querySelector('[data-slot="card-footer"]')!;
          const previous = elements[index - 1];
          return (
            !previous ||
            Math.round(boxes[index].top) !== Math.round(boxes[index - 1].top) ||
            Math.abs(
              footer.getBoundingClientRect().top -
                previous.querySelector('[data-slot="card-footer"]')!.getBoundingClientRect().top
            ) < 1
          );
        }),
        overlap: boxes.some((box, index) =>
          boxes
            .slice(index + 1)
            .some(
              (other) =>
                Math.min(box.right, other.right) - Math.max(box.left, other.left) > 1 &&
                Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top) > 1
            )
        ),
        overflow: document.documentElement.scrollWidth > innerWidth,
        contentOverflow: elements.some((element) =>
          [...element.querySelectorAll("h3, p, a")].some((child) => {
            const outer = element.getBoundingClientRect();
            const inner = child.getBoundingClientRect();
            return inner.right > outer.right + 1 || inner.bottom > outer.bottom + 1;
          })
        ),
      };
    });
    expect(geometry).toEqual({
      columns,
      heights: 1,
      footersAligned: true,
      overlap: false,
      overflow: false,
      contentOverflow: false,
    });
    const first = entries.first().getByRole("link");
    await expect(first).toHaveAttribute("target", "_blank");
    await expect(first).toHaveAttribute("rel", "noopener noreferrer");
    await expect(first).toHaveAccessibleName("Visit Friend 1 (opens in a new window)");
    await expect(first.locator("img")).toBeVisible();
    await expect
      .poll(() =>
        first.locator("img").evaluate((image) => (image as HTMLImageElement).naturalWidth)
      )
      .toBeGreaterThan(0);
    await expect(entries.nth(2).locator('[data-slot="avatar-fallback"]')).toHaveText("F3");
    await expect(entries.nth(3).locator('[data-slot="card-description"]')).toHaveCount(0);
    const before = await first.boundingBox();
    await first.hover();
    expect(await first.boundingBox()).toEqual(before);
    await heading.focus();
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute("data-focus-visible", "true");
    expect(
      await first.evaluate((element) => {
        const style = getComputedStyle(element);
        return (
          (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) ||
          style.boxShadow !== "none"
        );
      })
    ).toBe(true);
    await section.screenshot({ path: testInfo.outputPath(`friends-${width}.png`) });
  }
  expect(requests).toBe(1);
  expect(errors).toEqual([]);
  // Hidden mobile entries must not remain in the keyboard path.
  await directory.locator(":scope > li:visible").last().getByRole("link").focus();
  await page.keyboard.press("Tab");
  expect(await directory.evaluate((element) => element.contains(document.activeElement))).toBe(
    false
  );
  await page
    .context()
    .route("https://friend-1.example/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<title>Friend 1</title>" })
    );
  const first = directory.getByRole("link").first();
  const bounds = await first.boundingBox();
  const popupPromise = page.waitForEvent("popup");
  await first.click({ position: { x: bounds!.width - 12, y: bounds!.height - 12 } });
  const popup = await popupPromise;
  await expect(popup).toHaveURL("https://friend-1.example/");
  await popup.close();
  await heading.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/links$/);
});

test("light theme retains visible keyboard focus with motion enabled", async ({
  page,
  baseURL,
}, testInfo) => {
  await prepare(page);
  await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "light" });
  await page.context().addCookies([
    { name: "odyssey_theme_mode", value: "light", url: baseURL! },
    { name: "odyssey_theme_resolved_mode", value: "light", url: baseURL! },
  ]);
  await page.addInitScript(() => localStorage.setItem("odyssey_theme_mode", "light"));
  await page.route(`**${endpoint}`, (route) => route.fulfill({ json: response(links) }));
  await page.goto("/");
  const section = page.locator("#friend-links-showcase");
  await expect(page.locator("html")).toHaveAttribute("data-theme-resolved-mode", "light");
  const first = section.getByRole("list").getByRole("link").first();
  await expect(first).toBeVisible();
  await section.scrollIntoViewIfNeeded();
  await section.getByRole("link", { name: "Near & Far", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute("data-focus-visible", "true");
  await expect(first).toHaveCSS("transform", "none");
  await section.screenshot({ path: testInfo.outputPath("friends-light.png") });
});

test("loading uses HeroUI cards and empty results retain the title link", async ({ page }) => {
  await prepare(page);
  const gate = Promise.withResolvers<void>();
  await page.route(`**${endpoint}`, async (route) => {
    await gate.promise;
    return route.fulfill({ json: response([]) });
  });
  await page.goto("/");
  const section = page.locator("#friend-links-showcase");
  try {
    const skeleton = section.getByRole("status", { name: "Loading friends" });
    await expect(skeleton).toHaveAttribute("aria-busy", "true");
    await expect(skeleton.locator(":scope > div")).toHaveCount(6);
    await expect(skeleton.locator('[data-slot="card"]')).toHaveCount(6);
    await expect(section.getByRole("link", { name: "Near & Far", exact: true })).toHaveAttribute(
      "href",
      "/links"
    );
  } finally {
    gate.resolve();
  }
  await expect(section.getByRole("status")).toHaveText("No public links just yet.");
  await expect(section.getByRole("link", { name: "Near & Far", exact: true })).toBeVisible();
});

test("failure stays compact and an explicit retry restores the directory", async ({ page }) => {
  await prepare(page);
  let requests = 0;
  await page.route(`**${endpoint}`, (route) => {
    requests += 1;
    return requests === 1
      ? route.fulfill({ status: 503, json: { message: "Unavailable" } })
      : route.fulfill({ json: response(links) });
  });
  await page.goto("/");
  const section = page.locator("#friend-links-showcase");
  await expect(section.getByRole("status")).toHaveText("The links couldn't be loaded right now.");
  await expect(section.getByRole("link", { name: "Near & Far", exact: true })).toHaveAttribute(
    "href",
    "/links"
  );
  await section.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(section.getByRole("list")).toBeVisible();
  expect(requests).toBe(2);
});

test.describe("Chinese", () => {
  test.use({ locale: "zh-CN" });

  test("localizes the title, copy, external-link names and failure", async ({ page }, testInfo) => {
    await prepare(page);
    await page.route(`**${endpoint}`, (route) => route.fulfill({ json: response(links) }));
    await page.goto("/");
    const section = page.locator("#friend-links-showcase");
    await expect(section.getByRole("heading", { name: "有朋自远方", exact: true })).toBeVisible();
    await expect(section.getByText("各在一方，亦有共鸣。", { exact: true })).toBeVisible();
    await expect(section.getByRole("list", { name: "同道" })).toBeVisible();
    await expect(
      section.getByRole("link", { name: "访问Friend 1（在新窗口打开）", exact: true })
    ).toBeVisible();
    await section.screenshot({ path: testInfo.outputPath("friends-zh.png") });
    await page.unroute(`**${endpoint}`);
    await page.reload();
    await expect(section.getByRole("status")).toHaveText("暂时无法加载友链。");
    await expect(section.getByRole("button", { name: "重试", exact: true })).toBeVisible();
  });
});
