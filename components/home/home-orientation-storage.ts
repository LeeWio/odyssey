export const HOME_ORIENTATION_STORAGE_KEY = "odyssey_home_orientation_dismissed";

export function isHomeOrientationDismissed(
  storage: Pick<Storage, "getItem"> | null | undefined = globalThis.localStorage
): boolean {
  if (!storage) return false;

  try {
    return storage.getItem(HOME_ORIENTATION_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissHomeOrientation(
  storage: Pick<Storage, "setItem"> | null | undefined = globalThis.localStorage
): void {
  if (!storage) return;

  try {
    storage.setItem(HOME_ORIENTATION_STORAGE_KEY, "1");
  } catch {
    // Private mode or blocked storage should not break the page.
  }
}
