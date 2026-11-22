import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test as base, type Page } from "@playwright/test";

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
const envelope = (data: unknown) => ({ code: 200, message: "OK", data });
test.use({ locale: "en-US" });

async function showFixtureFeed(page: Page) {
  await expect(page.getByRole("button", { name: "Topics", exact: true })).toBeEnabled();
  // Change filters after hydration to avoid using server-prefetched live data.
  await page.evaluate(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("topic", `reactions-test-${Date.now()}`);
    window.history.pushState(null, "", `${url.pathname}${url.search}`);
  });
  await expect(page.locator("#moment-100")).toBeVisible();
}

const savedPath = "/api/v1/user/moments/saved";
type BookmarkAccounts = Map<string, Map<number, boolean>>;

async function prepare(
  page: Page,
  {
    guest = false,
    reduced = false,
    username = "reader",
    accounts = new Map() as BookmarkAccounts,
    path = "/moments",
    legacyIds,
    failImport = false,
  }: {
    guest?: boolean;
    reduced?: boolean;
    username?: string;
    accounts?: BookmarkAccounts;
    path?: string;
    legacyIds?: number[];
    failImport?: boolean;
  } = {}
) {
  await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
  await page.addInitScript(
    ({ guest, username }) => {
      if (guest) return;
      localStorage.setItem(
        "odyssey_auth",
        JSON.stringify({
          accessToken: `moment-reactions-${username}`,
          username,
          roles: ["ROLE_USER"],
          permissions: [],
          isAuthenticated: true,
        })
      );
    },
    { guest, username }
  );
  if (legacyIds) {
    await page.addInitScript(
      ({ username, ids }) => {
        localStorage.setItem(`moments_bookmarks:${username}`, JSON.stringify(ids));
      },
      { username, ids: legacyIds }
    );
  }
  await page.route(
    /https:\/\/api\.(iconify\.design|simplesvg\.com|unisvg\.com)\//,
    async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname !== "/gravity-ui.json") return route.abort();
      const icons: Record<string, { body: string }> = {};
      for (const name of (url.searchParams.get("icons") ?? "").split(",")) {
        if (!/^[a-z-]+$/.test(name)) continue;
        const svg = await readFile(
          join(process.cwd(), "node_modules/@gravity-ui/icons/svgs", `${name}.svg`),
          "utf8"
        );
        try {
          icons[name] = {
            body: await page.evaluate(
              (source) =>
                new DOMParser().parseFromString(source, "image/svg+xml").documentElement.innerHTML,
              svg
            ),
          };
        } catch (error) {
          // Reloads can cancel an icon request while its document is being replaced.
          if (
            page.isClosed() ||
            (error instanceof Error && error.message.includes("Execution context was destroyed"))
          ) {
            return route.abort();
          }
          throw error;
        }
      }
      await route.fulfill({ json: { prefix: "gravity-ui", width: 16, height: 16, icons } });
    }
  );
  const liked = new Set<number>();
  const writes: string[] = [];
  const bookmarks = accounts.get(username) ?? new Map<number, boolean>();
  accounts.set(username, bookmarks);
  const savedIds = () => [...bookmarks].filter(([, saved]) => saved).map(([id]) => id);
  const savedRequests: string[] = [];
  const timelineRequests: string[] = [];
  const moment = (id: number) => ({
    id,
    content: `Reaction test moment ${id}`,
    likesCount: (id === 100 ? 8 : 0) + (liked.has(id) ? 1 : 0),
    commentsCount: 0,
    visibility: "public",
    authorName: "author",
    images: [],
    topics: [],
    createdAt: "2026-11-13T06:00:00Z",
    updatedAt: "2026-11-13T06:00:00Z",
  });
  const momentPage = (ids: number[]) => ({
    list: ids.map(moment),
    total: ids.length,
    page: 1,
    size: 12,
    totalPages: ids.length ? 1 : 0,
  });
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const fulfill = (data: unknown) => route.fulfill({ json: envelope(data) });
    if (/\/moments\/\d+\/like$/.test(path)) {
      writes.push(request.method());
      const id = Number(path.split("/").at(-2));
      if (request.method() === "POST") liked.add(id);
      else liked.delete(id);
      return fulfill(null);
    }
    if (path === savedPath || path.startsWith(`${savedPath}/`)) {
      savedRequests.push(`${request.method()} ${path}`);
      if (request.headers().authorization !== `Bearer moment-reactions-${username}`) {
        return route.fulfill({ status: 401, json: { message: "Unauthorized" } });
      }
      if (path === `${savedPath}/ids`) return fulfill(savedIds());
      if (path === savedPath) return fulfill(momentPage(savedIds()));
      if (path === `${savedPath}/import`) {
        if (failImport) {
          failImport = false;
          return route.fulfill({ status: 503, json: { message: "Temporary import failure" } });
        }
        for (const id of (request.postDataJSON() as { ids: number[] }).ids) {
          if (!bookmarks.has(id)) bookmarks.set(id, true);
        }
      } else {
        bookmarks.set(Number(path.split("/").at(-1)), request.method() === "PUT");
      }
      return fulfill(null);
    }
    if (path === "/api/v1/user/me") return fulfill({ id: 1, username });
    if (path.endsWith("/new-count") || path.endsWith("/unread/count")) return fulfill(0);
    if (path === "/api/v1/public/moments/liked") return fulfill([...liked]);
    if (path === "/api/v1/public/moments/topics") return fulfill([]);
    if (path === "/api/v1/public/moments/cadence")
      return fulfill({
        zone: "UTC",
        day: { start: "2026-11-13T00:00:00Z", active: [6] },
        month: { start: "2026-11-01", days: 30, offset: 0, active: [12] },
        year: { year: 2026, active: [45] },
      });
    if (path === "/api/v1/public/moments") {
      timelineRequests.push(path);
      return fulfill(momentPage([100, 99]));
    }
    return route.fulfill({ status: 503, json: { message: "Unmocked API request" } });
  });
  await page.goto(path);
  if (path === "/moments") await showFixtureFeed(page);
  if (!guest)
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toHaveCount(0);
  return { liked, writes, savedIds, savedRequests, timelineRequests };
}

