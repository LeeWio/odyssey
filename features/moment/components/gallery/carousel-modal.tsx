"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { Modal } from "@heroui/react";
import { Segment } from "@heroui-pro/react";
import { Carousel } from "@heroui-pro/react/carousel";
import type { EmblaCarouselType } from "embla-carousel";
import { useTranslations } from "next-intl";
import { useAnimate } from "motion/react";

import { RemoteMedia } from "@/components/ui/remote-media";
import { pageEaseOut } from "@/lib/motion";
import { useMomentMotion } from "../feed-motion";

interface CarouselModalProps {
  images: { src: string; alt: string }[];
  activeIndex: number | null;
  onClose: () => void;
}

type ViewerMode = "fit" | "width";

function ViewerImage({ alt, src }: { alt: string; src: string }) {
  return (
    <div className="relative h-[min(85dvh,52rem)] w-full overflow-hidden rounded-2xl">
      <Image
        alt={alt}
        className="pointer-events-none object-contain select-none"
        draggable={false}
        fill
        sizes="100vw"
        src={src}
        unoptimized
      />
    </div>
  );
}

function SingleViewerImage({
  image,
  mode,
}: {
  image: { src: string; alt: string };
  mode: ViewerMode;
}) {
  const t = useTranslations("Moments");
  const { enabled, reduced } = useMomentMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const previousMode = useRef(mode);

  useLayoutEffect(() => {
    scope.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [mode, image.src, scope]);

  useEffect(() => {
    const changed = previousMode.current !== mode;
    previousMode.current = mode;
    if (!scope.current) return;
    const duration = enabled && !reduced && changed ? 0.12 : 0;
    const animation = animate(
      scope.current,
      { opacity: [duration ? 0.75 : 1, 1] },
      { duration, ease: pageEaseOut }
    );
    return () => animation.stop();
  }, [animate, enabled, mode, reduced, scope]);

  return (
    <div
      ref={scope}
      role="region"
      aria-label={t("viewerImageRegion")}
      tabIndex={mode === "width" ? 0 : -1}
      data-slot="moment-single-image-viewer"
      data-mode={mode}
      className="focus-visible:outline-focus relative h-[min(70svh,48rem)] min-h-0 flex-auto scrollbar-none overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg outline-offset-[-2px] focus-visible:outline-2"
    >
      <RemoteMedia
        src={image.src}
        alt={image.alt}
        loading="eager"
        draggable={false}
        className={
          mode === "fit"
            ? "pointer-events-none absolute inset-0 m-auto block h-auto max-h-full w-auto max-w-full object-contain select-none"
            : "pointer-events-none mx-auto block h-auto w-auto max-w-full select-none"
        }
      />
    </div>
  );
}

export const CarouselModal = ({ images, activeIndex, onClose }: CarouselModalProps) => {
  const t = useTranslations("Moments");
  const [carouselApi, setCarouselApi] = useState<EmblaCarouselType>();
  const [mode, setMode] = useState<ViewerMode>("fit");
  const singleImage = images.length === 1 ? images[0] : undefined;

  useEffect(() => {
    if (activeIndex !== null && carouselApi) {
      carouselApi.scrollTo(activeIndex, true);
    }
  }, [activeIndex, carouselApi]);

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={activeIndex !== null}
        onOpenChange={(open) => !open && onClose()}
        variant="blur"
      >
        <Modal.Container size="cover">
          <Modal.Dialog
            aria-label={t("imageViewer")}
            className={singleImage ? "p-3 sm:p-5" : undefined}
          >
            <Modal.CloseTrigger className="z-20" />
            {singleImage ? (
              <Modal.Header className="shrink-0 flex-row items-center pr-10">
                <Segment
                  aria-label={t("viewerMode")}
                  selectedKey={mode}
                  size="sm"
                  onSelectionChange={(key) => {
                    if (key === "fit" || key === "width") setMode(key);
                  }}
                >
                  <Segment.Item id="fit">{t("viewerFit")}</Segment.Item>
                  <Segment.Item id="width">{t("viewerRead")}</Segment.Item>
                </Segment>
              </Modal.Header>
            ) : null}
            <Modal.Body
              className={
                singleImage ? "flex scrollbar-none flex-col overflow-hidden" : "scrollbar-none"
              }
            >
              {singleImage ? (
                <SingleViewerImage image={singleImage} mode={mode} />
              ) : (
                <Carousel opts={{ loop: true }} setApi={setCarouselApi}>
                  <Carousel.Content>
                    {images.map((image, i) => (
                      <Carousel.Item key={i}>
                        <ViewerImage alt={image.alt} src={image.src} />
                      </Carousel.Item>
                    ))}
                  </Carousel.Content>
                  <Carousel.Previous />
                  <Carousel.Next />
                  <Carousel.Dots />
                  <Carousel.Thumbnails>
                    {images.map((image, i) => (
                      <Carousel.Thumbnail key={i} alt={image.alt} index={i} src={image.src} />
                    ))}
                  </Carousel.Thumbnails>
                </Carousel>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
