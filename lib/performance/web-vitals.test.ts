import { afterEach, describe, expect, it, vi } from "vitest";

import { createMetricPayload, getDocumentPath, reportMetric } from "./web-vitals";

const metric = { id: "v4-42", name: "LCP", value: 42, navigationType: "reload" };

afterEach(() => vi.unstubAllGlobals());

describe("web vitals helpers", () => {
  it("reports only the public route group and build revision", () => {
    expect(createMetricPayload(metric, "/single/example", "commit-sha")).toEqual({
      ...metric,
      path: "/single/[slug]",
      revision: "commit-sha",
    });
    expect(createMetricPayload(metric, "/moments/saved", "commit-sha")).toBeNull();
    expect(createMetricPayload({ ...metric, name: "FID" }, "/", "commit-sha")).toBeNull();
    expect(createMetricPayload({ ...metric, value: NaN }, "/", "commit-sha")).toBeNull();
  });

  it("attributes a document metric to the initial navigation, not the current SPA path", () => {
    vi.stubGlobal("performance", {
      getEntriesByType: () => [{ name: "https://example.com/single/example?q=private#section" }],
    });
    vi.stubGlobal("window", { location: { pathname: "/" } });

    expect(getDocumentPath()).toBe("/single/example");
  });

  it("sends a keepalive request without credentials or referrer", () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("fetch", submit);
    const payload = { ...metric, name: "LCP", path: "/", revision: "commit-sha" } as const;

    reportMetric("/metrics", payload);

    expect(submit).toHaveBeenCalledWith("/metrics", {
      body: JSON.stringify(payload),
      credentials: "omit",
      headers: { "content-type": "application/json" },
      keepalive: true,
      method: "POST",
      referrerPolicy: "no-referrer",
    });
  });
});