test("uses controlled native buttons, locks only the pending like, and preserves feed state", async ({
  page,
}) => {
  const { writes } = await prepare(page);
  const response = Promise.withResolvers<void>();
  let attempts = 0;
  await page.route("**/api/v1/public/moments/100/like", async (route) => {
    attempts += 1;
    await response.promise;
    await route.fulfill({ json: envelope(null) });
  });
  try {
    const card = page.locator("#moment-100");
    const contentNode = await card.locator('[data-slot="moment-content"]').elementHandle();
    const like = card.getByRole("button", { name: "Like moment, 8", exact: true });
    await expect(like).toHaveClass(/button--sm/);
    await like.click();
    const pending = card.getByRole("button", { name: "Unlike moment, 9", exact: true });
    await expect(pending).toHaveAttribute("aria-pressed", "true");
    await expect(pending).toHaveAttribute("data-pending", "true");
    await expect(pending).toBeDisabled();
    await expect(pending).toHaveAttribute("data-running", "");
    await pending.press("Enter");
    await expect(pending).toHaveClass(/button--danger-soft/);
    const save = card.getByRole("button", { name: "Save moment", exact: true });
    await expect(save).toBeEnabled();
    await save.click();
    const saved = card.getByRole("button", { name: "Remove from saved", exact: true });
    await expect(saved).toHaveClass(/button--secondary/);
    expect(attempts).toBe(1);
    response.resolve();
    await expect(pending).toBeEnabled();
    await expect(pending).not.toHaveAttribute("data-running");
    await expect(pending).toHaveText("9");
    const grid = page.getByRole("radio", { name: "Grid", exact: true });
    await grid.click();
    await expect(pending).toHaveAttribute("aria-pressed", "true");
    await expect(saved).toHaveAttribute("aria-pressed", "true");
    expect(await contentNode?.evaluate((node) => node.isConnected)).toBe(true);
    expect(writes).toEqual([]);
  } finally {
    response.resolve();
  }
});

test("cancels the pulse on failed likes and restores liked state after failed unlikes", async ({
  page,
}) => {
  await prepare(page);
  const response = Promise.withResolvers<void>();
  let fail = true;
  await page.route("**/api/v1/public/moments/100/like", async (route) => {
    if (fail) {
      await response.promise;
      return route.fulfill({ status: 503, json: { message: "Offline" } });
    }
    return route.fulfill({ json: envelope(null) });
  });
  try {
    const card = page.locator("#moment-100");
    const like = card.getByRole("button", { name: "Like moment, 8", exact: true });
    await like.click();
    response.resolve();
    await expect(like).toBeEnabled();
    await expect(like).toHaveAttribute("data-selected", "false");
    await expect(like).not.toHaveAttribute("data-running");
    await expect(like).toHaveText("8");
    fail = false;
    await like.press("Enter");
    const unlike = card.getByRole("button", { name: "Unlike moment, 9", exact: true });
    await expect(unlike).toBeEnabled();
    fail = true;
    await unlike.press("Enter");
    await expect(unlike).toBeEnabled();
    await expect(unlike).toHaveAttribute("aria-pressed", "true");
    await expect(unlike).toHaveText("9");
  } finally {
    response.resolve();
  }
});

