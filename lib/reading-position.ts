function decodeAnchor(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function getReadingPositionId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;

  const id = value.startsWith("#") ? decodeAnchor(value.slice(1)) : value;
  if (!id || id.length > 500 || /[\u0000-\u001F\u007F]/.test(id)) return null;

  return id;
}

export function getReadingPositionHref(
  slug: string,
  positionAnchor: string | null | undefined
): string {
  const pathname = `/single/${encodeURIComponent(slug)}`;
  const id = getReadingPositionId(positionAnchor);

  return id ? `${pathname}#${encodeURIComponent(id)}` : pathname;
}

export interface PendingReadingProgress {
  postId: number;
  progressPercent: number;
  positionAnchor: string;
  observedAt: string;
}

const READING_PROGRESS_STORAGE_KEY = "odyssey_reading_progress";
const readingProgressStorageKey = (username: string, postId: number) =>
  `${READING_PROGRESS_STORAGE_KEY}:${encodeURIComponent(username)}:${postId}`;

export function readPendingReadingProgress(
  username: string,
  postId: number
): PendingReadingProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(readingProgressStorageKey(username, postId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    if (
      record.postId !== postId ||
      typeof record.progressPercent !== "number" ||
      !Number.isInteger(record.progressPercent) ||
      record.progressPercent < 0 ||
      record.progressPercent > 100 ||
      typeof record.positionAnchor !== "string" ||
      typeof record.observedAt !== "string" ||
      Number.isNaN(Date.parse(record.observedAt))
    ) {
      return null;
    }

    return {
      postId,
      progressPercent: record.progressPercent,
      positionAnchor: record.positionAnchor,
      observedAt: record.observedAt,
    };
  } catch {
    return null;
  }
}

export function writePendingReadingProgress(username: string, progress: PendingReadingProgress) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      readingProgressStorageKey(username, progress.postId),
      JSON.stringify(progress)
    );
  } catch {
    // Private mode can reject storage. The in-memory retry still runs.
  }
}

export function clearPendingReadingProgress(username: string, expected: PendingReadingProgress) {
  if (typeof window === "undefined") return;
  const pending = readPendingReadingProgress(username, expected.postId);
  if (
    !pending ||
    pending.postId !== expected.postId ||
    pending.progressPercent !== expected.progressPercent ||
    pending.positionAnchor !== expected.positionAnchor ||
    pending.observedAt !== expected.observedAt
  ) {
    return;
  }
  try {
    sessionStorage.removeItem(readingProgressStorageKey(username, expected.postId));
  } catch {
    // Ignore storage failures; the successful request is already recorded.
  }
}
