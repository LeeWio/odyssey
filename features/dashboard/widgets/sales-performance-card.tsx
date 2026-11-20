"use client";

import { Card, Label, ListBox, Select } from "@heroui/react";
import { NumberValue, TrendChip } from "@heroui-pro/react";
import { BarChart } from "@heroui-pro/react/bar-chart";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useGetAnalyticsOverviewQuery } from "@/lib/features/dashboard";

import { useSheetPortal } from "../use-sheet-portal";

const RANGE_DAYS = {
  "last-week": 7,
  "last-2-weeks": 14,
  "last-month": 30,
  "last-3-months": 90,
} as const;

type SalesRange = keyof typeof RANGE_DAYS;

export function SalesPerformanceCard() {
  const t = useTranslations("Dashboard");
  const portalContainer = useSheetPortal();
  const [range, setRange] = useState<SalesRange>("last-2-weeks");
  const { data } = useGetAnalyticsOverviewQuery();
  const chartData = useMemo(
    () =>
      (data?.dailyTrends ?? []).slice(-RANGE_DAYS[range]).map((point) => ({
        month: point.date.slice(5),
        sales: point.pv,
      })),
    [data, range]
  );
  const total = chartData.reduce((sum, point) => sum + point.sales, 0);
  const growth = data?.pvGrowthRate ?? 0;
  const miniKpis = [
    { label: t("widgets.todayPv"), value: data?.todayPv ?? 0 },
    { label: t("widgets.todayUv"), value: data?.todayUv ?? 0 },
    { label: t("widgets.periodPv"), value: total },
  ];

  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">{t("widgets.salesPerformance")}</Card.Title>
        <Select
          aria-label={t("widgets.salesPeriod")}
          className="w-[140px]"
          value={range}
          variant="secondary"
          onChange={(value) => {
            if (value && value in RANGE_DAYS) setRange(value as SalesRange);
          }}
        >
          <Label className="sr-only">{t("widgets.salesPeriod")}</Label>
          <Select.Trigger className="text-xs font-medium">
            <Select.Value />
            <Select.Indicator className="size-3.5" />
          </Select.Trigger>
          <Select.Popover UNSTABLE_portalContainer={portalContainer || undefined}>
            <ListBox>
              <ListBox.Item id="last-week" textValue={t("widgets.lastWeek")}>
                <Label>{t("widgets.lastWeek")}</Label>
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="last-2-weeks" textValue={t("widgets.lastTwoWeeks")}>
                <Label>{t("widgets.lastTwoWeeks")}</Label>
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="last-month" textValue={t("widgets.lastMonth")}>
                <Label>{t("widgets.lastMonth")}</Label>
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="last-3-months" textValue={t("widgets.lastThreeMonths")}>
                <Label>{t("widgets.lastThreeMonths")}</Label>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </Card.Header>
      <Card.Content className="gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {miniKpis.map((kpi) => (
            <div key={kpi.label} className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <NumberValue
                  className="text-foreground text-lg font-semibold tabular-nums"
                  maximumFractionDigits={0}
                  style="decimal"
                  value={kpi.value}
                />
                <TrendChip trend={growth >= 0 ? "up" : "down"}>
                  {Math.abs(growth).toFixed(1)}%
                </TrendChip>
              </div>
              <span className="text-muted text-xs">{kpi.label}</span>
            </div>
          ))}
        </div>
        <BarChart data={chartData} height={180}>
          <BarChart.Grid vertical={false} />
          <BarChart.XAxis dataKey="month" tickMargin={8} />
          <BarChart.YAxis domain={[0, 60]} ticks={[0, 20, 40, 60]} width={30} />
          <BarChart.Bar
            barSize={16}
            dataKey="sales"
            fill="var(--chart-3)"
            radius={[24, 24, 24, 24]}
          />
          <BarChart.Tooltip content={<BarChart.TooltipContent />} />
        </BarChart>
      </Card.Content>
    </Card>
  );
}
