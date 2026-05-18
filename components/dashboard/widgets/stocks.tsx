"use client";

import { SquareChartBar, Target, ArrowUp, ArrowDown } from "@gravity-ui/icons";
import { KPI, TrendChip } from "@heroui-pro/react";
import { Skeleton } from "@heroui/react";
import { useGetMarketIndicesQuery } from "@/lib/features/market";

export const Stocks = () => {
    const { data: indices, isLoading } = useGetMarketIndicesQuery(undefined, {
        pollingInterval: 300000, // 5 minutes
        refetchOnFocus: true,
    });

    const mapSparkline = (data?: number[]) => {
        if (!data || data.length === 0) return [];
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        
        return data.map(value => ({
            value: range === 0 ? 50 : ((value - min) / range) * 100
        }));
    };

    if (isLoading) {
        return (
            <>
                {Array.from({ length: 4 }).map((_, index) => (
                    <KPI key={index}>
                        <KPI.Header>
                            <Skeleton className="size-4 rounded-full" />
                            <Skeleton className="h-4 w-20 rounded" />
                        </KPI.Header>
                        <KPI.Content className="grid-cols-[1fr_1fr] items-end">
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-9 w-28 rounded" />
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            </div>
                            <Skeleton className="h-[70px] w-full rounded" />
                        </KPI.Content>
                    </KPI>
                ))}
            </>
        );
    }

    const configs = [
        { symbol: '.ixic', icon: Target, color: "var(--color-accent)", title: "NASDAQ" },
        { symbol: '.inx', icon: Target, color: "var(--color-success)", title: "S&P 500" },
        { symbol: 'sh000001', icon: SquareChartBar, color: "var(--color-danger)", title: "上证指数" },
        { symbol: 'sz399001', icon: SquareChartBar, color: "var(--color-warning)", title: "深证成指" },
    ];

    return (
        <>
            {configs.map((config) => {
                const indexData = indices?.find(i => i.symbol === config.symbol);
                const Icon = config.icon;
                const isUp = (indexData?.changePct || 0) >= 0;
                
                return (
                    <KPI key={config.symbol}>
                        <KPI.Header>
                            <Icon className="text-muted size-4" />
                            <KPI.Title>{config.title}</KPI.Title>
                        </KPI.Header>
                        <KPI.Content className="grid-cols-[1fr_1fr] items-end">
                            <div className="flex flex-col gap-1">
                                <KPI.Value className="text-3xl" maximumFractionDigits={2} value={indexData?.current || 0} />
                                <div className="flex items-center gap-1.5">
                                    <TrendChip trend={isUp ? "down" : "up"} variant="tertiary">
                                        <TrendChip.Indicator>
                                            {isUp ? <ArrowUp /> : <ArrowDown />}
                                        </TrendChip.Indicator>
                                        {Math.abs(indexData?.changePct || 0)}%
                                        <TrendChip.Suffix>today</TrendChip.Suffix>
                                    </TrendChip>
                                </div>
                            </div>
                            <KPI.Chart color={config.color} data={mapSparkline(indexData?.sparkline)} height={70} strokeWidth={1.5} />
                        </KPI.Content>
                    </KPI>
                );
            })}
        </>
    )
}