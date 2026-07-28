"use client";

import { Card, Spinner } from "@heroui/react";
import { AreaChart, NumberValue, TrendChip } from "@heroui-pro/react";
import { useGetMarketIndicesQuery } from "@/lib/features/market/market-api";
import { Icon } from "@iconify/react";

export function MarketPulseCard() {
  const { data: indices = [], isLoading } = useGetMarketIndicesQuery("1D");

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="gravity-ui:chart-line" className="text-accent size-5" />
          <Card.Title className="text-base">Market Pulse</Card.Title>
        </div>
        <TrendChip className="bg-transparent" trend="up">
          Real-time
        </TrendChip>
      </Card.Header>
      <Card.Content className="flex flex-col gap-6">
        {isLoading ? (
          <div className="flex h-[180px] items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {indices.map((index) => {
              const isUp = index.changePct >= 0;
              return (
                <div
                  key={index.symbol}
                  className="bg-surface-secondary ring-border/50 flex flex-col gap-1 rounded-2xl p-4 ring-1"
                >
                  <span className="text-muted text-[10px] font-bold tracking-widest uppercase">
                    {index.name}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <NumberValue
                      className="text-foreground text-lg font-bold tabular-nums"
                      maximumFractionDigits={2}
                      value={index.current}
                    />
                    <span className={`text-xs font-bold ${isUp ? "text-success" : "text-danger"}`}>
                      {isUp ? "+" : ""}
                      {index.changePct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Simple visual representation if data exists */}
        {!isLoading && indices.length > 0 && (
          <div className="h-[80px] w-full opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0">
            <AreaChart data={indices.map((idx, i) => ({ x: i, y: idx.current }))} height={80}>
              <AreaChart.Area
                dataKey="y"
                stroke="var(--color-accent)"
                fill="var(--color-accent-soft)"
              />
            </AreaChart>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
