"use client";

import { Button, Card, ColorSwatch, Meter, Skeleton, Tooltip, Typography } from "@heroui/react";
import { Segment } from "@heroui-pro/react";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { Key } from "react-aria-components";

import { useGetMomentCadenceQuery, type MomentCadenceResponse } from "@/lib/features/moment";

import {
  cadenceProgress,
  cadenceRows,
  type CadenceCell,
  type CadencePeriod,
} from "../utils/cadence";

const PERIODS = ["day", "month", "year"] as const satisfies readonly CadencePeriod[];
const DOT_COLUMNS = 12;

export function MomentCadenceCard({
  label,
  labels,
  unavailable,
  retryLabel,
  initialData = null,
}: {
  label: string;
  labels: Record<CadencePeriod, string>;
  unavailable: string;
  retryLabel: string;
  initialData?: MomentCadenceResponse | null;
}) {
  const query = useGetMomentCadenceQuery(undefined, { skip: Boolean(initialData) });
  const [period, setPeriod] = useState<CadencePeriod>("day");
  const data = initialData ?? query.data;

  if (!initialData && query.isError) {
    return (
      <Card className="w-full gap-3 p-4" role="alert">
        <Typography type="body-sm">{unavailable}</Typography>
        <Button
          className="self-start"
          size="sm"
          variant="secondary"
          onPress={() => query.refetch()}
        >
          {retryLabel}
        </Button>
      </Card>
    );
  }

  return (
    <Card aria-busy={!initialData && query.isLoading} className="w-full gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <Segment
          aria-label={label}
          isDisabled={(!initialData && query.isLoading) || data == null}
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
        {data ? <CadenceMeter cadence={data} label={labels[period]} period={period} /> : null}
      </div>

      {data ? (
        <CadenceDots cadence={data} period={period} />
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
  const rows = cadenceRows(cadence, period);

  return (
    <div className="flex flex-col gap-2.5">
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
  );
}

function CadenceDotView({ dot }: { dot: CadenceCell }) {
  if (dot.state === "none" || dot.label == null) return <span className="aspect-square" />;

  return (
    <Tooltip closeDelay={0} delay={250}>
      <Tooltip.Trigger
        aria-label={dot.label}
        className="flex aspect-square cursor-help rounded-full"
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
}

function CadenceTip({ label }: { label: string }) {
  return (
    <Tooltip.Content showArrow className="px-2 py-1 text-xs" placement="top" shouldFlip>
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
