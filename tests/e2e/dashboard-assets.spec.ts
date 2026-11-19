import { expect, test, type Page } from "@playwright/test";

const filesPath = "/api/v1/admin/files";

const asset = (id: number, originalName: string) => ({
  id,
  originalName,
  fileName: `stored-${id}.pdf`,
  fileUrl: `https://assets.example.test/stored-${id}.pdf`,
  thumbnailUrl: null,
  width: null,
  height: null,
  fileSize: 2048,
  fileType: "application/pdf",
  createdAt: "2026-11-19T04:00:00",
});

async function openAssets(page: Page) {
  await page.getByRole("button", { name: "Open account menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Dashboard", exact: true }).press("Enter");
  const dashboard = page.getByRole("dialog", { name: "Dashboard Overlay" });
  await dashboard.getByRole("row", { name: "Materials", exact: true }).press("Enter");
  return page.getByRole("region", { name: "Asset files" });
}

async function prepare(page: Page) {
  const state = {
    assets: Array.from({ length: 20 }, (_, index) =>
      asset(21 - index, `Asset ${21 - index}.pdf`)
    ).concat(asset(1, "Original chart.pdf")),
    deletedName: "",
    removals: 0,
    uploads: 0,
    failSearch: true,
  };

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

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;
    const fulfill = (data: unknown) => route.fulfill({ json: { code: 200, message: "OK", data } });
    if (pathname === filesPath) {
      expect(url.searchParams.getAll("sort")).toEqual(["createdAt,desc", "id,desc"]);
      const keyword = url.searchParams.get("keyword")?.toLowerCase() ?? "";
      if (keyword && state.failSearch) {
        state.failSearch = false;
        return route.fulfill({ status: 500, json: { code: 500, message: "Try again" } });
      }
      const matches = state.assets.filter((file) =>
        file.originalName.toLowerCase().includes(keyword)
      );
      const index = Number(url.searchParams.get("page"));
      const size = Number(url.searchParams.get("size"));
      return fulfill({
        list: matches.slice(index * size, (index + 1) * size),
        total: matches.length,
        page: index + 1,
        size,
        totalPages: Math.ceil(matches.length / size),
      });
    }
    if (pathname === `${filesPath}/upload` && request.method() === "POST") {
      state.uploads += 1;
      if (state.uploads === 1) {
        return route.fulfill({ status: 500, json: { code: 500, message: "Upload failed" } });
      }
      const uploaded = asset(22, "Uploaded report.pdf");
      state.assets.unshift(uploaded);
      return fulfill(uploaded);
    }
    if (pathname.startsWith(`${filesPath}/`) && request.method() === "DELETE") {
      state.deletedName = decodeURIComponent(pathname.slice(filesPath.length + 1));
      state.removals += 1;
      if (state.removals > 1) {
        state.assets = state.assets.filter((file) => file.fileName !== state.deletedName);
      }
      return fulfill(null);
    }
    if (pathname.startsWith(`${filesPath}/`) && pathname.endsWith("/usage")) {
      return fulfill({ total: 0, locations: [] });
    }
    if (pathname === `${filesPath}/inventory`) {
      return fulfill({ providerType: "local", assetCount: state.assets.length });
    }
    if (pathname === `${filesPath}/integrity`) return fulfill({ checkedAssetCount: 0 });
    if (pathname === "/api/v1/user/me") return fulfill({ id: 1, username: "owner" });
    if (pathname.endsWith("/unread/count")) return fulfill(0);
    return route.fallback();
  });

  await page.goto("/");
  return state;
}

test.use({ locale: "en-US", actionTimeout: 10_000 });

