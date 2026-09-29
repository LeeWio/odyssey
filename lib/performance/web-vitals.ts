export type WebVitalName = "LCP" | "CLS" | "INP" | "TTFB" | "FCP";

export interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  id: string;
  navigationType: string;
  path: string;
}

export function createMetricPayload(
  metric: Pick<WebVitalMetric, "name" | "value" | "id">,
  location: Pick<Location, "pathname"> = window.location,
  navigationType = getNavigationType()
): WebVitalMetric {
  return {
    ...metric,
    navigationType,
    path: location.pathname,
  };
}

export function getNavigationType(): string {
  if (typeof performance === "undefined") return "unknown";
  const entry = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  return entry?.type || "unknown";
}

export function getNavigationTimingValue(
  metric: "TTFB",
  entry: Pick<PerformanceNavigationTiming, "responseStart" | "startTime">
): number {
  if (metric !== "TTFB") return 0;
  return Math.max(0, entry.responseStart - entry.startTime);
}

export function reportMetric(endpoint: string, metric: WebVitalMetric): void {
  if (typeof window === "undefined" || !endpoint) return;

  const body = JSON.stringify(metric);
  try {
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    // Fall through to keepalive fetch when Beacon is unavailable or rejected.
  }

  void fetch(endpoint, {
    body,
    credentials: "omit",
    headers: { "content-type": "application/json" },
    keepalive: true,
    method: "POST",
  }).catch(() => undefined);
}
