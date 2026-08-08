export const COLUMN_GAP_PX = 16;
export const MIN_COLUMN_WIDTH_PERCENT = 15;

const WIDTH_PRECISION = 2;

export function createEqualColumnWidths(count: number): number[] {
  if (count < 1) {
    return [];
  }

  const width = Number((100 / count).toFixed(WIDTH_PRECISION));
  const widths = Array.from({ length: count }, () => width);
  widths[count - 1] = Number((100 - width * (count - 1)).toFixed(WIDTH_PRECISION));

  return widths;
}

export function normalizeColumnWidths(value: unknown, count: number): number[] {
  const equalWidths = createEqualColumnWidths(count);

  if (!Array.isArray(value) || value.length !== count) {
    return equalWidths;
  }

  const widths = value.map(Number);
  const total = widths.reduce((sum, width) => sum + width, 0);

  if (widths.some((width) => !Number.isFinite(width) || width <= 0) || total <= 0) {
    return equalWidths;
  }

  const normalized = widths.map((width) =>
    Number(((width / total) * 100).toFixed(WIDTH_PRECISION))
  );
  normalized[count - 1] = Number(
    (100 - normalized.slice(0, -1).reduce((sum, width) => sum + width, 0)).toFixed(WIDTH_PRECISION)
  );

  return normalized.some((width) => width < MIN_COLUMN_WIDTH_PERCENT) ? equalWidths : normalized;
}

export function isValidColumnWidths(value: unknown, count: number): value is number[] {
  if (!Array.isArray(value) || value.length !== count) return false;

  const widths = value.map(Number);
  const total = widths.reduce((sum, width) => sum + width, 0);

  return (
    total > 0 &&
    widths.every(
      (width) =>
        Number.isFinite(width) && width > 0 && (width / total) * 100 >= MIN_COLUMN_WIDTH_PERCENT
    )
  );
}

export function parseColumnWidths(value: string | null, count: number): number[] {
  return normalizeColumnWidths(value?.split(",") ?? null, count);
}

export function serializeColumnWidths(widths: number[]): string {
  return widths.map((width) => Number(width.toFixed(WIDTH_PRECISION))).join(",");
}

export function getColumnGridTemplate(widths: number[]): string {
  return widths.map((width) => `${width}fr`).join(" ");
}

export function resizeAdjacentColumns(
  widths: number[],
  dividerIndex: number,
  deltaPercent: number
): number[] {
  const next = [...widths];
  const combinedWidth = next[dividerIndex] + next[dividerIndex + 1];
  const leftWidth = Math.min(
    combinedWidth - MIN_COLUMN_WIDTH_PERCENT,
    Math.max(MIN_COLUMN_WIDTH_PERCENT, next[dividerIndex] + deltaPercent)
  );

  next[dividerIndex] = Number(leftWidth.toFixed(WIDTH_PRECISION));
  next[dividerIndex + 1] = Number((combinedWidth - leftWidth).toFixed(WIDTH_PRECISION));

  return next;
}

export function areEqualColumnWidths(widths: number[]): boolean {
  const equalWidths = createEqualColumnWidths(widths.length);

  return widths.every((width, index) => Math.abs(width - equalWidths[index]) < 0.01);
}
