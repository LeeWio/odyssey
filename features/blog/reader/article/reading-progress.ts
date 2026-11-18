import type { TableOfContentData } from "@tiptap/extension-table-of-contents";

import { currentHeadingId } from "./article-outline";

export const READING_PROGRESS_STEP = 10;

export interface ReadingCheckpoint {
  postId: number;
  progressPercent: number;
  positionAnchor?: string;
}

/** Collapse a scroll percentage onto the 10-point steps the library stores. */
export function quantizeReadingProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0;
  const bounded = Math.min(100, Math.max(0, progress));
  return Math.min(100, Math.round(bounded / READING_PROGRESS_STEP) * READING_PROGRESS_STEP);
}

/** The heading in view, stored without a hash so library links can add one. */
export function readingPositionAnchor(items: TableOfContentData): string | undefined {
  if (items.length === 0 || typeof document === "undefined") return undefined;
  const id = currentHeadingId(items);
  return id || undefined;
}

/**
 * A checkpoint is worth sending when the step changed, or the same step moved
 * to another heading. Repeating the stored step does not.
 */
export function shouldReportReadingProgress(
  sent: ReadingCheckpoint | null,
  next: ReadingCheckpoint
) {
  if (!sent || sent.postId !== next.postId) return true;
  if (sent.progressPercent !== next.progressPercent) return true;
  return sent.positionAnchor !== next.positionAnchor;
}
