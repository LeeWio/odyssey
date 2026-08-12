const RELATIVE_PATH_PATTERN = /^\/(?![\\/])/;
const PAGE_ANCHOR_PATTERN = /^#[^\s]*$/;
const MAILTO_PATTERN = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const TEL_PATTERN = /^tel:[+0-9().\-\s]{3,}$/i;

function hasUnsafeCharacters(value: string): boolean {
  return /[\u0000-\u001F\u007F\s]/.test(value);
}

export function normalizeLinkUrl(value: string): string | null {
  const rawUrl = value.trim();

  if (!rawUrl || hasUnsafeCharacters(rawUrl)) return null;
  if (rawUrl.startsWith("//")) return null;
  if (RELATIVE_PATH_PATTERN.test(rawUrl) || PAGE_ANCHOR_PATTERN.test(rawUrl)) return rawUrl;
  if (MAILTO_PATTERN.test(rawUrl) || TEL_PATTERN.test(rawUrl)) return rawUrl;

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  try {
    const url = new URL(candidate);

    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return null;

    return url.toString();
  } catch {
    return null;
  }
}

export function isSafeLinkUrl(value: unknown): value is string {
  return typeof value === "string" && normalizeLinkUrl(value) !== null;
}
