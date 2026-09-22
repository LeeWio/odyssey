"use client";

import { EllipsisVertical } from "@gravity-ui/icons";
import { Card } from "@heroui/react";
import { LineChart } from "@heroui-pro/react/line-chart";

import { useMemo } from "react";
import { useGetTrafficAnalyticsQuery } from "@/lib/features/dashboard";

import { IconButton } from "../icon-button";

function formatYTick(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;
}

export function TrafficSourceCard() {
  const { data } = useGetTrafficAnalyticsQuery(365);
  const chartData = useMemo(() => {
    const buckets = new Map<string, { month: string; organic: number; paidAds: number }>();

    for (const point of data?.timeSeries ?? []) {
      const month = new Date(point.date).toLocaleDateString("en-US", { month: "short" });
      const bucket = buckets.get(month) ?? { month, organic: 0, paidAds: 0 };

      bucket.organic += point.sessions;
      bucket.paidAds += point.users;
      buckets.set(month, bucket);
    }

    return [...buckets.values()];
  }, [data]);
  const total = data?.summary.sessions.numericValue ?? 0;

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Traffic Source</Card.Title>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <LegendDot color="var(--chart-2)" label="Organic" />
            <LegendDot color="var(--chart-4)" label="Paid Ads" />
          </div>
          <IconButton label="More options" size="sm" variant="tertiary">
            <EllipsisVertical className="size-4" />
          </IconButton>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div className="flex flex-col">
          <span className="text-foreground text-lg font-semibold tabular-nums">
            {total.toLocaleString("en-US")}
          </span>
          <span className="text-muted text-xs">Sessions</span>
        </div>
        <LineChart data={chartData} height={180}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis dataKey="month" tickMargin={8} />
          <LineChart.YAxis tickFormatter={formatYTick} width={30} />
          <LineChart.Line
            dataKey="organic"
            dot={false}
            name="Organic"
            stroke="var(--chart-2)"
            strokeWidth={2}
            type="linear"
          />
          <LineChart.Line
            dataKey="paidAds"
            dot={false}
            name="Paid Ads"
            stroke="var(--chart-4)"
            strokeWidth={2}
            type="linear"
          />
          <LineChart.Tooltip content={<LineChart.TooltipContent />} />
        </LineChart>
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
