"use client";

import { useMemo } from "react";
import { Card, Skeleton, cn } from "@heroui/react";
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
      <Card className={cn("w-full border-none p-4", className)} variant={variant}>
        <div className="flex w-full items-center justify-between pb-2">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-4 w-14 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
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
    <Card
      className={cn("border-default-100 w-full rounded-2xl border p-4", className)}
      variant={variant}
    >
      {/* 1. Miniature Portfolio Header */}
      <div className="flex w-full items-center justify-between pb-2 select-none">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-semibold tracking-tight">
            {data.symbol}
          </span>
          <span className="text-muted-foreground line-clamp-1 max-w-40 text-xs">{data.name}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-foreground text-sm font-semibold">¥{data.current?.toFixed(2)}</span>
          <span className={cn("text-xs font-medium", isUp ? "text-green-500" : "text-danger-500")}>
            {isUp ? "+" : ""}
            {data.changePct?.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 2. Sparkline Chart */}
      <div className="w-full pt-2">
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
      </div>
    </Card>
  );
}
