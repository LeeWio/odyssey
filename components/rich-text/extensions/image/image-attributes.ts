export const IMAGE_MIN_WIDTH_PERCENT = 25;
export const IMAGE_MAX_WIDTH_PERCENT = 100;
export const IMAGE_WIDTH_STEP = 5;
export const IMAGE_DEFAULT_WIDTH_PERCENT = 100;

export const IMAGE_ALIGNMENTS = ["left", "center", "right"] as const;

export type ImageAlignment = (typeof IMAGE_ALIGNMENTS)[number];

export function normalizeImageWidthPercent(value: unknown): number {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) return IMAGE_DEFAULT_WIDTH_PERCENT;

  const steppedValue = Math.round(numericValue / IMAGE_WIDTH_STEP) * IMAGE_WIDTH_STEP;
  return Math.min(IMAGE_MAX_WIDTH_PERCENT, Math.max(IMAGE_MIN_WIDTH_PERCENT, steppedValue));
}

export function normalizeImageAlignment(value: unknown): ImageAlignment {
  return IMAGE_ALIGNMENTS.includes(value as ImageAlignment) ? (value as ImageAlignment) : "center";
}
