"use client";

import { useEffect } from "react";

import {
  createMetricPayload,
  getNavigationTimingValue,
  reportMetric,
  type WebVitalMetric,
  type WebVitalName,
} from "@/lib/performance/web-vitals";

const endpoint = process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT;

function observePaint(
  name: WebVitalName,
  onMetric: (metric: WebVitalMetric) => void,
  onObserver: (observer: PerformanceObserver) => void
) {
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
    onObserver(observer);
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
    const flushed = new Set<string>();

    const observe = (
      type: string,
      name: WebVitalName,
      value: (entry: PerformanceEntry) => number
    ) => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const entryValue = value(entry);
            if (name === "CLS" && entryValue === 0) continue;
            const previousValue = latest.get(name) ?? 0;
            const nextValue =
              name === "CLS" ? previousValue + entryValue : Math.max(previousValue, entryValue);
            if (nextValue === previousValue) continue;
            latest.set(name, nextValue);
            flushed.delete(name);
            const id = `${name}-${Math.round(entry.startTime)}`;
            report(createMetricPayload({ id, name, value: nextValue }));
          }
        });
        const options =
          type === "event"
            ? ({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit)
            : ({
                type: type as "largest-contentful-paint",
                buffered: true,
              } as PerformanceObserverInit);
        observer.observe(options);
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
    observe("navigation", "TTFB", (entry) =>
      getNavigationTimingValue("TTFB", entry as PerformanceNavigationTiming)
    );
    observePaint("FCP", report, (observer) => observers.push(observer));

    const flush = () => {
      for (const [name, value] of latest) {
        if (flushed.has(name)) continue;
        flushed.add(name);
        report(
          createMetricPayload({
            id: `${name}-final`,
            name: name as WebVitalName,
            value,
          })
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", flush);

    return () => {
      observers.forEach((observer) => observer.disconnect());
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}
