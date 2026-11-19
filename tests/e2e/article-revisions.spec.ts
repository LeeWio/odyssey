import { expect, test, type Page } from "@playwright/test";

const postId = 417;
const postPath = `/api/v1/admin/posts/${postId}`;
const markup = '<img src="/revision-preview-must-not-load.png">';
const date = "2026-11-19T04:00:00";

const article = {
  id: postId,
  slug: "revision-workflow",
  title: "Revision workflow",
  content: '{"type":"doc","content":[{"type":"paragraph"}]}',
  contentType: "JSON",
  status: "DRAFT",
  isFeatured: false,
  views: 0,
  likesCount: 0,
  favoritesCount: 0,
  authorName: "owner",
  category: null,
  series: null,
  seriesOrder: null,
  createdAt: date,
  updatedAt: date,
};

test.use({ locale: "en-US", actionTimeout: 10_000 });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "admin-test-token",
        username: "owner",
        roles: ["ROLE_ADMIN"],
        permissions: [],
        isAuthenticated: true,
      })
    );
  });
});

function savedVersions(latestVersion: number) {
  return Array.from({ length: latestVersion }, (_, index) => {
    const versionNumber = latestVersion - index;
    return {
      id: 500 + versionNumber,
      postId,
      title: article.title,
      summary: null,
      content: "",
      versionNumber,
      createdBy: "owner",
      createdAt: date,
    };
  });
}

async function openVersionHistory(page: Page) {
  await page.goto(`/test/rich-text?modal=1&postId=${postId}`);
  await page.getByRole("button", { name: "Open editor", exact: true }).click();

  const editor = page.getByRole("dialog", { name: "Edit article", exact: true });
  await editor.getByRole("button", { name: "Open settings" }).click();
  await editor.getByRole("button", { name: "Version history", exact: true }).click();
  return page.getByRole("dialog", { name: "Version history", exact: true });
}

test("compares saved versions in the editor and handles retry and baseline changes", async ({
  page,
}) => {
  let defaultAttempts = 0;
  let writes = 0;
  const comparisons: string[][] = [];

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const { pathname, searchParams } = new URL(request.url());
    const fulfill = (data: unknown) => route.fulfill({ json: { code: 200, message: "OK", data } });
    if (pathname.startsWith(postPath) && request.method() !== "GET") {
      writes += 1;
      return route.fulfill({ status: 405 });
    }
    if (pathname === postPath) return fulfill(article);
    if (pathname === `${postPath}/revisions`) {
      return fulfill(savedVersions(3));
    }
    if (pathname === `${postPath}/revisions/compare`) {
      const baseId = searchParams.get("baseId") ?? "";
      const targetId = searchParams.get("targetId") ?? "";
      comparisons.push([baseId, targetId]);
      if (baseId === "502" && ++defaultAttempts === 1) {
        return route.fulfill({ status: 503, json: { code: 503, message: "Try again" } });
      }
      const unchanged = { changed: false, original: "", revised: "", diffHtml: "" };
      return fulfill({
        title: unchanged,
        summary: unchanged,
        content:
          baseId === "501"
            ? unchanged
            : { changed: true, original: "Earlier body", revised: markup, diffHtml: markup },
      });
    }
    if (pathname === "/api/v1/user/me") return fulfill({ id: 1, username: "owner" });
    if (pathname.endsWith("/unread/count")) return fulfill(0);
    if (pathname.includes("/autosave/")) return fulfill(null);
    return route.fallback();
  });

  const history = await openVersionHistory(page);
  await expect(history.getByRole("button", { name: "Compare versions" })).toBeVisible();
  expect(comparisons).toHaveLength(0);
  await history.getByRole("button", { name: "Compare versions" }).click();
  const comparison = history.getByRole("region", { name: "Version comparison" });
  await expect(comparison.getByText("Unable to compare versions")).toBeVisible();
  await comparison.getByRole("button", { name: "Retry comparison" }).click();
  await expect(comparison.getByText("From version 2")).toBeVisible();
  await expect(comparison.getByText("To version 3")).toBeVisible();
  await expect(comparison.getByText(markup, { exact: true })).toBeVisible();
  await expect(comparison.locator("img")).toHaveCount(0);
  expect(comparisons).toEqual([
    ["502", "503"],
    ["502", "503"],
  ]);

  await comparison.getByRole("button", { name: /compare from/i }).click();
  await page.getByRole("option", { name: "Version 1", exact: true }).click();
  await expect(comparison.getByText("The title, summary, and body match.")).toBeVisible();
  await expect(comparison.getByText(markup, { exact: true })).toHaveCount(0);
  expect(comparisons.at(-1)).toEqual(["501", "503"]);

  await page.setViewportSize({ width: 390, height: 720 });
  await expect(comparison.getByText("Version 1 → version 3")).toBeVisible();
  await comparison.getByRole("button", { name: /compare from/i }).click();
  await page.getByRole("option", { name: "Version 2", exact: true }).click();
  await expect(comparison.getByText(markup, { exact: true })).toBeVisible();
  expect(await history.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(
    await history.evaluate((element) => element.clientWidth)
  );
  expect(writes).toBe(0);
});

test("blocks a stale restore and requires a fresh confirmation", async ({ page }) => {
  let latestVersion = 3;
  let refreshFails = false;
  const restoreRequests: (string | undefined)[] = [];

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const fulfill = (data: unknown) => route.fulfill({ json: { code: 200, message: "OK", data } });
    if (pathname === postPath) return fulfill(article);
    if (pathname === `${postPath}/revisions`) {
      if (refreshFails) {
        return route.fulfill({ status: 503, json: { code: 503, message: "Try again" } });
      }
      return fulfill(savedVersions(latestVersion));
    }
    if (pathname === `${postPath}/revisions/501/revert`) {
      const expectedVersion = request.headers()["if-match"];
      restoreRequests.push(expectedVersion);
      if (expectedVersion !== `"revision-${latestVersion}"`) {
        refreshFails = true;
        return route.fulfill({ status: 409, json: { code: 409, message: "Stale version" } });
      }
      return fulfill(article);
    }
    if (pathname === "/api/v1/user/me") return fulfill({ id: 1, username: "owner" });
    if (pathname.endsWith("/unread/count")) return fulfill(0);
    if (pathname.includes("/autosave/")) return fulfill(null);
    return route.fallback();
  });

  const history = await openVersionHistory(page);
  await history.getByRole("button", { name: /^Version 1/ }).click();
  const restore = history.getByRole("button", { name: "Restore selected version" });
  await restore.click();
  const confirmation = page.getByRole("alertdialog", { name: "Restore this version?" });
  await expect(confirmation.getByText(/version 1 over the current saved version 3/)).toBeVisible();

  latestVersion = 4;
  await confirmation.getByRole("button", { name: "Restore version", exact: true }).click();
  await expect(confirmation).toBeHidden();
  await expect(history.getByText("A newer version was saved")).toBeVisible();
  await expect(history.getByText("Unable to load versions")).toBeVisible();
  await expect(restore).toBeDisabled();
  expect(restoreRequests).toEqual(['"revision-3"']);

  refreshFails = false;
  await history.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(history.getByRole("button", { name: /^Version 4/ })).toBeVisible();
  await restore.click();
  await expect(confirmation.getByText(/version 1 over the current saved version 4/)).toBeVisible();
  await confirmation.getByRole("button", { name: "Restore version", exact: true }).click();
  await expect(history).toBeHidden();
  expect(restoreRequests).toEqual(['"revision-3"', '"revision-4"']);
});
