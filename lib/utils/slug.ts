/** Matches nexus `SlugValidator`: `^[a-z0-9]+(?:-[a-z0-9]+)*$` */
const URL_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Convert a display name into a URL-safe slug. */
export function toUrlSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidUrlSlug(value: string): boolean {
  return URL_SLUG_PATTERN.test(value);
}

/** Form helper: distinguish empty vs invalid character set. */
export function validateUrlSlug(value: string): string | null {
  const slug = value.trim();
  if (!slug) return "Slug is required";
  if (!isValidUrlSlug(slug)) {
    return "Slug must only contain lowercase letters, numbers, and hyphens";
  }
  return null;
}
