/**
 * Auth credentials live in sessionStorage (tab-scoped), not localStorage.
 * This shrinks the persistence window on shared devices. XSS can still read
 * sessionStorage while the page is open — httpOnly cookies remain the end state.
 */
export const AUTH_STORAGE_KEY = "odyssey_auth";

export function readAuthStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) ?? localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeAuthStorage(value: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, value);
    // Migrate away from the previous localStorage location.
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
