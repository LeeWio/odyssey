"use client";

import type { ComponentProps } from "react";

import { KPI } from "@heroui-pro/react/kpi";
import { useMemo } from "react";
import { useGetTrafficAnalyticsQuery } from "@/lib/features/dashboard";

type TrendDir = ComponentProps<typeof KPI.Trend>["trend"];

/**
 * Seconds → human-friendly "3m 42s" helper used below.
 * Hoisted so it's a module-level pure function (`js-cache-function-results`).
 */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function trendOf(value: number): TrendDir {
  return value >= 0 ? "up" : "down";
}

function formatTrend(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`;
}

export function AnalyticsKpiRow() {
  const { data } = useGetTrafficAnalyticsQuery(30);
  const summary = data?.summary;
  const sessions = useMemo(
    () => data?.timeSeries.map((point) => ({ value: point.sessions })) ?? [],
    [data]
  );
  const users = useMemo(
    () => data?.timeSeries.map((point) => ({ value: point.users })) ?? [],
    [data]
  );
  const analyticsKpis = [
    {
      chartColor: "var(--color-accent)",
      chartData: sessions,
      label: "Sessions",
      numberProps: { maximumFractionDigits: 0, value: summary?.sessions.numericValue ?? 0 },
      trend: trendOf(summary?.sessions.growthRate ?? 0),
      trendValue: formatTrend(summary?.sessions.growthRate ?? 0),
    },
    {
      chartColor: "var(--color-success)",
      chartData: users,
      label: "Unique users",
      numberProps: { maximumFractionDigits: 0, value: summary?.users.numericValue ?? 0 },
      trend: trendOf(summary?.users.growthRate ?? 0),
      trendValue: formatTrend(summary?.users.growthRate ?? 0),
    },
    {
      chartColor: "var(--color-muted)",
      chartData: sessions,
      label: "Bounce rate",
      numberProps: {
        maximumFractionDigits: 1,
        style: "percent" as const,
        value: (summary?.bounceRate.numericValue ?? 0) / 100,
      },
      trend: "neutral" as const,
      trendValue: formatTrend(summary?.bounceRate.growthRate ?? 0),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {analyticsKpis.map((kpi) => (
        <KPI key={kpi.label}>
          <KPI.Header>
            <KPI.Title>{kpi.label}</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value {...kpi.numberProps} />
            <KPI.Trend trend={kpi.trend}>{kpi.trendValue}</KPI.Trend>
          </KPI.Content>
          <KPI.Chart
            color={kpi.chartColor}
            data={[...kpi.chartData]}
            height={60}
            strokeWidth={1.5}
          />
        </KPI>
      ))}
      <DurationKpi />
    </div>
  );
}

/**
 * Duration KPI is split out because it formats its value with a custom
 * render prop (minutes + seconds), which `KPI.Value` doesn't express
 * cleanly as a plain number.
 */
function DurationKpi() {
  const { data } = useGetTrafficAnalyticsQuery(30);
  const avgSeconds = data?.summary.avgSession.numericValue ?? 0;
  const growth = data?.summary.avgSession.growthRate ?? 0;
  const sparkline = data?.timeSeries.map((point) => ({ value: point.sessions })) ?? [];

  return (
    <KPI>
      <KPI.Header>
        <KPI.Title>Avg. session</KPI.Title>
      </KPI.Header>
      <KPI.Content>
        <span className="text-foreground text-2xl font-semibold tabular-nums">
          {formatDuration(avgSeconds)}
        </span>
        <KPI.Trend trend={growth >= 0 ? "up" : "down"}>{formatTrend(growth)}</KPI.Trend>
      </KPI.Content>
      <KPI.Chart color="var(--color-warning)" data={sparkline} height={60} strokeWidth={1.5} />
    </KPI>
  );
}
