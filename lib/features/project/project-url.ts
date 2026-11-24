export function toSafeProjectUrl(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;

    if (url.hostname === "github.com" && /^\/yourusername(?:\/|$)/i.test(url.pathname)) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}
