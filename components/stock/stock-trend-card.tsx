"use client";

import { useMemo, useState } from "react";
import { Card, Skeleton, cn, Button, Tooltip, CardVariants } from "@heroui/react";
import { useGetStockTrendQuery } from "@/lib/features/stock/stock-api";
import { AreaChart } from "@heroui-pro/react/area-chart";
import { ChartTooltip, EmptyState, Segment } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

interface StockTrendCardProps {
  symbol: string;
  className?: string;
  variant?: CardVariants["variant"];
}

export function StockTrendCard({ symbol, className, variant = "default" }: StockTrendCardProps) {
  const [period, setPeriod] = useState<string>("1M");

  const { data, isLoading, isError } = useGetStockTrendQuery({ symbol, period });

  const isUp = useMemo(() => {
    if (!data) return true;
    return data.changePct >= 0;
  }, [data]);

  const formattedTrendPoints = useMemo(() => {
    if (!data?.trendPoints) return [];
    return data.trendPoints.map((p) => {
      const parts = p.date.split("-");
      const shortDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : p.date;
      return {
        ...p,
        shortDate,
      };
    });
  }, [data]);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)} variant={variant}>
        <Card.Header className="flex-row items-center justify-between">
          <Skeleton className="h-6 w-28" />

          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </Card.Header>

        <Card.Content>
          <div className="relative h-50 w-full overflow-hidden">
            <div className="absolute inset-0 flex flex-col justify-between py-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="border-default-200/40 border-t" />
              ))}
            </div>

            <div className="absolute inset-x-0 top-8 bottom-6 flex items-end gap-4">
              {[38, 44, 41, 52, 48, 58, 63, 60, 72, 68, 76, 71, 82, 78, 86, 80, 88, 84, 92, 89].map(
                (height, index) => (
                  <Skeleton key={index} className="flex-1" style={{ height: `${height}%` }} />
                )
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 flex justify-between">
              <Skeleton className="h-3 w-8 rounded-sm" />
              <Skeleton className="h-3 w-8 rounded-sm" />
              <Skeleton className="h-3 w-8 rounded-sm" />
              <Skeleton className="h-3 w-8 rounded-sm" />
              <Skeleton className="h-3 w-8 rounded-sm" />
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState className="bg-surface-secondary">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Icon icon="gravity-ui:chart-line-arrow-up" />
          </EmptyState.Media>
          <EmptyState.Title>No Trend Data Yet</EmptyState.Title>
          <EmptyState.Description>
            There isn&apos;t enough market data to display the price trend yet.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content className="flex-row gap-2">
          <Button>Try Again</Button>
        </EmptyState.Content>
      </EmptyState>
    );
  }

  const strokeColor = isUp ? "var(--color-success, #17c964)" : "var(--color-danger, #f31260)";

  return (
    <Card className={cn("w-full", className)} variant={variant}>
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title>
          <Tooltip delay={0} closeDelay={100}>
            <Tooltip.Trigger aria-label="Stock name">{data.symbol}</Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top">
              <Tooltip.Arrow />
              <p>{data.name}</p>
            </Tooltip.Content>
          </Tooltip>
        </Card.Title>
        <Segment
          selectedKey={period}
          onSelectionChange={(key) => setPeriod(key as string)}
          size="sm"
        >
          <Segment.Item id="1W">1W</Segment.Item>
          <Segment.Item id="1M">1M</Segment.Item>
          <Segment.Item id="1Y">1Y</Segment.Item>
        </Segment>
      </Card.Header>
      <Card.Content className="flex flex-col gap-2">
        {formattedTrendPoints.length > 0 ? (
          <AreaChart data={formattedTrendPoints} height={200}>
            <defs>
              <linearGradient id={`stock-fill-${symbol}-${period}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <AreaChart.Grid vertical={false} />
            <AreaChart.XAxis dataKey="shortDate" tickMargin={8} />
            <AreaChart.YAxis
              domain={["dataMin - 10", "dataMax + 10"]}
              tickFormatter={(v: number) => `¥${v.toFixed(0)}`}
              width={50}
            />
            <AreaChart.Area
              dataKey="price"
              dot={false}
              fill={`url(#stock-fill-${symbol}-${period})`}
              name="Price"
              stroke={strokeColor}
              strokeWidth={2}
              type="monotone"
            />
            <AreaChart.Tooltip
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) return null;

                return (
                  <ChartTooltip>
                    <ChartTooltip.Header>{label}</ChartTooltip.Header>
                    {payload.map((entry) => (
                      <ChartTooltip.Item key={String(entry.dataKey)}>
                        <ChartTooltip.Indicator color={entry.color ?? entry.stroke} />
                        <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
                        <ChartTooltip.Value>¥{Number(entry.value).toFixed(2)}</ChartTooltip.Value>
                      </ChartTooltip.Item>
                    ))}
                  </ChartTooltip>
                );
              }}
            />
          </AreaChart>
        ) : (
          <div className="border-default-200/50 flex h-50 items-center justify-center rounded-xl border border-dashed">
            <span className="text-muted-foreground text-xs">No trend coordinates available</span>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
