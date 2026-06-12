"use client";

import { useMemo } from "react";
import { Card, Skeleton } from "@heroui/react";
import { BarChart } from "@heroui-pro/react";

import { useGetTrafficAnalyticsQuery } from "@/lib/features/dashboard/dashboard-api";

function formatThousands(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;
}

export function TopChannelsCard() {
  const { data, isLoading } = useGetTrafficAnalyticsQuery();

  console.log(data);

  const chartData = useMemo(() => {
    if (!data?.sources) return [];

    return data.sources.map((source) => ({
      channel: source.name,
      sessions: source.views,
    }));
  }, [data]);

  return (
    <Card className="h-full rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Top channels</Card.Title>
        <Card.Description>Sessions by acquisition channel.</Card.Description>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <div className="flex h-[360px] w-full flex-col gap-4 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <BarChart data={chartData} height={360} layout="vertical">
            <BarChart.Grid horizontal={false} />
            <BarChart.XAxis tickFormatter={formatThousands} tickMargin={4} type="number" />
            <BarChart.YAxis dataKey="channel" tickMargin={4} type="category" width={110} />
            <BarChart.Bar
              barSize={16}
              dataKey="sessions"
              fill="var(--chart-3)"
              name="Sessions"
              radius={[0, 24, 24, 0]}
            />
            <BarChart.Tooltip content={<BarChart.TooltipContent />} />
          </BarChart>
        )}
      </Card.Content>
    </Card>
  );
}
