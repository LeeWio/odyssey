const MAX_WEBSITE_LENGTH = 100;

/** Keep only a public http(s) URL that can be opened in a new tab. */
export function publicWebsiteHref(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (withScheme.length > MAX_WEBSITE_LENGTH) return null;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
