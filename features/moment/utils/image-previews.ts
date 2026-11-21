import type { MomentImageResponse } from "@/lib/features/moment";

export function getMomentImagePreviews(images: readonly MomentImageResponse[] = []) {
  return images.slice(0, 8).map((image) => {
    const hasDimensions = (image.width ?? 0) > 0 && (image.height ?? 0) > 0;
    return {
      url: image.thumbnailUrl || image.fileUrl,
      originalUrl:
        image.thumbnailUrl && image.thumbnailUrl !== image.fileUrl ? image.fileUrl : undefined,
      alt: image.altText,
      width: hasDimensions ? (image.width ?? undefined) : undefined,
      height: hasDimensions ? (image.height ?? undefined) : undefined,
    };
  });
}
