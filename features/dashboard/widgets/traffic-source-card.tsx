"use client";

import { EllipsisVertical } from "@gravity-ui/icons";
import { Card } from "@heroui/react";
import { LineChart } from "@heroui-pro/react/line-chart";
import { useLocale, useTranslations } from "next-intl";

import { useMemo } from "react";
import { useGetTrafficAnalyticsQuery } from "@/lib/features/dashboard";

import { IconButton } from "../icon-button";

function formatYTick(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;
}

export function TrafficSourceCard() {
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const { data } = useGetTrafficAnalyticsQuery(365);
  const chartData = useMemo(() => {
    const buckets = new Map<string, { month: string; organic: number; paidAds: number }>();

    for (const point of data?.timeSeries ?? []) {
      const month = new Date(point.date).toLocaleDateString(locale, { month: "short" });
      const bucket = buckets.get(month) ?? { month, organic: 0, paidAds: 0 };

      bucket.organic += point.sessions;
      bucket.paidAds += point.users;
      buckets.set(month, bucket);
    }

    return [...buckets.values()];
  }, [data, locale]);
  const total = data?.summary.sessions.numericValue ?? 0;

  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">{t("widgets.trafficSource")}</Card.Title>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <LegendDot color="var(--chart-2)" label={t("widgets.organic")} />
            <LegendDot color="var(--chart-4)" label={t("widgets.paidAds")} />
          </div>
          <IconButton label={t("widgets.moreOptions")} size="sm" variant="tertiary">
            <EllipsisVertical className="size-4" />
          </IconButton>
        </div>
      </Card.Header>
      <Card.Content className="gap-4">
        <div className="flex flex-col">
          <span className="text-foreground text-lg font-semibold tabular-nums">
            {total.toLocaleString(locale)}
          </span>
          <span className="text-muted text-xs">{t("widgets.sessions")}</span>
        </div>
        <LineChart data={chartData} height={180}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis dataKey="month" tickMargin={8} />
          <LineChart.YAxis tickFormatter={formatYTick} width={30} />
          <LineChart.Line
            dataKey="organic"
            dot={false}
            name={t("widgets.organic")}
            stroke="var(--chart-2)"
            strokeWidth={2}
            type="linear"
          />
          <LineChart.Line
            dataKey="paidAds"
            dot={false}
            name={t("widgets.paidAds")}
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
