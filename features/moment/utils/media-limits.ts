export const MOMENT_MAX_IMAGES = 9;
export const MOMENT_MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MOMENT_ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
export const MOMENT_IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";

export function defaultMomentAltText(fileName: string): string {
  const cleaned = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return cleaned || "Moment Attachment";
}

/** Returns an error message when the file is rejected, otherwise null. */
export function validateMomentImageFile(file: File): string | null {
  if (!MOMENT_ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return `${file.name} must be JPEG, PNG, GIF, or WebP.`;
  }
  if (file.size > MOMENT_MAX_IMAGE_SIZE) {
    return `${file.name} must be 10 MB or smaller.`;
  }
  return null;
}