test("guest actions only open login without mutating counts or storage", async ({ page }) => {
  const { writes, savedRequests } = await prepare(page, { guest: true });
  const card = page.locator("#moment-100");
  for (const label of ["Like moment, 8", "Save moment"]) {
    const button = card.getByRole("button", { name: label, exact: true });
    await button.click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Log In" })).toBeVisible();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(button).not.toHaveAttribute("data-running");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  expect(writes).toEqual([]);
  expect(savedRequests).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem("moments_bookmarks:reader"))).toBeNull();
});

test("persists bookmarks and hydrates both reactions without replaying feedback", async ({
  page,
}) => {
  const { savedIds } = await prepare(page, { reduced: true });
  const card = page.locator("#moment-100");
  await card.getByRole("button", { name: "Like moment, 8", exact: true }).press("Enter");
  await expect(card.getByRole("button", { name: "Unlike moment, 9", exact: true })).toBeEnabled();
  const save = card.getByRole("button", { name: "Save moment", exact: true });
  await expect(save).toBeEnabled();
  await save.press("Space");
  await expect.poll(savedIds).toEqual([100]);
  await expect(card.getByRole("button", { name: "Remove from saved", exact: true })).toBeEnabled();
  await page.reload();
  await showFixtureFeed(page);
  for (const label of ["Unlike moment, 9", "Remove from saved"]) {
    const button = card.getByRole("button", { name: label, exact: true });
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).not.toHaveAttribute("data-running");
  }
  const remove = card.getByRole("button", { name: "Remove from saved", exact: true });
  await expect(remove).toBeEnabled();
  await remove.press("Enter");
  await expect.poll(savedIds).toEqual([]);
});

test("handles zero counts and interrupts bookmark feedback on a rapid reversal", async ({
  page,
}) => {
  const { savedIds } = await prepare(page);
  const card = page.locator("#moment-99");
  const like = card.getByRole("button", { name: "Like moment", exact: true });
  await expect(like).toHaveClass(/button--icon-only/);
  await like.press("Enter");
  const unlike = card.getByRole("button", { name: "Unlike moment, 1", exact: true });
  await expect(unlike).toBeEnabled();
  await expect(unlike).not.toHaveClass(/button--icon-only/);
  await unlike.press("Enter");
  await expect(like).toBeEnabled();
  await expect(like).toHaveClass(/button--icon-only/);

  await card.getByRole("button", { name: "Save moment", exact: true }).click();
  const saved = card.getByRole("button", { name: "Remove from saved", exact: true });
  await expect(saved).toHaveAttribute("data-running", "");
  // Once the write completes, keyboard reversal can interrupt the pointer pulse.
  await expect(saved).toBeEnabled();
  await saved.press("Enter");
  const save = card.getByRole("button", { name: "Save moment", exact: true });
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await expect(save).not.toHaveAttribute("data-running");
  await expect(save).toHaveClass(/button--ghost/);
  await expect.poll(savedIds).toEqual([]);
});

