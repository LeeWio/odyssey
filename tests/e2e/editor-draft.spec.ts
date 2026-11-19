import { expect, test, type Page } from "@playwright/test";

const origin = "/test/rich-text?modal=1&postId=new";
const draftPath = "/api/v1/admin/posts/editor-drafts/new";
const marker = "This draft belongs to my article.";

test.use({ locale: "en-US", actionTimeout: 10_000 });

async function openEditor(page: Page) {
  await page.getByRole("button", { name: "Open editor", exact: true }).press("Enter");
  const modal = page.getByRole("dialog", { name: "Create article", exact: true });
  const document = modal.locator('.tiptap[contenteditable="true"]');
  await expect(document).toBeVisible();
  return { modal, document };
}

test("keeps one private draft across reload, retries a failed save, and discards it", async ({
  page,
}) => {
  let snapshot: Record<string, unknown> | null = null;
  let writes = 0;
  let failNextWrite = true;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "editor-fixture",
        username: "writer",
        roles: ["ROLE_ADMIN"],
        permissions: [],
        isAuthenticated: true,
      })
    );
  });
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const { pathname, searchParams } = new URL(request.url());
    const fulfill = (data: unknown) => route.fulfill({ json: { code: 200, message: "OK", data } });
    if (pathname === "/api/v1/user/me") return fulfill({ id: 1, username: "writer" });
    if (pathname !== draftPath) return route.fallback();
    if (request.method() === "GET") return fulfill(snapshot);
    if (request.method() === "DELETE") {
      expect(searchParams.get("revision")).toBe(snapshot?.revision);
      snapshot = null;
      return fulfill(null);
    }
    expect(request.method()).toBe("PUT");
    if (failNextWrite) {
      failNextWrite = false;
      return route.abort("internetdisconnected");
    }
    const { revision, ...fields } = request.postDataJSON();
    expect(revision).toBe(snapshot?.revision ?? null);
    snapshot = { ...fields, revision: `revision-${++writes}`, savedAt: "2026-11-19T11:00:00Z" };
    return fulfill(snapshot);
  });

  await page.goto(origin);
  const { modal, document } = await openEditor(page);
  await document.fill(marker);
  await expect(
    modal.getByRole("status").filter({ hasText: "Draft could not be saved" })
  ).toBeVisible();
  await expect(document).toContainText(marker);
  await modal.getByRole("button", { name: "Retry", exact: true }).press("Enter");
  await expect(modal.getByRole("status").filter({ hasText: /^Draft saved$/ })).toBeVisible();

  await modal.getByRole("button", { name: "Open settings" }).press("Enter");
  await modal.getByRole("textbox", { name: /^Title/ }).fill("A private draft title");
  await modal.getByRole("button", { name: "Close editor" }).press("Enter");
  await expect(modal).toBeHidden();
  expect(snapshot).toMatchObject({ postData: { title: "A private draft title" } });
  const browserDraft = await page.evaluate(() =>
    localStorage.getItem("odyssey_rich_text_draft:new")
  );
  expect(browserDraft).toBeNull();

  await page.reload();
  const reopened = await openEditor(page);
  await expect(reopened.document).toContainText(marker);
  await reopened.modal.getByRole("button", { name: "Open settings" }).press("Enter");
  await expect(reopened.modal.getByRole("textbox", { name: /^Title/ })).toHaveValue(
    "A private draft title"
  );
  await reopened.modal.getByRole("button", { name: "Discard draft", exact: true }).press("Enter");
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Discard draft", exact: true })
    .press("Enter");
  await expect(modal).toBeHidden();
  expect(snapshot).toBeNull();
  await expect((await openEditor(page)).document).not.toContainText(marker);
});
