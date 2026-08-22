"use client";

import { useMemo } from "react";
import { Card, Skeleton, cn, Tooltip } from "@heroui/react";
import { useGetStockTrendQuery } from "@/lib/features/stock/stock-api";
import { LineChart } from "@heroui-pro/react/line-chart";
import { EmptyState } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

interface StockTrendCardProps {
  symbol: string;
  className?: string;
  variant?: "default" | "secondary" | "tertiary" | "transparent";
}

export function StockTrendCard({ symbol, className, variant = "default" }: StockTrendCardProps) {
  // Lock period to 1M for compact portfolio timeline view
  const { data, isLoading, isError } = useGetStockTrendQuery({ symbol, period: "1M" });

  const isUp = useMemo(() => {
    if (!data) return true;
    return data.changePct >= 0;
  }, [data]);

  const formattedTrendPoints = useMemo(() => {
    if (!data?.trendPoints) return [];
    return data.trendPoints.map((p) => ({
      ...p,
      price: p.price,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card
        className={cn(
          "w-full rounded-2xl p-4",
          variant === "transparent" && "border-none bg-transparent p-0 shadow-none",
          className
        )}
        variant={variant}
      >
        <div className="flex w-full items-center justify-between pb-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
        <div className="w-full pt-2">
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState className="bg-surface-secondary border-default-100 rounded-2xl border p-4">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Icon icon="gravity-ui:chart-line-arrow-up" className="size-4" />
          </EmptyState.Media>
          <EmptyState.Title className="text-xs">No Trend Data Yet</EmptyState.Title>
        </EmptyState.Header>
      </EmptyState>
    );
  }

  const strokeColor = isUp ? "var(--color-success, #17c964)" : "var(--color-danger, #f31260)";

  return (
    <Card className={cn("w-full", className)} variant={variant}>
      <Card.Header className="flex-row items-start justify-between pb-0">
        <div className="flex flex-col">
          <Tooltip delay={0} closeDelay={100}>
            <Tooltip.Trigger aria-label="Stock Symbol">
              <span className="text-foreground hover:text-accent cursor-pointer text-sm font-semibold tracking-tight transition-colors">
                {data.symbol}
              </span>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top">
              <Tooltip.Arrow />
              <p className="text-xs font-medium">{data.name}</p>
            </Tooltip.Content>
          </Tooltip>
        </div>

        <div className="flex flex-col items-end">
          <Tooltip delay={0} closeDelay={100}>
            <Tooltip.Trigger aria-label="Change Percentage">
              <span
                className={cn(
                  "cursor-pointer text-sm font-semibold transition-all hover:scale-105",
                  isUp ? "text-green-500" : "text-danger-500"
                )}
              >
                {isUp ? "+" : ""}
                {data.changePct?.toFixed(2)}%
              </span>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top">
              <Tooltip.Arrow />
              <p className="text-xs font-semibold">Price: ¥{data.current?.toFixed(2)}</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </Card.Header>

      <Card.Content>
        {formattedTrendPoints.length > 0 ? (
          <LineChart
            data={formattedTrendPoints}
            height={80}
            margin={{ bottom: 0, left: 0, right: 0, top: 4 }}
          >
            <LineChart.YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
            <LineChart.Line
              dataKey="price"
              dot={false}
              stroke={strokeColor}
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        ) : (
          <div className="border-default-200/50 flex h-20 items-center justify-center rounded-xl border border-dashed">
            <span className="text-muted-foreground text-xs">No coordinates available</span>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
