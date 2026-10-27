/** Header carrying the browser User-Agent through the Next.js API rewrite. */
export const CLIENT_USER_AGENT_HEADER = "x-odyssey-client-ua";

/** Marks a Next.js data prefetch so the API does not count it as a visit. */
export const SERVER_PREFETCH_HEADER = "x-odyssey-prefetch";

export function clientUserAgentHeader(): Record<string, string> | undefined {
  if (typeof navigator === "undefined" || !navigator.userAgent) return undefined;
  return { [CLIENT_USER_AGENT_HEADER]: navigator.userAgent };
}
