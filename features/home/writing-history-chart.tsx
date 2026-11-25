"use client";

import { ChartTooltip } from "@heroui-pro/react";
import { useMediaQuery } from "@mantine/hooks";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import {
  Area,
  AreaChart,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
  useActiveTooltipLabel,
} from "recharts";
import { writingMonthDate, writingMonthFormat, type WritingMonth } from "./writing-history";

const pointColor = "var(--color-blue-500)";

function ActiveChartMonth({ onChange }: { onChange: (month: string | null) => void }) {
  const label = useActiveTooltipLabel();

  useEffect(() => {
    onChange(typeof label === "string" ? label : null);
  }, [label, onChange]);

  return null;
}

export function WritingHistoryChart({ months }: { months: WritingMonth[] }) {
  const t = useTranslations("Home.siteRecord.chart");
  const format = useFormatter();
  const isWide = useMediaQuery("(min-width: 768px)", false, { getInitialValueInEffect: false });
  const isTouch = useMediaQuery("(hover: none)", false, { getInitialValueInEffect: false });
  const gradientId = useId();
  const instructionsId = useId();
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const latest = months.at(-1);
  const activeMonth = keyboardFocus ? months.find((month) => month.id === activeId) : undefined;

  if (!latest) return null;

  const height = isWide ? 400 : 192;
  const ceiling = Math.max(1, latest.total * 1.12);

  return (
    <>
      <p role="status" aria-atomic="true" className="sr-only">
        {activeMonth
          ? t("monthAnnouncement", {
              month: format.dateTime(writingMonthDate(activeMonth.id), writingMonthFormat),
              total: t("monthTotal", { count: activeMonth.total }),
            })
          : ""}
      </p>
      <p id={instructionsId} className="sr-only">
        {t("keyboardInstructions")}
      </p>
      <div
        className="[&_svg[role=application]:focus-visible]:outline-focus touch-pan-y [&_svg[role=application]:focus-visible]:outline-2 [&_svg[role=application]:focus-visible]:-outline-offset-2"
        onFocus={(event) => setKeyboardFocus(event.target.matches(":focus-visible"))}
        onBlur={() => setKeyboardFocus(false)}
        onKeyDownCapture={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") setKeyboardFocus(true);
        }}
        onPointerMoveCapture={() => setKeyboardFocus(false)}
        onPointerDownCapture={() => setKeyboardFocus(false)}
      >
        <AreaChart
          aria-label={t("accessibleLabel")}
          aria-describedby={instructionsId}
          data={months}
          responsive
          style={{ width: "100%", height }}
          margin={{ top: 0, right: 0, bottom: 12, left: 0 }}
        >
          <ActiveChartMonth onChange={setActiveId} />
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
          <XAxis dataKey="id" hide />
          <YAxis domain={[0, ceiling]} hide />
          <Area
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
          <Tooltip
            trigger={isTouch ? "click" : "hover"}
            offset={14}
            reverseDirection={{ y: true }}
            cursor={{ style: { stroke: pointColor, strokeDasharray: "none", strokeOpacity: 0.35 } }}
            content={({ active, label, payload }) => {
              const total = payload[0]?.value;
              if (!active || typeof label !== "string" || typeof total !== "number") return null;

              return (
                <div aria-hidden="true">
                  <ChartTooltip className="min-w-44 gap-1.5 rounded-2xl px-3.5 py-2.5">
                    <ChartTooltip.Header>
                      {format.dateTime(writingMonthDate(label), writingMonthFormat)}
                    </ChartTooltip.Header>
                    <ChartTooltip.Item>
                      <ChartTooltip.Indicator color={pointColor} />
                      <ChartTooltip.Label>{t("tooltipLabel")}</ChartTooltip.Label>
                      <ChartTooltip.Value className="text-sm font-semibold">
                        {format.number(total)}
                      </ChartTooltip.Value>
                    </ChartTooltip.Item>
                  </ChartTooltip>
                </div>
              );
            }}
          />
        </AreaChart>
      </div>
    </>
  );
}
