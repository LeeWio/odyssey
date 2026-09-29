"use client";

import { useEffect } from "react";

import {
  createMetricPayload,
  reportMetric,
  type WebVitalMetric,
  type WebVitalName,
} from "@/lib/performance/web-vitals";

const endpoint = process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT;

function observePaint(name: WebVitalName, onMetric: (metric: WebVitalMetric) => void) {
  if (typeof PerformanceObserver === "undefined") return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entry = list
        .getEntries()
        .find((candidate) => candidate.name === "first-contentful-paint");
      if (!entry) return;
      onMetric(
        createMetricPayload({
          id: `${name}-${Math.round(entry.startTime)}`,
          name,
          value: entry.startTime,
        })
      );
    });
    observer.observe({ type: "paint", buffered: true });
  } catch {
    // Older browsers may not support the PerformanceObserver options above.
  }
}

export default function WebVitals() {
  useEffect(() => {
    if (!endpoint || typeof PerformanceObserver === "undefined") return;

    const report = (metric: WebVitalMetric) => reportMetric(endpoint, metric);
    const observers: PerformanceObserver[] = [];
    const latest = new Map<string, number>();

    const observe = (
      type: string,
      name: WebVitalName,
      value: (entry: PerformanceEntry) => number
    ) => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entry = list.getEntries().at(-1);
          if (!entry) return;
          const nextValue = value(entry);
          if (name === "CLS" && nextValue === 0) return;
          if (latest.get(name) === nextValue) return;
          latest.set(name, nextValue);
          report(
            createMetricPayload({
              id: `${name}-${Math.round(entry.startTime)}`,
              name,
              value: nextValue,
            })
          );
        });
        observer.observe({ type, buffered: true });
        observers.push(observer);
      } catch {
        // Metric types are progressively enhanced by the browser.
      }
    };

    observe("largest-contentful-paint", "LCP", (entry) => entry.startTime);
    observe("event", "INP", (entry) => (entry as PerformanceEventTiming).duration);
    observe(
      "layout-shift",
      "CLS",
      (entry) => (entry as PerformanceEntry & { value?: number }).value ?? 0
    );
    observe("navigation", "TTFB", (entry) => (entry as PerformanceNavigationTiming).responseStart);
    observePaint("FCP", report);

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  return null;
}
