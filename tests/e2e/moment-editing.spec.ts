import { expect, test, type Page } from "@playwright/test";
import type { MomentRequest, MomentResponse } from "@/lib/features/moment";

test.use({ locale: "en-US", actionTimeout: 10_000 });
const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});
const doc = (text: string) =>
  JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });

async function prepare(page: Page, role = "ROLE_ADMIN") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((role) => {
    if (!role) return;
    localStorage.setItem(
      "odyssey_auth",
      JSON.stringify({
        accessToken: "moment-edit-test",
        username: "owner",
        roles: [role],
        permissions: [],
        isAuthenticated: true,
      })
    );
  }, role);
  const state = {
    fail: false,
    delay: undefined as Promise<void> | undefined,
    requests: [] as string[],
    writes: [] as MomentRequest[],
    moments: Array.from({ length: 13 }, (_, index) => ({
      id: 100 - index,
      content: doc(`Original moment ${100 - index}`),
      likesCount: 3,
      commentsCount: 0,
      visibility: "public",
      authorName: "owner",
      createdAt: "2026-11-16T06:00:00Z",
      updatedAt: "2026-11-16T06:00:00Z",
      topics: [{ id: 1, slug: "editing" }],
      images: [],
    })) as MomentResponse[],
  };
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    state.requests.push(url.pathname);
    const fulfill = (data: unknown) => route.fulfill({ json: { code: 200, message: "OK", data } });
    if (/\/api\/v1\/admin\/moments\/\d+$/.test(url.pathname) && request.method() === "PUT") {
      const body = request.postDataJSON() as MomentRequest;
      state.writes.push(body);
      if (state.delay) await state.delay;
      if (state.fail)
        return route.fulfill({ status: 500, json: { code: 500, message: "Save failed" } });
      const id = Number(url.pathname.split("/").at(-1));
      const index = state.moments.findIndex((moment) => moment.id === id);
      state.moments[index] = {
        ...state.moments[index],
        ...body,
        images: [],
        topics: body.topicSlugs.map((slug, index) => ({ id: index + 1, slug })),
        updatedAt: "2026-11-16T07:00:00Z",
      };
      return fulfill(state.moments[index]);
    }
    if (url.pathname === "/api/v1/public/moments") {
      const topic = url.searchParams.get("topic");
      const moments = state.moments.filter(
        (moment) =>
          moment.visibility === "public" &&
          (!topic || moment.topics.some(({ slug }) => slug === topic))
      );
      const current = Number(url.searchParams.get("page") ?? 0);
      const size = Number(url.searchParams.get("size") ?? 12);
      return fulfill({
        list: moments.slice(current * size, (current + 1) * size),
        total: moments.length,
        totalPages: Math.ceil(moments.length / size),
        page: current + 1,
        size,
      });
    }
    if (url.pathname.endsWith("/moments/topics")) return fulfill([{ slug: "editing", count: 13 }]);
    if (url.pathname.endsWith("/moments/cadence"))
      return fulfill({
        zone: "UTC",
        day: { start: "2026-11-16T00:00:00Z", active: [6] },
        month: { start: "2026-11-01", days: 30, offset: 0, active: [15] },
        year: { year: 2026, active: [45] },
      });
    if (url.pathname.endsWith("/moments/liked")) return fulfill([]);
    if (url.pathname === "/api/v1/user/me") return fulfill({ id: 1, username: "owner" });
    if (url.pathname.endsWith("/new-count") || url.pathname.endsWith("/unread/count"))
      return fulfill(0);
    return fulfill([]);
  });
  return state;
}