test("browses existing assets, recovers a failed search and removes the last asset on a page", async ({
  page,
}) => {
  const state = await prepare(page);
  const files = await openAssets(page);
  await expect(files.getByText("Asset 21.pdf", { exact: true })).toBeVisible();
  await files.getByRole("button", { name: "Next" }).click();
  await expect(files.getByText("Original chart.pdf", { exact: true })).toBeVisible();
  await expect(files.getByText("Asset 21.pdf", { exact: true })).toHaveCount(0);

  await files.getByRole("textbox", { name: "Filename" }).fill(" chart ");
  await files.getByRole("button", { name: "Search", exact: true }).click();
  await expect(files.getByText("Couldn’t load asset files.")).toBeVisible();
  await files.getByRole("button", { name: "Retry list" }).click();
  await expect(files.getByText("Original chart.pdf", { exact: true })).toBeVisible();
  await expect(files.getByRole("navigation", { name: "Asset pages" })).toHaveCount(0);

  await files.getByRole("button", { name: "Clear", exact: true }).click();
  await files.getByRole("button", { name: "Next" }).click();
  await files.getByRole("button", { name: "Delete Original chart.pdf" }).click();
  const confirmation = page.getByRole("alertdialog", { name: "Delete asset?" });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  expect(state.deletedName).toBe("stored-1.pdf");
  await expect(files.getByText("Original chart.pdf", { exact: true })).toBeVisible();
  await files.getByRole("button", { name: "Delete Original chart.pdf" }).click();
  await confirmation.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  expect(state.removals).toBe(2);
  await expect(files.getByText("Asset 21.pdf", { exact: true })).toBeVisible();
  await expect(files.getByRole("navigation", { name: "Asset pages" })).toHaveCount(0);
});

test("retries the same file and refreshes the server-backed list", async ({ page }) => {
  const state = await prepare(page);
  const files = await openAssets(page);
  await expect(files.getByText("Asset 21.pdf", { exact: true })).toBeVisible();
  await page
    .getByRole("dialog", { name: "Dashboard Overlay" })
    .locator("input[type=file]")
    .setInputFiles({
      name: "Uploaded report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    });
  await expect(page.getByText("Upload failed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Retry upload", exact: true }).click();
  await expect(files.getByText("Uploaded report.pdf", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Dashboard Overlay" }).getByText("22", { exact: true })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry upload", exact: true })).toHaveCount(0);
  expect(state.uploads).toBe(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(files.getByRole("button", { name: "Preview Uploaded report.pdf" })).toBeVisible();
  expect(await files.evaluate((section) => section.scrollWidth)).toBeLessThanOrEqual(
    await files.evaluate((section) => section.clientWidth)
  );
});

test("keeps deletion disabled when the usage check fails or finds a reference", async ({
  page,
}) => {
  const state = await prepare(page);
  let attempts = 0;
  await page.route("**/api/v1/admin/files/stored-21.pdf/usage", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      return route.fulfill({ status: 503, json: { code: 503, message: "Unavailable" } });
    }
    return route.fulfill({
      json: {
        code: 200,
        message: "OK",
        data: {
          total: 3,
          locations: [
            { kind: "SERIES_COVER", id: 17, label: "A draft column" },
            { kind: "FRIEND_LINK_AVATAR", id: 18, label: "A site" },
            { kind: "ARTICLE_REVISION", id: 19, label: "Saved title · v3" },
          ],
        },
      },
    });
  });
  const files = await openAssets(page);
  await files.getByRole("button", { name: "Delete Asset 21.pdf", exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: "Delete asset?" });
  const remove = dialog.getByRole("button", { name: "Delete", exact: true });
  await expect(dialog.getByText("Couldn’t check usage.", { exact: false })).toBeVisible();
  await expect(remove).toBeDisabled();
  await dialog.getByRole("button", { name: "Retry usage check" }).click();
  await expect(dialog.getByText("Column cover · A draft column", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Friend link avatar · A site", { exact: true })).toBeVisible();
  await expect(
    dialog.getByText("Article revision · Saved title · v3", { exact: true })
  ).toBeVisible();
  await expect(remove).toBeDisabled();
  expect(state.removals).toBe(0);
});
