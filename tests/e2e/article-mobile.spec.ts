import { mobileArticle } from "./fixtures/articles";
import { expect, test, type Page } from "@playwright/test";

const envelope = (data: unknown) => ({ code: 200, message: "OK", data });

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
        json: envelope(mobileArticle),
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

test("renders a readable article on mobile @smoke", async ({ page }) => {
  await page.goto("/single/mobile-reading");
  await expect(page.getByRole("heading", { name: mobileArticle.title, exact: true })).toBeVisible();
  await expect(
    page
      .locator("[data-reading-content]")
      .getByRole("heading", { name: "Chapter one", exact: true })
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("keeps article reading usable on a narrow viewport", async ({ page }) => {
  await page.goto("/single/mobile-reading");

  await expect(
    page.getByRole("heading", { name: "Mobile reading article", exact: true })
  ).toBeVisible();
  await expect(page.locator('.ProseMirror[contenteditable="false"]')).toBeVisible();
  await expect(page.locator("[data-reading-content]")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const codeBlock = page.locator(".ProseMirror pre").first();
  await expect(codeBlock).toBeVisible();
  expect(await codeBlock.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
    true
  );

  const figure = page.getByRole("figure", { name: "A reading detail" });
  await expect(figure.getByRole("img", { name: "Reading detail" })).toBeVisible();
  await expect(figure.getByText("A reading detail", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "More article actions" })).toBeVisible();
});

async function openShareDialog(page: Page) {
  await page.goto("/single/mobile-reading");
  await expect(page.locator('.ProseMirror[contenteditable="false"]')).toBeVisible();
  await page.getByRole("button", { name: "Share article", exact: true }).press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test("offers share destinations for the current article", async ({ page, baseURL }) => {
  const dialog = await openShareDialog(page);
  const url = new URL("/single/mobile-reading", baseURL).href;
  const email = dialog.getByRole("link", { name: "Email", exact: true });
  await expect(email).toHaveAttribute(
    "href",
    `mailto:?subject=${encodeURIComponent(mobileArticle.title)}&body=${encodeURIComponent(url)}`
  );
});

test("copies the current article URL from the share dialog", async ({ page, baseURL }) => {
  const dialog = await openShareDialog(page);
  await dialog.getByRole("button", { name: "Copy link", exact: true }).press("Enter");
  await expect
    .poll(() => page.evaluate(() => window.sessionStorage.getItem("copied-article-link")))
    .toBe(new URL("/single/mobile-reading", baseURL).href);
  await expect(page.getByText("Article link copied.", { exact: true })).toBeVisible();
});

test("places a heading anchor below the site navigation", async ({ page }) => {
  await page.goto("/single/mobile-reading");
  const heading = page
    .locator(".ProseMirror")
    .getByRole("heading", { name: "Chapter one", exact: true });
  await expect(heading).toHaveAttribute("id", "chapter-one");

  await page.getByRole("button", { name: "On this page", exact: true }).press("Enter");
  await page.getByRole("option", { name: "Chapter one", exact: true }).press("Enter");
  await expect(page).toHaveURL(/#chapter-one$/);
  await expect
    .poll(async () =>
      heading.evaluate((element) => {
        const top = element.getBoundingClientRect().top;
        return top >= 96 && top < 180;
      })
    )
    .toBe(true);
});
