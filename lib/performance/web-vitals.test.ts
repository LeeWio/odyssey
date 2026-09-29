import { describe, expect, it, vi } from "vitest";

import {
  createMetricPayload,
  getNavigationTimingValue,
  getNavigationType,
  reportMetric,
} from "./web-vitals";

describe("web vitals helpers", () => {
  it("creates a stable payload for the current route", () => {
    expect(
      createMetricPayload(
        { id: "lcp-42", name: "LCP", value: 42 },
        { pathname: "/single/example" } as Location,
        "reload"
      )
    ).toEqual({
      id: "lcp-42",
      name: "LCP",
      navigationType: "reload",
      path: "/single/example",
      value: 42,
    });
  });

  it("uses Beacon when available", () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });
    reportMetric("/metrics", {
      id: "cls-1",
      name: "CLS",
      navigationType: "navigate",
      path: "/single",
      value: 0.12,
    });
    expect(sendBeacon).toHaveBeenCalledOnce();
  });

  it("returns unknown when navigation timing is unavailable", () => {
    vi.stubGlobal("performance", { getEntriesByType: () => [] });
    expect(getNavigationType()).toBe("unknown");
  });

  it("calculates TTFB relative to navigation start", () => {
    expect(getNavigationTimingValue("TTFB", { responseStart: 180, startTime: 20 })).toBe(160);
    expect(getNavigationTimingValue("TTFB", { responseStart: 10, startTime: 20 })).toBe(0);
  });
});
