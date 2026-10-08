function decodeAnchor(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

const LEGACY_ARTICLE_POSITION_PATTERN = /^article-\d+$/;

export function getReadingPositionId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;

  const id = value.startsWith("#") ? decodeAnchor(value.slice(1)) : value;
  if (id && !value.startsWith("#") && !LEGACY_ARTICLE_POSITION_PATTERN.test(id)) return null;
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
}

const READING_PROGRESS_STORAGE_KEY = "odyssey_reading_progress";

export function readPendingReadingProgress(postId: number): PendingReadingProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(READING_PROGRESS_STORAGE_KEY);
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
      typeof record.positionAnchor !== "string"
    ) {
      return null;
    }

    return {
      postId,
      progressPercent: record.progressPercent,
      positionAnchor: record.positionAnchor,
    };
  } catch {
    return null;
  }
}

export function writePendingReadingProgress(progress: PendingReadingProgress) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(READING_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private mode can reject storage. The in-memory retry still runs.
  }
}

export function clearPendingReadingProgress(postId: number) {
  if (typeof window === "undefined") return;
  const pending = readPendingReadingProgress(postId);
  if (!pending) return;
  try {
    sessionStorage.removeItem(READING_PROGRESS_STORAGE_KEY);
  } catch {
    // Ignore storage failures; the successful request is already recorded.
  }
}
