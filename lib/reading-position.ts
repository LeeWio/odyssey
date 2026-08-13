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
