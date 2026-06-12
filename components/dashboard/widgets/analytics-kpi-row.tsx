"use client";

import { useMemo } from "react";
import { Skeleton } from "@heroui/react";
import { KPI } from "@heroui-pro/react";

import { useGetTrafficAnalyticsQuery } from "@/lib/features/dashboard/dashboard-api";
import {
  BOUNCE_SPARKLINE,
  DURATION_SPARKLINE,
} from "../data/analytics";

export function AnalyticsKpiRow() {
  const { data, isLoading } = useGetTrafficAnalyticsQuery();

  const sessionsSparkline = useMemo(() => {
    return data?.timeSeries?.map(p => ({ value: p.sessions })) ?? [];
  }, [data]);

  const usersSparkline = useMemo(() => {
    return data?.timeSeries?.map(p => ({ value: p.users })) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Sessions */}
      <KPI>
        <KPI.Header>
          <KPI.Title>Sessions</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value maximumFractionDigits={0} value={summary?.sessions.numericValue ?? 0} />
          <KPI.Trend trend={summary?.sessions.growthRate! >= 0 ? "up" : "down"}>
            {Math.abs(summary?.sessions.growthRate ?? 0).toFixed(1)}%
          </KPI.Trend>
        </KPI.Content>
        <KPI.Chart
          color="var(--color-accent)"
          data={sessionsSparkline}
          height={60}
          strokeWidth={1.5}
        />
      </KPI>

      {/* Unique Users */}
      <KPI>
        <KPI.Header>
          <KPI.Title>Unique users</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value maximumFractionDigits={0} value={summary?.users.numericValue ?? 0} />
          <KPI.Trend trend={summary?.users.growthRate! >= 0 ? "up" : "down"}>
            {Math.abs(summary?.users.growthRate ?? 0).toFixed(1)}%
          </KPI.Trend>
        </KPI.Content>
        <KPI.Chart
          color="var(--color-success)"
          data={usersSparkline}
          height={60}
          strokeWidth={1.5}
        />
      </KPI>

      {/* Bounce Rate */}
      <KPI>
        <KPI.Header>
          <KPI.Title>Bounce rate</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value 
            maximumFractionDigits={1} 
            style="percent" 
            value={(summary?.bounceRate.numericValue ?? 0) / 100} 
          />
          <KPI.Trend trend="neutral">
            {summary?.bounceRate.growthRate! >= 0 ? "+" : "−"}
            {Math.abs(summary?.bounceRate.growthRate ?? 0).toFixed(1)}%
          </KPI.Trend>
        </KPI.Content>
        <KPI.Chart
          color="var(--color-muted)"
          data={[...BOUNCE_SPARKLINE]}
          height={60}
          strokeWidth={1.5}
        />
      </KPI>

      {/* Avg Session */}
      <KPI>
        <KPI.Header>
          <KPI.Title>Avg. session</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <span className="text-foreground text-2xl font-semibold tabular-nums">
            {summary?.avgSession.value}
          </span>
          <KPI.Trend trend={summary?.avgSession.growthRate! >= 0 ? "up" : "down"}>
            {Math.abs(summary?.avgSession.growthRate ?? 0).toFixed(1)}%
          </KPI.Trend>
        </KPI.Content>
        <KPI.Chart
          color="var(--color-warning)"
          data={[...DURATION_SPARKLINE]}
          height={60}
          strokeWidth={1.5}
        />
      </KPI>
    </div>
  );
}
