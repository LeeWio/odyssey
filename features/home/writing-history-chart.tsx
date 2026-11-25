"use client";

import { ChartTooltip } from "@heroui-pro/react";
import { AreaChart } from "@heroui-pro/react/area-chart";
import { useMediaQuery } from "@mantine/hooks";
import { useFormatter, useTranslations } from "next-intl";
import { useId } from "react";
import { ReferenceDot } from "recharts";
import type { WritingMonth } from "./writing-history";

const pointColor = "var(--color-blue-500)";

export function WritingHistoryChart({ months }: { months: WritingMonth[] }) {
  const t = useTranslations("Home.siteRecord.chart");
  const format = useFormatter();
  const isWide = useMediaQuery("(min-width: 768px)", false, { getInitialValueInEffect: false });
  const isTouch = useMediaQuery("(hover: none)", false, { getInitialValueInEffect: false });
  const gradientId = useId();
  const latest = months.at(-1);

  if (!latest) return null;

  const height = isWide ? 400 : 192;
  const ceiling = Math.max(1, latest.total * 1.12);

  return (
    <AreaChart
      data={months}
      height={height}
      margin={{ top: 0, right: 0, bottom: 12, left: 0 }}
      role="group"
      aria-label={t("accessibleLabel")}
      className="touch-pan-y"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          x2="0"
          y1="0"
          y2={height}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0} />
          <stop offset="30%" stopColor="var(--color-foreground)" stopOpacity={0.008} />
          <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0.085} />
        </linearGradient>
      </defs>
      <AreaChart.XAxis dataKey="id" hide />
      <AreaChart.YAxis domain={[0, ceiling]} hide />
      <AreaChart.Area
        type="monotoneX"
        dataKey="total"
        baseValue={ceiling}
        fill={`url(#${gradientId})`}
        fillOpacity={1}
        stroke="var(--color-foreground)"
        strokeOpacity={0.4}
        strokeWidth={1.5}
        dot={false}
        activeDot={{
          r: 4,
          fill: pointColor,
          stroke: "var(--color-background)",
          strokeWidth: 1.5,
          strokeOpacity: 1,
        }}
        isAnimationActive="auto"
        animationDuration={500}
        animationEasing="ease-out"
      />
      <ReferenceDot x={latest.id} y={latest.total} r={3.5} fill={pointColor} stroke="none" />
      <AreaChart.Tooltip
        trigger={isTouch ? "click" : "hover"}
        offset={14}
        reverseDirection={{ y: true }}
        cursor={{ style: { stroke: pointColor, strokeDasharray: "none", strokeOpacity: 0.35 } }}
        content={({ active, label, payload }) => {
          const total = payload[0]?.value;
          if (!active || typeof label !== "string" || typeof total !== "number") return null;

          const month = new Date(`${label}-01T00:00:00Z`);

          return (
            <ChartTooltip className="min-w-44 gap-1.5 rounded-2xl px-3.5 py-2.5">
              <ChartTooltip.Header>
                {format.dateTime(month, { year: "numeric", month: "long", timeZone: "UTC" })}
              </ChartTooltip.Header>
              <ChartTooltip.Item>
                <ChartTooltip.Indicator color={pointColor} />
                <ChartTooltip.Label>{t("tooltipLabel")}</ChartTooltip.Label>
                <ChartTooltip.Value className="text-sm font-semibold">
                  {format.number(total)}
                </ChartTooltip.Value>
              </ChartTooltip.Item>
            </ChartTooltip>
          );
        }}
      />
    </AreaChart>
  );
}