test("retries legacy import and syncs the account across fresh browser contexts", async ({
  page,
  browser,
  baseURL,
}) => {
  const accounts: BookmarkAccounts = new Map();
  const path = "/moments/saved";
  const { savedIds, savedRequests, timelineRequests } = await prepare(page, {
    accounts,
    path,
    legacyIds: [100],
    failImport: true,
  });
  const legacy = () => page.evaluate(() => localStorage.getItem("moments_bookmarks:reader"));
  await expect(
    page.getByText("Saved moments could not be synced. Please try again.")
  ).toBeVisible();
  expect(await legacy()).toBe("[100]");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("Reaction test moment 100", { exact: true })).toBeVisible();
  await expect.poll(legacy).toBeNull();
  expect(savedRequests.filter((request) => request === `POST ${savedPath}/import`)).toHaveLength(2);
  expect(timelineRequests).toEqual([]);

  const secondDevice = await browser.newPage({ baseURL, locale: "en-US" });
  const otherAccount = await browser.newPage({ baseURL, locale: "en-US" });
  try {
    await prepare(secondDevice, { accounts, path });
    await expect(secondDevice.getByText("Reaction test moment 100", { exact: true })).toBeVisible();
    expect(
      await secondDevice.evaluate(() => localStorage.getItem("moments_bookmarks:reader"))
    ).toBeNull();
    await prepare(otherAccount, { accounts, path, username: "other" });
    await expect(otherAccount.getByText("No saved moments yet")).toBeVisible();

    await secondDevice.getByRole("button", { name: "Remove from saved", exact: true }).click();
    await expect(secondDevice.getByText("No saved moments yet")).toBeVisible();
    await expect.poll(savedIds).toEqual([]);
    await page.reload();
    // Reload seeds the old browser list again, simulating a second legacy import after removal.
    await expect(page.getByText("No saved moments yet")).toBeVisible();
    await expect.poll(legacy).toBeNull();
  } finally {
    await secondDevice.close();
    await otherAccount.close();
  }
});

test("reverts a failed bookmark write while keeping the card interactive", async ({ page }) => {
  const { savedIds } = await prepare(page);
  await page.route(`**${savedPath}/100`, (route) =>
    route.fulfill({ status: 503, json: { message: "Temporary write failure" } })
  );
  const card = page.locator("#moment-100");
  const save = card.getByRole("button", { name: "Save moment", exact: true });
  await save.click();
  await expect(
    page.getByText("The bookmark could not be updated. Please try again.")
  ).toBeVisible();
  await expect(save).toBeEnabled();
  await expect(save).toHaveAttribute("aria-pressed", "false");
  expect(savedIds()).toEqual([]);
  await page.unroute(`**${savedPath}/100`);
  await save.click();
  await expect.poll(savedIds).toEqual([100]);
});

for (const width of [360, 768, 1440]) {
  test(`keeps native dimensions and aligned contents at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await prepare(page, { reduced: true });
    const card = page.locator("#moment-100");
    const like = card.getByRole("button", { name: "Like moment, 8", exact: true });
    const save = card.getByRole("button", { name: "Save moment", exact: true });
    const comment = card.getByRole("button", { name: "Open 0 comments", exact: true });
    await expect(like.locator("svg")).toBeVisible();
    const height = width >= 768 ? 32 : 36;
    await expect(like).toHaveCSS("height", `${height}px`);
    await expect(save).toHaveCSS("height", `${height}px`);
    await expect(save).toHaveCSS("width", `${height}px`);
    const ghostForeground = await comment.evaluate((button) => getComputedStyle(button).color);
    for (const button of [like, comment, save]) {
      const icon = button.locator("svg");
      await expect(icon).toBeVisible();
      await expect(icon).toHaveCSS("width", "16px");
      await expect(icon).toHaveCSS("height", "16px");
      await expect(icon).toHaveCSS("color", ghostForeground);
      await expect(icon).toHaveCSS("margin", "0px");
      const buttonBounds = await button.boundingBox();
      const iconBounds = await icon.boundingBox();
      expect(
        Math.abs(
          iconBounds!.y + iconBounds!.height / 2 - buttonBounds!.y - buttonBounds!.height / 2
        )
      ).toBeLessThan(1);
    }
    await expect(like.locator("span[aria-hidden=true]").nth(1)).toHaveCSS("font-size", "14px");
    const bounds = await like.boundingBox();
    const savedBounds = await save.boundingBox();
    expect(bounds!.x + bounds!.width).toBeLessThan(savedBounds!.x);
    expect(Math.abs(bounds!.y - savedBounds!.y)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width
    );
    await like.press("Enter");
    await expect(save).toBeEnabled();
    await save.press("Enter");
    const selectedColors: string[] = [];
    for (const button of [
      card.getByRole("button", { name: "Unlike moment, 9", exact: true }),
      card.getByRole("button", { name: "Remove from saved", exact: true }),
    ]) {
      const color = await button.locator("svg").evaluate((icon) => getComputedStyle(icon).color);
      expect(color).not.toBe(ghostForeground);
      selectedColors.push(color);
    }
    expect(selectedColors[0]).not.toBe(selectedColors[1]);
    await expect(
      card.getByRole("button", { name: "Unlike moment, 9", exact: true })
    ).not.toHaveAttribute("data-running");
    await page.screenshot({
      path: testInfo.outputPath(`moment-reactions-${width}.png`),
      fullPage: true,
    });
  });
}
