/**
 * Stash files from FileHandler drops so an `imageUpload` node can auto-start
 * uploading without embedding File objects in the document JSON.
 */
const pendingImageFiles = new Map<string, File>();
let nextKey = 0;

export function stashPendingImageFile(file: File): string {
  nextKey += 1;
  const key = `image-file-${Date.now()}-${nextKey}`;
  pendingImageFiles.set(key, file);
  return key;
}

export function takePendingImageFile(key: string | null | undefined): File | null {
  if (!key) return null;
  const file = pendingImageFiles.get(key) ?? null;
  if (file) pendingImageFiles.delete(key);
  return file;
}

export function discardPendingImageFile(key: string | null | undefined) {
  if (key) pendingImageFiles.delete(key);
}
