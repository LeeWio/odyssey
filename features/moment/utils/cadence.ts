import type { MomentCadenceResponse } from "@/lib/features/moment";

export type CadenceDot = "filled" | "empty" | "none";
export type CadencePeriod = "day" | "month" | "year";

const COLUMNS = { day: 12, month: 12, year: 12 } as const;

export function cadenceRows(cadence: MomentCadenceResponse, period: CadencePeriod): CadenceDot[][] {
  const cells = cadenceCells(cadence, period);
  const columns = COLUMNS[period];
  return Array.from({ length: Math.ceil(cells.length / columns) }, (_, row) =>
    cells.slice(row * columns, row * columns + columns)
  );
}

export function cadenceProgress(rows: CadenceDot[][]) {
  const counted = rows.flat().filter((dot) => dot !== "none");
  return {
    total: counted.length,
    value: counted.filter((dot) => dot === "filled").length,
  };
}

function cadenceCells(cadence: MomentCadenceResponse, period: CadencePeriod): CadenceDot[] {
  if (period === "month") {
    const days = Array.from({ length: cadence.month.days }, (_, day) =>
      dot(cadence.month.active, day)
    );
    const cells = [...Array.from({ length: cadence.month.offset }, () => "none" as const), ...days];
    const remainder = cells.length % COLUMNS.month;
    return remainder === 0
      ? cells
      : [...cells, ...Array.from({ length: COLUMNS.month - remainder }, () => "none" as const)];
  }

  const total = period === "day" ? 24 : 48;
  const active = cadence[period].active;
  return Array.from({ length: total }, (_, bucket) => dot(active, bucket));
}

function dot(active: number[], bucket: number): CadenceDot {
  return active.includes(bucket) ? "filled" : "empty";
}
