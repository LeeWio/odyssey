function storageKey(username: string) {
  return `moments_bookmarks:${username}`;
}

export function readLegacyMomentBookmarks(username: string) {
  try {
    const snapshot = localStorage.getItem(storageKey(username));
    const parsed: unknown = JSON.parse(snapshot ?? "[]");
    const ids = Array.isArray(parsed)
      ? [...new Set(parsed.filter((id): id is number => Number.isSafeInteger(id) && id > 0))]
      : [];
    return { snapshot, ids };
  } catch {
    return { snapshot: null, ids: [] };
  }
}

export function clearImportedMomentBookmarks(username: string, snapshot: string) {
  try {
    const key = storageKey(username);
    if (localStorage.getItem(key) === snapshot) localStorage.removeItem(key);
  } catch {
    // The account copy has been imported. Repeating the import is harmless.
  }
}
