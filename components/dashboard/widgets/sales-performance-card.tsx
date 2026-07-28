"use client";

import { Card, Skeleton } from "@heroui/react";
import { AreaChart, NumberValue, TrendChip } from "@heroui-pro/react";
import { useGetAnalyticsOverviewQuery } from "@/lib/features/dashboard/dashboard-api";
import { useMemo } from "react";

export function SalesPerformanceCard() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

  const chartData = useMemo(() => {
    return (
      data?.dailyTrends?.map((d) => ({
        date: d.date,
        pv: d.pv,
        uv: d.uv,
      })) ?? []
    );
  }, [data]);

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Traffic Trends (PV/UV)</Card.Title>
        <TrendChip
          className="bg-transparent"
          trend={(data?.pvGrowthRate ?? 0) >= 0 ? "up" : "down"}
        >
          {Math.abs(data?.pvGrowthRate ?? 0).toFixed(1)}%
        </TrendChip>
      </Card.Header>
      <Card.Content className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          <div className="flex flex-col">
            {isLoading ? (
              <Skeleton className="h-7 w-20 rounded-md" />
            ) : (
              <NumberValue
                className="text-foreground text-xl font-bold tabular-nums"
                value={data?.todayPv ?? 0}
              />
            )}
            <span className="text-muted text-xs font-medium">Today PV</span>
          </div>
          <div className="flex flex-col">
            {isLoading ? (
              <Skeleton className="h-7 w-20 rounded-md" />
            ) : (
              <NumberValue
                className="text-foreground text-xl font-bold tabular-nums"
                value={data?.todayUv ?? 0}
              />
            )}
            <span className="text-muted text-xs font-medium">Today UV</span>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-[180px] w-full rounded-2xl" />
        ) : (
          <AreaChart data={chartData} height={180}>
            <AreaChart.Grid vertical={false} />
            <AreaChart.XAxis dataKey="date" tickMargin={8} />
            <AreaChart.YAxis width={30} />
            <AreaChart.Area
              dataKey="pv"
              name="Page Views"
              stroke="var(--color-accent)"
              fill="var(--color-accent-soft)"
            />
            <AreaChart.Area
              dataKey="uv"
              name="Unique Visitors"
              stroke="var(--color-success)"
              fill="var(--color-success-soft)"
            />
            <AreaChart.Tooltip content={<AreaChart.TooltipContent />} />
          </AreaChart>
        )}
      </Card.Content>
    </Card>
  );
}
