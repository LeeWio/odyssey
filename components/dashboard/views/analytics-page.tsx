"use client";

import { Segment } from "@heroui-pro/react";
import { useMemo, useState } from "react";

import { AnalyticsKpiRow } from "../widgets/analytics-kpi-row";
import { DeviceBreakdownCard } from "../widgets/device-breakdown-card";
import { SessionsOverTimeCard } from "../widgets/sessions-over-time-card";
import { TopChannelsCard } from "../widgets/top-channels-card";
import { TopPagesCard } from "../widgets/top-pages-card";

const TIME_RANGES = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "12M", value: 365 },
] as const;

export function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState<string>("30D");

  const days = useMemo(() => {
    const range = TIME_RANGES.find((r) => r.label === selectedRange);
    return range?.value ?? 30;
  }, [selectedRange]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-sm">Explore how your product is performing.</p>
        <Segment
          aria-label="Time range"
          selectedKey={selectedRange}
          onSelectionChange={(key) => setSelectedRange(key as string)}
          size="sm"
        >
          {TIME_RANGES.map((range) => (
            <Segment.Item key={range.label} id={range.label}>
              {range.label}
            </Segment.Item>
          ))}
        </Segment>
      </div>

      <AnalyticsKpiRow days={days} />

      <SessionsOverTimeCard days={days} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DeviceBreakdownCard days={days} />
        <TopChannelsCard days={days} />
      </div>

      <TopPagesCard days={days} />
    </div>
  );
}
