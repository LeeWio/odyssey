"use client";

import { Button, Card, ColorSwatch, Meter, Skeleton, Tooltip, Typography } from "@heroui/react";
import { Segment } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useFormatter, useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { Key } from "react-aria-components";
import { motion } from "motion/react";

import { useGetMomentCadenceQuery } from "@/lib/features/moment";
import { pageEaseOut } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useMomentMotion } from "./feed-motion";

import {
  cadenceProgress,
  cadenceRows,
  type CadenceCell,
  type CadencePeriod,
} from "../utils/cadence";

const PERIODS = ["day", "month", "year"] as const satisfies readonly CadencePeriod[];
const DOT_COLUMNS = 12;
const PERCENT_FORMAT = { maximumFractionDigits: 0, style: "percent" } as const;

export function MomentCadenceCard({
  label,
  labels,
  unavailable,
  retryLabel,
}: {
  label: string;
  labels: Record<CadencePeriod, string>;
  unavailable: string;
  retryLabel: string;
}) {
  const format = useFormatter();
  const detailsId = useId();
  const [expanded, setExpanded] = useState(false);
  const query = useGetMomentCadenceQuery();
  const [period, setPeriod] = useState<CadencePeriod>("day");
  const data = query.data;
  const rows = data ? cadenceRows(data, period) : null;
  const progress = rows ? cadenceProgress(rows) : null;

  return (
    <>
      <Button
        aria-controls={detailsId}
        aria-expanded={expanded}
        className="lg:hidden"
        size="sm"
        variant="ghost"
        onPress={() => setExpanded((value) => !value)}
      >
        {label}
        {progress ? (
          <span className="text-muted tabular-nums">
            {labels[period]} ·{" "}
            {format.number(progress.value / Math.max(progress.total, 1), PERCENT_FORMAT)}
          </span>
        ) : null}
        <Icon aria-hidden="true" icon={expanded ? "lucide:chevron-up" : "lucide:chevron-down"} />
      </Button>
      <div id={detailsId} className={cn("lg:mt-0 lg:block", expanded ? "mt-2" : "hidden")}>
        <Card aria-busy={query.isLoading} className="w-full gap-4">
          <div className="flex items-center justify-between gap-3">
            <Segment
              aria-label={label}
              isDisabled={data == null}
              selectedKey={period}
              size="sm"
              onSelectionChange={(key: Key) => {
                if (isPeriod(key)) setPeriod(key);
              }}
            >
              {PERIODS.map((item) => (
                <Segment.Item key={item} id={item}>
                  {labels[item]}
                </Segment.Item>
              ))}
            </Segment>
            {progress ? <CadenceMeter label={labels[period]} progress={progress} /> : null}
          </div>
          {rows ? (
            <div className="min-h-28">
              <CadenceDots key={period} periodLabel={labels[period]} rows={rows} />
            </div>
          ) : query.isError ? (
            <div className="flex min-h-28 flex-col items-start gap-2" role="status">
              <Typography type="body-sm">{unavailable}</Typography>
              <Button size="sm" variant="secondary" onPress={() => void query.refetch()}>
                {retryLabel}
              </Button>
            </div>
          ) : (
            <Skeleton animationType="shimmer" className="h-28 w-full" />
          )}
        </Card>
      </div>
    </>
  );
}

function CadenceMeter({
  label,
  progress,
}: {
  label: string;
  progress: ReturnType<typeof cadenceProgress>;
}) {
  return (
    <Meter
      aria-label={label}
      className="w-auto shrink-0"
      formatOptions={PERCENT_FORMAT}
      maxValue={Math.max(progress.total, 1)}
      minValue={0}
      value={progress.value}
    >
      <Meter.Output className="text-muted text-sm font-medium tabular-nums" />
    </Meter>
  );
}

const CADENCE_NAVIGATION = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -DOT_COLUMNS,
  ArrowDown: DOT_COLUMNS,
} as const;

function CadenceDots({ periodLabel, rows }: { periodLabel: string; rows: CadenceCell[][] }) {
  const { reduced } = useMomentMotion();
  const t = useTranslations("Moments");
  const gridRef = useRef<HTMLDivElement>(null);
  const helpId = useId();
  const cells = rows.flat();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const reachableIndex =
    focusedIndex !== null && cells[focusedIndex]?.label
      ? focusedIndex
      : cells.findIndex((cell) => cell.label !== null);

  const moveFocus = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const offset = CADENCE_NAVIGATION[event.key as keyof typeof CADENCE_NAVIGATION];
    if (offset === undefined) return;

    event.preventDefault();
    const next = index + offset;
    if (cells[next]?.label) {
      gridRef.current?.querySelector<HTMLElement>(`[data-cadence-index="${next}"]`)?.focus();
    }
  };

  return (
    <>
      <p id={helpId} className="sr-only">
        {t("cadenceKeyboard")}
      </p>
      <motion.div
        ref={gridRef}
        role="grid"
        aria-label={t("cadenceGrid", { period: periodLabel })}
        aria-describedby={helpId}
        aria-colcount={DOT_COLUMNS}
        className="flex flex-col gap-2.5"
        data-slot="moment-cadence-dots"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.16, ease: pageEaseOut }}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            role="row"
            className="grid gap-2.5"
            style={{ gridTemplateColumns: `repeat(${DOT_COLUMNS}, minmax(0, 1fr))` }}
          >
            {row.map((dot, dotIndex) => {
              const index = rowIndex * DOT_COLUMNS + dotIndex;
              if (dot.label == null)
                return <span key={dotIndex} aria-hidden="true" className="aspect-square" />;

              const label = t(
                dot.state === "filled" ? "cadencePublished" : "cadenceNoPublication",
                {
                  date: dot.label,
                }
              );
              return (
                <Tooltip key={dotIndex} closeDelay={0} delay={250}>
                  <Tooltip.Trigger
                    role="gridcell"
                    aria-label={label}
                    aria-colindex={dotIndex + 1}
                    className="focus-visible:outline-focus flex aspect-square cursor-help rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
                    data-cadence-index={index}
                    tabIndex={reachableIndex === index ? 0 : -1}
                    onFocus={() => setFocusedIndex(index)}
                    onKeyDown={(event) => moveFocus(event, index)}
                  >
                    <ColorSwatch
                      aria-hidden="true"
                      className="pointer-events-none size-full rounded-full shadow-none"
                      color={SWATCH_COLOR}
                      size="xs"
                      style={swatchStyle(dot.state)}
                    />
                  </Tooltip.Trigger>
                  <CadenceTip label={dot.label} />
                </Tooltip>
              );
            })}
          </div>
        ))}
      </motion.div>
    </>
  );
}

function CadenceTip({ label }: { label: string }) {
  return (
    <Tooltip.Content showArrow placement="top" shouldFlip>
      <Tooltip.Arrow />
      <p>{label}</p>
    </Tooltip.Content>
  );
}

const SWATCH_COLOR = "rgba(0, 0, 0, 1)";

function swatchStyle(dot: CadenceCell["state"]): CSSProperties {
  return { background: dot === "filled" ? "var(--accent)" : "var(--default)" };
}

function isPeriod(key: Key): key is CadencePeriod {
  return PERIODS.some((period) => period === key);
}
