"use client";

import { Card } from "@heroui/react";
import { NumberValue, TrendChip } from "@heroui-pro/react";
import { LineChart } from "@heroui-pro/react/line-chart";
import { useLocale, useTranslations } from "next-intl";

import { useMemo } from "react";
import { useGetTrafficAnalyticsQuery } from "@/lib/features/dashboard";

function formatThousands(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
}

export function SessionsOverTimeCard({ days = 30 }: { days?: number }) {
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const { data } = useGetTrafficAnalyticsQuery(days);
  const points = useMemo(
    () =>
      data?.timeSeries.map((point) => ({
        day: /^\d{4}-\d{2}-\d{2}/.test(point.date)
          ? point.date.slice(5)
          : new Date(point.date).toLocaleDateString(locale, { month: "short", day: "numeric" }),
        sessions: point.sessions,
        users: point.users,
      })) ?? [],
    [data, locale]
  );
  const total = data?.summary.sessions.numericValue ?? 0;
  const growth = data?.summary.sessions.growthRate ?? 0;

  return (
    <Card>
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Card.Title className="text-base">{t("widgets.sessionsOverTime")}</Card.Title>
          <div className="flex items-baseline gap-2">
            <NumberValue
              className="text-foreground text-2xl font-semibold tabular-nums"
              maximumFractionDigits={0}
              value={total}
            />
            <TrendChip trend={growth >= 0 ? "up" : "down"}>
              {Math.abs(growth).toFixed(1)}%
            </TrendChip>
          </div>
          <span className="text-muted text-xs">{t("analytics.lastDays", { days })}</span>
        </div>
        <div className="flex items-center gap-4">
          <LegendDot color="var(--chart-2)" label={t("widgets.sessions")} />
          <LegendDot color="var(--chart-4)" label={t("widgets.users")} />
        </div>
      </Card.Header>
      <Card.Content>
        <LineChart data={points} height={240}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis dataKey="day" minTickGap={32} tickMargin={8} />
          <LineChart.YAxis tickFormatter={formatThousands} width={40} />
          <LineChart.Line
            dataKey="sessions"
            dot={false}
            name={t("widgets.sessions")}
            stroke="var(--chart-2)"
            strokeWidth={2}
            type="monotone"
          />
          <LineChart.Line
            dataKey="users"
            dot={false}
            name={t("widgets.users")}
            stroke="var(--chart-4)"
            strokeWidth={2}
            type="monotone"
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
