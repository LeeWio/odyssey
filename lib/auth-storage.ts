/**
 * Auth credentials persist in localStorage for seven days by default.
 * XSS can still read localStorage while the page is open — httpOnly cookies
 * remain the end state.
 */
export const AUTH_STORAGE_KEY = "odyssey_auth";
export const AUTH_PERSISTENCE_MS = 7 * 24 * 60 * 60 * 1000;

type PersistedAuth = {
  persistedAt?: unknown;
};

function parsePersistedAt(value: string): number | null {
  try {
    const parsed = JSON.parse(value) as PersistedAuth;
    return typeof parsed.persistedAt === "number" && Number.isFinite(parsed.persistedAt)
      ? parsed.persistedAt
      : null;
  } catch {
    return null;
  }
}

export function readAuthStorage(now = Date.now()): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const persistedAt = parsePersistedAt(stored);
    // Sessions written before the seven-day deadline have no timestamp.
    if (persistedAt !== null && now - persistedAt >= AUTH_PERSISTENCE_MS) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

export function writeAuthStorage(value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, value);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Quota / private mode — session continues in memory via Redux.
  }
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
