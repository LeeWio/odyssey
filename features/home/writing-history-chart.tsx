"use client";

import { ChartTooltip } from "@heroui-pro/react";
import { useMediaQuery } from "@mantine/hooks";
import { useFormatter, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Area, AreaChart, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { writingMonthDate, writingMonthFormat, type WritingMonth } from "./writing-history";

const pointColor = "var(--color-blue-500)";

export function WritingHistoryChart({ months }: { months: WritingMonth[] }) {
  const t = useTranslations("Home.siteRecord.chart");
  const format = useFormatter();
  const isWide = useMediaQuery("(min-width: 768px)", false, { getInitialValueInEffect: false });
  const isTouch = useMediaQuery("(hover: none)", false, { getInitialValueInEffect: false });
  const gradientId = useId();
  const instructionsId = useId();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showKeyboardSelection, setShowKeyboardSelection] = useState(false);
  const lastIndex = months.length - 1;
  const index = Math.min(selectedIndex, lastIndex);
  const latest = months.at(-1);
  const selected = months[index];

  if (!latest || !selected) return null;

  const height = isWide ? 400 : 192;
  const ceiling = Math.max(1, latest.total * 1.12);
  const marker = showKeyboardSelection ? selected : latest;
  const monthLabel = (id: string) => format.dateTime(writingMonthDate(id), writingMonthFormat);

  function renderTooltip(id: string, total: number) {
    return (
      <ChartTooltip>
        <ChartTooltip.Header>{monthLabel(id)}</ChartTooltip.Header>
        <ChartTooltip.Item>
          <ChartTooltip.Indicator color={pointColor} />
          <ChartTooltip.Label>{t("tooltipLabel")}</ChartTooltip.Label>
          <ChartTooltip.Value>{format.number(total)}</ChartTooltip.Value>
        </ChartTooltip.Item>
      </ChartTooltip>
    );
  }

  return (
    <div className="relative">
      <p id={instructionsId} className="sr-only">
        {t("keyboardInstructions")}
      </p>
      <input
        type="range"
        min={0}
        max={lastIndex}
        value={index}
        aria-label={t("accessibleLabel")}
        aria-describedby={instructionsId}
        aria-valuetext={t("monthAnnouncement", {
          month: monthLabel(selected.id),
          total: t("monthTotal", { count: selected.total }),
        })}
        className="peer pointer-events-none absolute inset-0 m-0 size-full opacity-0"
        onFocus={() => setShowKeyboardSelection(true)}
        onBlur={() => setShowKeyboardSelection(false)}
        onChange={(event) => {
          setSelectedIndex(event.currentTarget.valueAsNumber);
          setShowKeyboardSelection(true);
        }}
      />
      <div
        aria-hidden="true"
        data-testid="writing-history-plot"
        className="peer-focus-visible:outline-focus relative touch-pan-y peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2"
        onPointerMoveCapture={() => setShowKeyboardSelection(false)}
        onPointerDownCapture={() => setShowKeyboardSelection(false)}
      >
        <AreaChart
          accessibilityLayer={false}
          data={months}
          responsive
          style={{ width: "100%", height }}
          margin={{ top: 0, right: 0, bottom: 12, left: 0 }}
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
          {showKeyboardSelection && (
            <ReferenceLine x={selected.id} stroke={pointColor} strokeOpacity={0.35} />
          )}
          <ReferenceDot x={marker.id} y={marker.total} r={3.5} fill={pointColor} stroke="none" />
          <Tooltip
            active={showKeyboardSelection ? false : undefined}
            trigger={isTouch ? "click" : "hover"}
            offset={14}
            reverseDirection={{ y: true }}
            // Keep the tooltip above the figure caption at z-10.
            wrapperStyle={{ zIndex: 20 }}
            cursor={{ style: { stroke: pointColor, strokeDasharray: "none", strokeOpacity: 0.35 } }}
            content={({ active, label, payload }) => {
              const total = payload[0]?.value;
              return active && typeof label === "string" && typeof total === "number"
                ? renderTooltip(label, total)
                : null;
            }}
          />
        </AreaChart>
        {showKeyboardSelection && (
          <div className="pointer-events-none absolute end-3 top-3 z-20">
            {renderTooltip(selected.id, selected.total)}
          </div>
        )}
      </div>
    </div>
  );
}
