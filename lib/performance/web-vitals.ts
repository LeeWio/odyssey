const METRIC_NAMES = ["LCP", "CLS", "INP", "TTFB", "FCP"] as const;
type WebVitalName = (typeof METRIC_NAMES)[number];

interface BrowserMetric {
  name: string;
  value: number;
  id: string;
  navigationType: string;
}

export interface WebVitalMetric extends BrowserMetric {
  name: WebVitalName;
  path: string;
  revision: string;
}

function groupPublicPath(path: string) {
  if (["/", "/single", "/moments", "/chronicle"].includes(path)) return path;
  if (["/single/categories", "/single/tags", "/single/authors"].includes(path)) return path;
  if (/^\/single\/[^/]+$/.test(path)) return "/single/[slug]";
  return null;
}

export function getDocumentPath() {
  const navigation = performance.getEntriesByType("navigation")[0];
  return navigation ? new URL(navigation.name).pathname : window.location.pathname;
}

export function createMetricPayload(
  metric: BrowserMetric,
  pathname: string,
  revision: string
): WebVitalMetric | null {
  const name = METRIC_NAMES.find((metricName) => metricName === metric.name);
  const path = groupPublicPath(pathname);
  if (!name || !path || !Number.isFinite(metric.value) || metric.value < 0) return null;

  return {
    id: metric.id,
    name,
    value: metric.value,
    navigationType: metric.navigationType,
    path,
    revision,
  };
}

export function reportMetric(endpoint: string, metric: WebVitalMetric): void {
  void fetch(endpoint, {
    body: JSON.stringify(metric),
    credentials: "omit",
    headers: { "content-type": "application/json" },
    keepalive: true,
    method: "POST",
    referrerPolicy: "no-referrer",
  }).catch(() => undefined);
}
