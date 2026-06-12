"use client";

import { useMemo } from "react";
import { Card, Skeleton } from "@heroui/react";
import { LineChart, NumberValue, TrendChip } from "@heroui-pro/react";

import { useGetTrafficAnalyticsQuery } from "@/lib/features/dashboard/dashboard-api";

function formatThousands(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  } catch (e) {
    return dateStr;
  }
}

export function SessionsOverTimeCard() {
  const { data, isLoading } = useGetTrafficAnalyticsQuery();

  const chartData = useMemo(() => {
    if (!data?.timeSeries) return [];

    return data.timeSeries.map((point) => ({
      day: formatDate(point.date),
      sessions: point.sessions,
      users: point.users,
    }));
  }, [data]);

  const totalSessions = data?.total ?? 0;
  const growthRate = data?.growthRate ?? 0;
  const trend = growthRate >= 0 ? ("up" as const) : ("down" as const);

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Card.Title className="text-base">Sessions over time</Card.Title>
          {isLoading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : (
            <div className="flex items-baseline gap-2">
              <NumberValue
                className="text-foreground text-2xl font-semibold tabular-nums"
                maximumFractionDigits={0}
                value={totalSessions}
              />
              <TrendChip trend={trend}>{Math.abs(growthRate).toFixed(1)}%</TrendChip>
            </div>
          )}
          <span className="text-muted text-xs">vs. previous period</span>
        </div>
        <div className="flex items-center gap-4">
          <LegendDot color="var(--chart-2)" label="Sessions" />
          <LegendDot color="var(--chart-4)" label="Users" />
        </div>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <Skeleton className="h-[240px] w-full rounded-xl" />
        ) : (
          <LineChart data={chartData} height={240}>
            <LineChart.Grid vertical={false} />
            <LineChart.XAxis dataKey="day" minTickGap={32} tickMargin={8} />
            <LineChart.YAxis tickFormatter={formatThousands} width={40} />
            <LineChart.Line
              dataKey="sessions"
              dot={false}
              name="Sessions"
              stroke="var(--chart-2)"
              strokeWidth={2}
              type="monotone"
            />
            <LineChart.Line
              dataKey="users"
              dot={false}
              name="Users"
              stroke="var(--chart-4)"
              strokeWidth={2}
              type="monotone"
            />
            <LineChart.Tooltip content={<LineChart.TooltipContent />} />
          </LineChart>
        )}
      </Card.Content>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted text-xs">{label}</span>
    </div>
  );
}
