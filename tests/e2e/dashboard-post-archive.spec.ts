import { expect, test } from "@playwright/test";
import { mobileArticle } from "./fixtures/articles";

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" }, actionTimeout: 10_000 });

test("archives a published article from its row menu", async ({ page }) => {
  const post = { ...mobileArticle, title: "Published archive fixture" };
  const postsPath = "/api/v1/admin/posts";
  let archiveAttempts = 0;
  let editorRequests = 0;

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

  await page.route("**/api/v1/**", (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const fulfill = (data: unknown) => route.fulfill({ json: { code: 200, message: "OK", data } });
    if (pathname === "/api/v1/user/me") return fulfill({ id: 1, username: "owner" });
    if (pathname === postsPath) {
      return fulfill({ list: [post], total: 1, page: 0, size: 30, totalPages: 1 });
    }
    if (pathname === `${postsPath}/${post.id}/archive`) {
      expect(request.method()).toBe("POST");
      expect(request.postDataJSON()).toEqual({ reason: "Older article" });
      if (++archiveAttempts === 1) {
        return route.fulfill({
          status: 409,
          json: { code: 409, message: "Archive temporarily unavailable" },
        });
      }
      post.status = "ARCHIVED";
      return fulfill(null);
    }
    if (pathname.startsWith(`${postsPath}/`)) editorRequests++;
    return route.fallback();
  });

  await page.goto("/?dashboard=%2Fposts");
  const dashboard = page.getByRole("dialog", { name: "Dashboard Overlay" });
  const row = dashboard.getByRole("row").filter({ hasText: post.title });
  const rowActions = row.getByRole("button", { name: "Article actions" });
  await expect(row.getByText("Published", { exact: true })).toBeVisible();
  await rowActions.click();
  const archiveAction = page.getByRole("menuitem", { name: "Archive article" });
  await expect(archiveAction).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Delete", exact: true })).toHaveCount(0);
  await archiveAction.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Archive article" });
  const confirm = dialog.getByRole("button", { name: "Archive article" });
  await expect(confirm).toBeDisabled();
  await dialog.getByRole("textbox", { name: "Reason for archiving" }).fill("  Older article  ");
  await confirm.press("Enter");
  await expect(dialog.getByText("Archive temporarily unavailable")).toBeVisible();
  await expect(confirm).toBeEnabled();
  await confirm.press("Enter");

  await expect(dialog).toBeHidden();
  await expect(row.getByText("Archived", { exact: true })).toBeVisible();
  await rowActions.click();
  await expect(page.getByRole("menuitem", { name: "Delete", exact: true })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Archive article" })).toHaveCount(0);
  expect(archiveAttempts).toBe(2);
  expect(editorRequests).toBe(0);
});
