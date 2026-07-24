"use client";

import { Skeleton } from "@heroui/react";
import { KPI, Segment, TrendChip } from "@heroui-pro/react";
import { useState } from "react";
import type { Key } from "react-aria-components";
import { ArrowDownIcon, ArrowUpIcon, FileTextIcon, TargetIcon } from "@/components/icons";
import { type MarketPeriod, useGetMarketIndexBySymbolQuery } from "@/lib/features/market";

const mapSparkline = (data?: number[]) => {
  if (!data || data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  return data.map((value) => ({
    value: range === 0 ? 50 : ((value - min) / range) * 100,
  }));
};

interface StockConfig {
  symbol: string;
  icon: React.ElementType;
  color: string;
  title: string;
}

const StockWidget = ({ config }: { config: StockConfig }) => {
  const [range, setRange] = useState<Key>("1D");
  const { data: indexData, isLoading } = useGetMarketIndexBySymbolQuery(
    {
      symbol: config.symbol,
      period: range as MarketPeriod,
    },
    {
      pollingInterval: 300000, // 5 minutes
      refetchOnFocus: true,
    }
  );

  const Icon = config.icon;

  if (isLoading && !indexData) {
    return (
      <KPI>
        <KPI.Header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-8 w-40 rounded" />
        </KPI.Header>
        <KPI.Content className="grid-cols-[1fr_1fr] items-end">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-28 rounded" />
            <div className="mt-1 flex items-center gap-1.5">
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-[70px] w-full rounded" />
        </KPI.Content>
      </KPI>
    );
  }

  const isPositive = (indexData?.changePct || 0) >= 0;

  return (
    <KPI>
      <KPI.Header className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1">
          <Icon className="text-muted size-4" />
          <KPI.Title>{config.title}</KPI.Title>
        </div>
        <Segment defaultSelectedKey="1D" size="sm" onSelectionChange={setRange}>
          <Segment.Item id="1D">1D</Segment.Item>
          <Segment.Item id="1M">1M</Segment.Item>
          <Segment.Item id="1Y">1Y</Segment.Item>
        </Segment>
      </KPI.Header>
      <KPI.Content className="grid-cols-[1fr_1fr] items-end">
        <div className="flex flex-col gap-1">
          <KPI.Value
            className="text-3xl"
            maximumFractionDigits={2}
            value={indexData?.current || 0}
          />
          <div className="flex items-center gap-1.5">
            <TrendChip trend={isPositive ? "up" : "down"} variant="tertiary">
              <TrendChip.Indicator>
                {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
              </TrendChip.Indicator>
              {Math.abs(indexData?.changePct || 0).toFixed(2)}%
              <TrendChip.Suffix>
                {{
                  "1D": "today",
                  "1M": "this month",
                  "1Y": "this year",
                }[range as string] || "today"}
              </TrendChip.Suffix>
            </TrendChip>
          </div>
        </div>
        <KPI.Chart
          color={config.color}
          data={mapSparkline(indexData?.sparkline)}
          height={70}
          strokeWidth={1.5}
        />
      </KPI.Content>
    </KPI>
  );
};

export const Stocks = () => {
  const configs: StockConfig[] = [
    { symbol: ".ixic", icon: TargetIcon, color: "var(--color-accent)", title: "NASDAQ" },
    { symbol: ".inx", icon: TargetIcon, color: "var(--color-success)", title: "S&P 500" },
    { symbol: "sh000001", icon: FileTextIcon, color: "var(--color-danger)", title: "上证指数" },
    { symbol: "sz399001", icon: FileTextIcon, color: "var(--color-warning)", title: "深证成指" },
  ];

  return (
    <div className="col-span-full grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {configs.map((config) => (
        <StockWidget key={config.symbol} config={config} />
      ))}
    </div>
  );
};
