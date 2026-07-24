"use client";

import { Skeleton } from "@heroui/react";
import { KPI } from "@heroui-pro/react";
import { useMemo } from "react";

import { useGetTrafficAnalyticsQuery } from "@/lib/features/dashboard/dashboard-api";
import { BOUNCE_SPARKLINE, DURATION_SPARKLINE } from "../data/analytics";

export function AnalyticsKpiRow({ days }: { days?: number }) {
  const { data, isLoading } = useGetTrafficAnalyticsQuery(days);

  const sessionsSparkline = useMemo(() => {
    return data?.timeSeries?.map((p) => ({ value: p.sessions })) ?? [];
  }, [data]);

  const usersSparkline = useMemo(() => {
    return data?.timeSeries?.map((p) => ({ value: p.users })) ?? [];
  }, [data]);

  const summary = data?.summary;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Sessions */}
      <KPI>
        <KPI.Header>
          <KPI.Title>Sessions</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </>
          ) : (
            <>
              <KPI.Value maximumFractionDigits={0} value={summary?.sessions.numericValue ?? 0} />
              <KPI.Trend trend={(summary?.sessions.growthRate ?? 0) >= 0 ? "up" : "down"}>
                {Math.abs(summary?.sessions.growthRate ?? 0).toFixed(1)}%
              </KPI.Trend>
            </>
          )}
        </KPI.Content>
        {isLoading ? (
          <Skeleton className="mt-2 h-[60px] w-full rounded-xl" />
        ) : (
          <KPI.Chart
            color="var(--color-accent)"
            data={sessionsSparkline}
            height={60}
            strokeWidth={1.5}
          />
        )}
      </KPI>

      {/* Unique Users */}
      <KPI>
        <KPI.Header>
          <KPI.Title>Unique users</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </>
          ) : (
            <>
              <KPI.Value maximumFractionDigits={0} value={summary?.users.numericValue ?? 0} />
              <KPI.Trend trend={(summary?.users.growthRate ?? 0) >= 0 ? "up" : "down"}>
                {Math.abs(summary?.users.growthRate ?? 0).toFixed(1)}%
              </KPI.Trend>
            </>
          )}
        </KPI.Content>
        {isLoading ? (
          <Skeleton className="mt-2 h-[60px] w-full rounded-xl" />
        ) : (
          <KPI.Chart
            color="var(--color-success)"
            data={usersSparkline}
            height={60}
            strokeWidth={1.5}
          />
        )}
      </KPI>

      {/* Bounce Rate */}
      <KPI>
        <KPI.Header>
          <KPI.Title>Bounce rate</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </>
          ) : (
            <>
              <KPI.Value
                maximumFractionDigits={1}
                style="percent"
                value={(summary?.bounceRate.numericValue ?? 0) / 100}
              />
              <KPI.Trend trend="neutral">
                {(summary?.bounceRate.growthRate ?? 0) >= 0 ? "+" : "−"}
                {Math.abs(summary?.bounceRate.growthRate ?? 0).toFixed(1)}%
              </KPI.Trend>
            </>
          )}
        </KPI.Content>
        {isLoading ? (
          <Skeleton className="mt-2 h-[60px] w-full rounded-xl" />
        ) : (
          <KPI.Chart
            color="var(--color-muted)"
            data={[...BOUNCE_SPARKLINE]}
            height={60}
            strokeWidth={1.5}
          />
        )}
      </KPI>

      {/* Avg Session */}
      <KPI>
        <KPI.Header>
          <KPI.Title>Avg. session</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </>
          ) : (
            <>
              <span className="text-foreground text-2xl font-semibold tabular-nums">
                {summary?.avgSession.value}
              </span>
              <KPI.Trend trend={(summary?.avgSession.growthRate ?? 0) >= 0 ? "up" : "down"}>
                {Math.abs(summary?.avgSession.growthRate ?? 0).toFixed(1)}%
              </KPI.Trend>
            </>
          )}
        </KPI.Content>
        {isLoading ? (
          <Skeleton className="mt-2 h-[60px] w-full rounded-xl" />
        ) : (
          <KPI.Chart
            color="var(--color-warning)"
            data={[...DURATION_SPARKLINE]}
            height={60}
            strokeWidth={1.5}
          />
        )}
      </KPI>
    </div>
  );
}
