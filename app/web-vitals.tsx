"use client";

import { useReportWebVitals } from "next/web-vitals";
import { useCallback } from "react";

import { createMetricPayload, getDocumentPath, reportMetric } from "@/lib/performance/web-vitals";

type ReportWebVitals = Parameters<typeof useReportWebVitals>[0];

export default function WebVitals({ endpoint, revision }: { endpoint: string; revision: string }) {
  const onMetric = useCallback<ReportWebVitals>(
    (metric) => {
      const payload = createMetricPayload(metric, getDocumentPath(), revision);
      if (payload) reportMetric(endpoint, payload);
    },
    [endpoint, revision]
  );
  useReportWebVitals(onMetric);

  return null;
}