async function openEditor(page: Page, id = 100, beforeOpen?: (scroll: number) => void) {
  await page.locator(`#moment-${id}`).getByRole("button", { name: "More options" }).click();
  await page.getByRole("menuitem", { name: "Edit moment", exact: true }).scrollIntoViewIfNeeded();
  beforeOpen?.(await page.evaluate(() => window.scrollY));
  await page.getByRole("menuitem", { name: "Edit moment", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit moment", exact: true });
  await expect(dialog.locator('[contenteditable="true"]')).toBeVisible({ timeout: 20_000 });
  return dialog;
}

async function visitFeed(page: Page, view = "list", secondPage = false) {
  // Switch filters after hydration so SSR data cannot bypass the mocked API.
  await page.goto(`/moments?topic=fixture-boot&view=${view}`);
  await page.getByRole("button", { name: "Topics", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "editing 13", exact: true }).click();
  await page.mouse.move(1, 400);
  await page.keyboard.press("Escape");
  await expect(page.locator("#moment-100")).toBeVisible();
  if (secondPage) {
    await page
      .getByRole("region", { name: "Moments feed" })
      .getByRole("button", { name: "Next", exact: true })
      .click();
    await expect(page.locator("#moment-88")).toBeVisible();
  }
}

for (const [width, view] of [
  [390, "list"],
  [1440, "grid"],
] as const) {
  test(`saves in place and preserves feed state at ${width}px`, async ({ page }, testInfo) => {
    const state = await prepare(page);
    await page.setViewportSize({ width, height: 900 });
    await visitFeed(page, view);
    const card = page.locator("#moment-100");
    await expect(card).toBeVisible();
    const node = await card.elementHandle();
    const originalUrl = page.url();
    await card.getByRole("button", { name: "More options" }).scrollIntoViewIfNeeded();
    let originalScroll = await page.evaluate(() => window.scrollY);
    const dialog = await openEditor(page, 100, (scroll) => {
      originalScroll = scroll;
    });
    await expect(dialog.locator('[contenteditable="true"]')).toHaveText("Original moment 100");
    await dialog.locator('[contenteditable="true"]').fill("Changed moment 100");
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
      true
    );
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await expect(dialog.getByRole("button", { name: "Close editor" })).toHaveCount(0);
    for (const label of ["Visibility", "Save changes"]) {
      const button = await dialog.getByRole("button", { name: label, exact: true }).boundingBox();
      expect(button!.x).toBeGreaterThanOrEqual(bounds!.x);
      expect(button!.x + button!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
    }
    await page.screenshot({ path: testInfo.outputPath(`edit-${width}.png`) });
    const sidebarRequests = state.requests.filter((path) =>
      /\/(topics|cadence)$/.test(path)
    ).length;
    await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(card).toContainText("Changed moment 100");
    expect(await node!.evaluate((node) => node === document.getElementById("moment-100"))).toBe(
      true
    );
    expect(page.url()).toBe(originalUrl);
    await expect(page.locator("[data-view]")).toHaveAttribute("data-view", view);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - originalScroll)).toBeLessThan(3);
    expect(state.writes).toHaveLength(1);
    expect(state.requests.filter((path) => /\/(topics|cadence)$/.test(path)).length).toBe(
      sidebarRequests
    );
    await expect(card.getByRole("button", { name: "More options" })).toBeFocused();
    await openEditor(page);
    await expect(dialog.locator('[contenteditable="true"]')).toHaveText("Changed moment 100");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    const second = await openEditor(page, 99);
    await expect(second.locator('[contenteditable="true"]')).toHaveText("Original moment 99");
  });
}

test("protects unsaved edits for Escape and backdrop", async ({ page }) => {
  await prepare(page);
  await visitFeed(page);
  const dialog = await openEditor(page);
  await dialog.locator('[contenteditable="true"]').fill("Unsaved changes");
  for (const close of [() => page.keyboard.press("Escape"), () => page.mouse.click(5, 5)]) {
    await close();
    const confirmation = page.getByRole("alertdialog", { name: "Discard changes?" });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Continue editing" }).click();
    await expect(confirmation).toHaveCount(0);
    await expect(dialog.locator('[contenteditable="true"]')).toHaveText("Unsaved changes");
    await dialog.locator('[contenteditable="true"]').focus();
  }
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await openEditor(page);
  await expect(dialog.locator('[contenteditable="true"]')).toHaveText("Original moment 100");
});

test("retains edits on failure, blocks dismissal while saving and retries", async ({ page }) => {
  const state = await prepare(page);
  state.fail = true;
  const pending = Promise.withResolvers<void>();
  state.delay = pending.promise;
  await visitFeed(page);
  const dialog = await openEditor(page);
  await dialog.locator('[contenteditable="true"]').fill("Retry these edits");
  await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Visibility", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  pending.resolve();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog.locator('[contenteditable="true"]')).toHaveText("Retry these edits");
  state.fail = false;
  await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#moment-100")).toContainText("Retry these edits");
  expect(state.writes).toHaveLength(2);
});

test("removes a private edit and returns an empty last page to a valid page", async ({ page }) => {
  await prepare(page);
  await visitFeed(page, "grid", true);
  const dialog = await openEditor(page, 88);
  await dialog.getByRole("button", { name: "Visibility", exact: true }).click();
  await page.getByRole("menuitemradio").filter({ hasText: "Private" }).click();
  await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/moments\?topic=editing&view=grid$/);
  await expect(page.locator("#moment-88")).toHaveCount(0);
  await expect(page.locator("#moment-100")).toBeVisible();
});

for (const role of ["", "ROLE_USER"]) {
  test(`does not expose editing for ${role || "guests"}`, async ({ page }) => {
    const state = await prepare(page, role);
    await visitFeed(page);
    await expect(page.locator("#moment-100")).toBeVisible();
    await page.locator("#moment-100").getByRole("button", { name: "More options" }).click();
    await expect(page.getByRole("menuitem", { name: "Edit moment" })).toHaveCount(0);
    expect(state.writes).toEqual([]);
  });
}
