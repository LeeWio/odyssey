export const MIN_COLUMN_WIDTH_PERCENT = 15;

const WIDTH_PRECISION = 2;

export const COLUMN_LAYOUT_PRESETS = ["equal", "left", "center", "right"] as const;

export type ColumnLayoutPreset = (typeof COLUMN_LAYOUT_PRESETS)[number];

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

export function areEqualColumnWidths(widths: number[]): boolean {
  const equalWidths = createEqualColumnWidths(widths.length);

  return widths.every((width, index) => Math.abs(width - equalWidths[index]) < 0.01);
}

export function getColumnLayoutPresetWidths(
  count: 2 | 3,
  preset: ColumnLayoutPreset
): number[] | null {
  if (preset === "equal") {
    return createEqualColumnWidths(count);
  }

  if (count === 2) {
    if (preset === "left") return [65, 35];
    if (preset === "right") return [35, 65];

    return null;
  }

  if (preset === "left") return [50, 25, 25];
  if (preset === "center") return [25, 50, 25];
  if (preset === "right") return [25, 25, 50];

  return null;
}

export function getActiveColumnLayoutPreset(widths: number[]): ColumnLayoutPreset | null {
  const count = widths.length;

  if (count !== 2 && count !== 3) return null;

  return (
    COLUMN_LAYOUT_PRESETS.find((preset) => {
      const presetWidths = getColumnLayoutPresetWidths(count, preset);

      return presetWidths?.every((width, index) => Math.abs(width - widths[index]) < 0.01) ?? false;
    }) ?? null
  );
}
