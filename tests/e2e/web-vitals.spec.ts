import { expect, test } from "@playwright/test";

test("reports a browser performance metric through the configured endpoint", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: undefined,
    });
  });

  const metricRequest = page.waitForRequest(
    (request) => request.url().endsWith("/__test/web-vitals") && request.method() === "POST",
    { timeout: 15_000 }
  );

  await page.goto("/test/rich-text", { waitUntil: "networkidle" });
  const request = await metricRequest;
  const payload = JSON.parse(request.postData() || "{}") as {
    id?: string;
    name?: string;
    navigationType?: string;
    path?: string;
    value?: number;
  };

  expect(payload.name).toMatch(/^(FCP|LCP|CLS|INP|TTFB)$/);
  expect(payload.id).toMatch(new RegExp(`^${payload.name}-`));
  expect(payload.path).toBe("/test/rich-text");
  expect(payload.navigationType).toMatch(/^(navigate|reload|back_forward|prerender|unknown)$/);
  expect(payload.value).toEqual(expect.any(Number));
  expect(payload.value).toBeGreaterThanOrEqual(0);
});
