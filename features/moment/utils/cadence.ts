import type { MomentCadenceResponse } from "@/lib/features/moment";

export type CadenceDot = "filled" | "empty" | "none";
export type CadencePeriod = "day" | "month" | "year";

export interface CadenceCell {
  state: CadenceDot;
  label: string | null;
}

const COLUMNS = { day: 12, month: 12, year: 12 } as const;

export function cadenceRows(
  cadence: MomentCadenceResponse,
  period: CadencePeriod
): CadenceCell[][] {
  const cells = cadenceCells(cadence, period);
  const columns = COLUMNS[period];
  return Array.from({ length: Math.ceil(cells.length / columns) }, (_, row) =>
    cells.slice(row * columns, row * columns + columns)
  );
}

export function cadenceProgress(rows: CadenceCell[][]) {
  const counted = rows.flat().filter((cell) => cell.state !== "none");
  return {
    total: counted.length,
    value: counted.filter((cell) => cell.state === "filled").length,
  };
}

function cadenceCells(cadence: MomentCadenceResponse, period: CadencePeriod): CadenceCell[] {
  if (period === "month") {
    const [year = 0, month = 1] = cadence.month.start.split("-").map(Number);
    const days = Array.from({ length: cadence.month.days }, (_, day) =>
      cell(cadence.month.active, day, monthLabel(year, month, day + 1))
    );
    const cells = [...Array.from({ length: cadence.month.offset }, blank), ...days];
    const remainder = cells.length % COLUMNS.month;
    return remainder === 0
      ? cells
      : [...cells, ...Array.from({ length: COLUMNS.month - remainder }, blank)];
  }

  if (period === "day") {
    return Array.from({ length: 24 }, (_, hour) => cell(cadence.day.active, hour, hourLabel(hour)));
  }

  return Array.from({ length: 48 }, (_, bucket) =>
    cell(cadence.year.active, bucket, weekLabel(cadence.year.year, bucket))
  );
}

function cell(active: number[], bucket: number, label: string): CadenceCell {
  return { state: active.includes(bucket) ? "filled" : "empty", label };
}

function blank(): CadenceCell {
  return { state: "none", label: null };
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00–${String(hour + 1).padStart(2, "0")}:00`;
}

function monthLabel(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function weekLabel(year: number, bucket: number) {
  const month = Math.floor(bucket / 4) + 1;
  const week = (bucket % 4) + 1;
  const start = (week - 1) * 7 + 1;
  const end = week === 4 ? new Date(year, month, 0).getDate() : week * 7;
  return `${monthLabel(year, month, start)} – ${monthLabel(year, month, end)}`;
}
