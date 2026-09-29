import { expect, test } from "@playwright/test";

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
const code = "const result = " + '"'.repeat(80) + ";";

test.use({ locale: "en-US" });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          window.sessionStorage.setItem("copied-article-link", value);
        },
      },
    });
  });
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/public/blog/posts/mobile-reading") {
      return route.fulfill({
        json: envelope({
          id: 321,
          title: "Mobile reading article",
          slug: "mobile-reading",
          summary: "A compact article used for mobile reading regression coverage.",
          contentType: "JSON",
          content: JSON.stringify({
            type: "doc",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "Opening paragraph." }] },
              {
                type: "codeBlock",
                attrs: { language: "typescript" },
                content: [{ type: "text", text: code }],
              },
              {
                type: "image",
                attrs: {
                  src: "https://images.example.com/mobile-reading.jpg",
                  alt: "Reading detail",
                  caption: "A reading detail",
                  widthPercent: 100,
                  alignment: "center",
                },
              },
            ],
          }),
          status: "PUBLISHED",
          isFeatured: false,
          views: 12,
          likesCount: 2,
          favoritesCount: 1,
          isLiked: false,
          isFavorited: false,
          authorName: "Odyssey",
          authorAvatar: "",
          category: null,
          series: null,
          seriesOrder: null,
          tags: [],
          publishedAt: "2026-09-20T00:00:00Z",
          createdAt: "2026-09-20T00:00:00Z",
          updatedAt: "2026-09-20T00:00:00Z",
          navigation: null,
        }),
      });
    }
    if (path.endsWith("/related")) return route.fulfill({ json: envelope([]) });
    if (path.endsWith("/featured")) {
      return route.fulfill({
        json: envelope({ list: [], page: 0, size: 5, total: 0, totalPages: 0 }),
      });
    }
    return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
  });
});

test("keeps article reading usable on a narrow viewport", async ({ page }) => {
  await page.goto("/single/mobile-reading");

  await expect(
    page.getByRole("heading", { name: "Mobile reading article", exact: true })
  ).toBeVisible();
  await expect(page.locator('.ProseMirror[contenteditable="false"]')).toBeVisible();
  await expect(page.locator("[data-reading-content]")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const codeBlock = page.locator(".node-codeBlock").first();
  await expect(codeBlock.getByRole("button", { name: "Copy code" })).toBeVisible();
  expect(
    await codeBlock
      .locator("[data-node-view-content-react]")
      .evaluate((element) => element.scrollWidth > element.clientWidth)
  ).toBe(true);

  const image = page.getByRole("img", { name: "Reading detail" });
  await image.click();
  await expect(page.locator(".fixed.z-\\[200\\] img")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".fixed.z-\\[200\\]")).toHaveCount(0);

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.evaluate(() => window.scrollTo(0, 200));
  await expect(page.getByRole("button", { name: "More article actions" })).toBeVisible();
});

test("uses Web Share when the browser provides it", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        window.sessionStorage.setItem("shared-article", JSON.stringify(data));
      },
    });
  });

  await page.goto("/single/mobile-reading");
  await expect(
    page.getByRole("heading", { name: "Mobile reading article", exact: true })
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.getByRole("button", { name: "More article actions" }).click();
  await page.getByRole("button", { name: "Share article" }).click();

  await expect
    .poll(() => page.evaluate(() => window.sessionStorage.getItem("shared-article")))
    .toBe(
      JSON.stringify({
        title: "Mobile reading article",
        text: "A compact article used for mobile reading regression coverage.",
        url: "http://127.0.0.1:3100/single/mobile-reading",
      })
    );
  await expect(page.getByText("Article shared.", { exact: true })).toBeVisible();
});

test("copies the article link when Web Share is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
  });

  await page.goto("/single/mobile-reading");
  await expect(
    page.getByRole("heading", { name: "Mobile reading article", exact: true })
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.getByRole("button", { name: "More article actions" }).click();
  await page.getByRole("button", { name: "Share article" }).click();

  await expect
    .poll(() => page.evaluate(() => window.sessionStorage.getItem("copied-article-link")))
    .toBe("http://127.0.0.1:3100/single/mobile-reading");
  await expect(page.getByText("Article link copied.", { exact: true })).toBeVisible();
});
