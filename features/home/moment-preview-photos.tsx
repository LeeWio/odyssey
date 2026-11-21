"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MomentPhotos } from "@/features/moment/components/card/moment-photos";
import type { MomentImagePreview } from "@/features/moment/utils/image-previews";

const CarouselModal = dynamic(
  () =>
    import("@/features/moment/components/gallery/carousel-modal").then((mod) => mod.CarouselModal),
  { ssr: false }
);

export function MomentPreviewPhotos({ images }: { images: MomentImagePreview[] }) {
  const t = useTranslations("Moments");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hasOpenedViewer, setHasOpenedViewer] = useState(false);

  return (
    <>
      <MomentPhotos
        images={images}
        onOpen={(index) => {
          setHasOpenedViewer(true);
          setActiveIndex(index);
        }}
      />
      {hasOpenedViewer ? (
        <CarouselModal
          activeIndex={activeIndex}
          images={images.map(({ url, originalUrl, alt }) => ({
            src: originalUrl ?? url,
            alt: alt || t("imageAlt"),
          }))}
          onClose={() => setActiveIndex(null)}
        />
      ) : null}
    </>
  );
}
