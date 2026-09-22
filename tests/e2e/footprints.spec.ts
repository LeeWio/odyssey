import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

async function prepare(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({ status: 503, json: { message: "Unavailable" } })
  );
  await page.route(
    "https://cdn.jsdelivr.net/npm/maplibre-gl@*/dist/maplibre-gl-worker.mjs",
    (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: readFileSync(resolve("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs")),
      })
  );
  await page.route("https://tiles.openfreemap.org/styles/**", (route) =>
    route.fulfill({
      json: {
        version: 8,
        sources: {},
        layers: [
          { id: "background", type: "background", paint: { "background-color": "#e2e7e8" } },
        ],
      },
    })
  );
  await page.route("https://tiles.openfreemap.org/natural_earth/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      // 1x1 transparent PNG
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      ),
    })
  );
}

for (const width of [390, 1440]) {
  test(`home footprints map renders at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await prepare(page);
    await page.goto("/");
    const section = page.locator("#footprints-showcase");
    const map = section.locator('[data-slot="map"]');
    await section.scrollIntoViewIfNeeded();
    await expect(map).toHaveAttribute("data-loaded", "true");
    await expect(section.getByRole("heading", { name: "Places I've Been" })).toBeVisible();
    await expect(
      section.getByText(
        "A record of provinces and cities across China. The stops that stayed on the map."
      )
    ).toBeVisible();
    await expect(section.getByText("Footprints", { exact: true }).first()).toBeVisible();
    await expect(section.getByRole("link", { name: "Open the atlas" })).toBeVisible();
    await expect(section.getByRole("link", { name: "Open the atlas" })).toHaveCount(1);
    await expect(section.getByTestId("footprints-map-frame").getByText("Hubei")).toBeVisible();
    const overlay = section.locator(".bg-overlay");
    await expect(overlay.getByText("Places kept on the map")).toBeVisible();
    await expect(overlay.getByText("Latest")).toBeVisible();
    await expect(overlay.getByText("Plains this year")).toBeVisible();
    await expect(overlay.getByText("Henan · 2026")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });
}

test("timeline, popup and year selection stay in sync", async ({ page }) => {
  await prepare(page);
  await page.goto("/footprints");
  await expect(page.locator('[data-slot="map"]')).toHaveAttribute("data-loaded", "true", {
    timeout: 30_000,
  });
  const entry = page.getByRole("button", { name: "Read memory from Shenzhen" });
  await entry.click();
  await expect(entry).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Selected travel memory")).toContainText("Shenzhen");
  const popup = page.locator('[data-slot="map-popup"]');
  await expect(popup).toContainText("A city rewriting itself");
  await expect(popup).toContainText("Shenzhen");
  await expect(popup).toContainText(
    "Glass, pace, and a skyline that keeps changing between visits."
  );
  await page.getByRole("button", { name: "Close popup" }).click();
  await expect(page.locator('[data-slot="map-popup"]')).toHaveCount(0);
  await expect(entry).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Selected travel memory")).toContainText("A city rewriting itself");
  await page.getByRole("tab", { name: "2024", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Read memory from/ })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Read memory from Chongqing" })).toBeVisible();
  await page.getByRole("tab", { name: "All years", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Read memory from/ })).toHaveCount(7);
});
