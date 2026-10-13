"use client";

import { Button, Card, ColorSwatch, Meter, Skeleton, Typography } from "@heroui/react";
import { Segment } from "@heroui-pro/react";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Key } from "react-aria-components";

import { useGetMomentCadenceQuery, type MomentCadenceResponse } from "@/lib/features/moment";

import {
  cadenceProgress,
  cadenceRows,
  type CadenceDot,
  type CadencePeriod,
} from "../utils/cadence";

const PERIODS = ["day", "month", "year"] as const satisfies readonly CadencePeriod[];
const DOT_COLUMNS = 12;

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
  const cadence = useGetMomentCadenceQuery();
  const [period, setPeriod] = useState<CadencePeriod>("day");

  if (cadence.isError) {
    return (
      <Card className="w-full gap-3 p-4" role="alert">
        <Typography type="body-sm">{unavailable}</Typography>
        <Button
          className="self-start"
          size="sm"
          variant="secondary"
          onPress={() => cadence.refetch()}
        >
          {retryLabel}
        </Button>
      </Card>
    );
  }

  return (
    <Card aria-busy={cadence.isLoading} className="w-full gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <Segment
          aria-label={label}
          isDisabled={cadence.isLoading || cadence.data == null}
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
        {cadence.data ? (
          <CadenceMeter cadence={cadence.data} label={labels[period]} period={period} />
        ) : null}
      </div>

      {cadence.data ? (
        <CadenceDots cadence={cadence.data} period={period} />
      ) : (
        <Skeleton animationType="shimmer" className="h-[110px] w-full rounded-xl" />
      )}
    </Card>
  );
}

function CadenceMeter({
  cadence,
  label,
  period,
}: {
  cadence: MomentCadenceResponse;
  label: string;
  period: CadencePeriod;
}) {
  const progress = cadenceProgress(cadenceRows(cadence, period));

  return (
    <Meter
      aria-label={label}
      className="w-auto shrink-0"
      formatOptions={{ maximumFractionDigits: 0, style: "percent" }}
      maxValue={Math.max(progress.total, 1)}
      minValue={0}
      value={progress.value}
    >
      <Meter.Output className="text-muted text-sm font-medium tabular-nums" />
    </Meter>
  );
}

function CadenceDots({
  cadence,
  period,
}: {
  cadence: MomentCadenceResponse;
  period: CadencePeriod;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const rows = cadenceRows(cadence, period);
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useLayoutEffect(() => {
    const node = content.current;
    if (!node) return;
    const next = node.offsetHeight;
    if (reducedMotion) {
      setHeight(next);
      return;
    }
    setHeight((current) => (current === next ? current : current === "auto" ? next : current));
    const frame = requestAnimationFrame(() => setHeight(next));
    return () => cancelAnimationFrame(frame);
  }, [period, reducedMotion]);

  return (
    <motion.div
      aria-hidden="true"
      animate={{ height }}
      className="overflow-hidden"
      initial={false}
      transition={reducedMotion ? { duration: 0 } : heightTransition}
    >
      <div ref={content} className="flex flex-col gap-2.5">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-2.5"
            style={{ gridTemplateColumns: `repeat(${DOT_COLUMNS}, minmax(0, 1fr))` }}
          >
            {row.map((dot, dotIndex) => (
              <CadenceDotView key={dotIndex} dot={dot} />
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CadenceDotView({ dot }: { dot: CadenceDot }) {
  if (dot === "none") return <span className="aspect-square" />;

  return (
    <ColorSwatch
      className="aspect-square size-auto w-full rounded-full shadow-none"
      color={SWATCH_COLOR}
      size="xs"
      style={swatchStyle(dot)}
    />
  );
}

const SWATCH_COLOR = "rgba(0, 0, 0, 1)";

function swatchStyle(dot: CadenceDot): CSSProperties {
  return { background: dot === "filled" ? "var(--accent)" : "var(--default)" };
}

const heightTransition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const };

function isPeriod(key: Key): key is CadencePeriod {
  return PERIODS.some((period) => period === key);
}
