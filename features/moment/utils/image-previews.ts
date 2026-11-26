import { getImageProps } from "next/image";
import type { MomentImageResponse } from "@/lib/features/moment";

export interface MomentImagePreview {
  url: string;
  originalUrl?: string;
  alt?: string | null;
  width?: number;
  height?: number;
}

export function getMomentImagePreviews(
  images: readonly MomentImageResponse[] = []
): MomentImagePreview[] {
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

export function getMomentPhotoSource(src: string, sizes?: string) {
  // The same-origin Nexus file route can use Next's image cache. Other media
  // still loads directly, including assets on hosts outside our allowlist.
  if (!/^\/api\/v1\/public\/files\/[^/?#]+$/.test(src)) return { src };

  const { props } = getImageProps({ src, alt: "", width: 320, height: 320, sizes });
  return sizes ? { src: props.src, srcSet: props.srcSet, sizes: props.sizes } : { src: props.src };
}
