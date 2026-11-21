import { expect, test } from "@playwright/test";

test("reports a browser performance metric through the configured endpoint", async ({ page }) => {
  await page.route("**/__test/web-vitals", (route) => route.fulfill({ status: 204 }));

  const metricRequest = page.waitForRequest(
    (request) => request.url().endsWith("/__test/web-vitals") && request.method() === "POST",
    { timeout: 15_000 }
  );

  await page.goto("/single/entrance-regression?private=query");
  const request = await metricRequest;
  const payload = JSON.parse(request.postData() || "{}") as {
    id?: string;
    name?: string;
    navigationType?: string;
    path?: string;
    revision?: string;
    value?: number;
  };

  expect(payload.name).toMatch(/^(FCP|LCP|CLS|INP|TTFB)$/);
  expect(payload.id).toMatch(/^v\d+-/);
  expect(payload.path).toBe("/single/[slug]");
  expect(payload.revision).toBe("development");
  expect(payload.navigationType).toBe("navigate");
  expect(payload.value).toEqual(expect.any(Number));
  expect(payload.value).toBeGreaterThanOrEqual(0);
});
