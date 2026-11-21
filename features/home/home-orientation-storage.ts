export const HOME_ORIENTATION_COOKIE = "odyssey_home_orientation_dismissed";

export function dismissHomeOrientation(
  target: Pick<Document, "cookie"> | null | undefined = globalThis.document
): void {
  if (!target) return;

  try {
    target.cookie = `${HOME_ORIENTATION_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    // Private mode or blocked storage should not break the page.
  }
}
