const EVENT = "moments_bookmarks_changed";

function storageKey(username: string) {
  return `moments_bookmarks:${username}`;
}

export function readMomentBookmarks(username: string | null) {
  if (!username || typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(username)) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

export function toggleMomentBookmark(username: string, id: number) {
  const current = readMomentBookmarks(username);
  const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
  localStorage.setItem(storageKey(username), JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
  return next.includes(id);
}

export function subscribeMomentBookmarks(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
