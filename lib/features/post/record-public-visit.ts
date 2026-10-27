import { CLIENT_USER_AGENT_HEADER } from "@/lib/api/client-device";

const recorded = new Set<string>();

/** Counts an anonymous page view with the browser User-Agent. */
export function recordPublicVisit(path: string) {
  if (recorded.has(path) || typeof navigator === "undefined") return;
  recorded.add(path);
  void fetch(path, {
    credentials: "omit",
    headers: {
      accept: "application/json",
      [CLIENT_USER_AGENT_HEADER]: navigator.userAgent,
    },
    keepalive: true,
  }).catch(() => {
    recorded.delete(path);
  });
}
