"use client";

import { Button, Skeleton } from "@heroui/react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DeferredContent } from "@/components/layout/deferred-content";
import type { MomentImagePreview } from "../../utils/image-previews";
import { NaturalImage } from "./natural-image";

const CircularGallery = dynamic(() => import("@/components/ui/circular-gallery"), {
  ssr: false,
  loading: GalleryPlaceholder,
});

function GalleryPlaceholder() {
  return <Skeleton className="h-full w-full" aria-hidden />;
}

interface MomentPhotosProps {
  images: MomentImagePreview[];
  onOpen?: (index: number) => void;
}

export function MomentPhotos({ images, onOpen }: MomentPhotosProps) {
  const t = useTranslations("Moments");
  const [galleryUnavailable, setGalleryUnavailable] = useState(false);
  const count = images.length;

  if (count === 0) return null;

  if (count >= 4 && onOpen && !galleryUnavailable) {
    return (
      <DeferredContent className="h-80 w-full" fallback={<GalleryPlaceholder />}>
        <CircularGallery
          expandOnOpen
          items={images.map(({ url, originalUrl, alt }) => ({
            image: url,
            originalImage: originalUrl,
            alt: alt || t("imageAlt"),
          }))}
          onUnavailable={() => setGalleryUnavailable(true)}
        />
      </DeferredContent>
    );
  }

  return (
    <div className={count >= 4 ? "grid min-w-0 grid-cols-2 gap-3" : "grid min-w-0 gap-3"}>
      {images.map(({ url, alt, width, height }, index) => (
        <div key={`${url}-${index}`} className="relative isolate min-w-0">
          {onOpen ? (
            <Button
              aria-label={t("openImage", { index: index + 1, total: count })}
              className="absolute inset-0 h-full w-full"
              variant="ghost"
              onPress={() => onOpen(index)}
            />
          ) : null}
          <NaturalImage
            src={url}
            alt={alt || t("imageAlt")}
            width={width}
            height={height}
            interactive={Boolean(onOpen)}
            bounded={count === 1}
          />
        </div>
      ))}
    </div>
  );
}
