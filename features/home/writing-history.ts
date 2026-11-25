import { z } from "zod";

export const publicWritingArchiveSchema = z.object({
  totalPublishedCount: z.number().int().nonnegative(),
  archives: z.array(
    z.object({
      year: z.number().int().min(1).max(9999),
      month: z.number().int().min(1).max(12),
      count: z.number().int().positive(),
    })
  ),
});

type ArchiveMonth = z.infer<typeof publicWritingArchiveSchema>["archives"][number];

export type WritingMonth = {
  id: string;
  total: number;
};

export function buildWritingHistory(archives: readonly ArchiveMonth[], now = new Date()) {
  const current = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const counts = new Map<number, number>();

  for (const { year, month, count } of archives) {
    const index = year * 12 + month - 1;
    if (index > current) continue;

    counts.set(index, count);
  }

  if (counts.size === 0) return [];

  const start = current - 11;
  let total = 0;
  for (const [index, count] of counts) {
    if (index < start) total += count;
  }

  const months: WritingMonth[] = [];
  for (let index = start; index <= current; index++) {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    total += counts.get(index) ?? 0;
    months.push({ id: `${year}-${String(month).padStart(2, "0")}`, total });
  }

  return months;
}
