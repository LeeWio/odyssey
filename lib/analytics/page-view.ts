const SESSION_KEY = "odyssey.analytics.session";
const DEDUPE_PREFIX = "odyssey.analytics.seen:";
const DEDUPE_MS = 30 * 60 * 1000;

function sessionId(): string {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

function recentlySent(path: string): boolean {
  const key = DEDUPE_PREFIX + path;
  const previous = Number(window.sessionStorage.getItem(key) ?? 0);
  if (Number.isFinite(previous) && Date.now() - previous < DEDUPE_MS) return true;
  window.sessionStorage.setItem(key, String(Date.now()));
  return false;
}

/** Reports one real navigation. API polls and prefetches do not call this. */
export function reportPageView(path: string) {
  if (typeof window === "undefined" || !path.startsWith("/") || path.startsWith("/api/")) return;
  if (recentlySent(path)) return;

  const body = JSON.stringify({
    path,
    referrer: document.referrer || null,
    title: document.title || null,
  });
  void fetch("/api/v1/public/analytics/pageviews", {
    body,
    credentials: "include",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-analytics-session": sessionId(),
      "x-odyssey-client-ua": navigator.userAgent,
    },
    keepalive: true,
    method: "POST",
  }).catch(() => {
    window.sessionStorage.removeItem(DEDUPE_PREFIX + path);
  });
}
