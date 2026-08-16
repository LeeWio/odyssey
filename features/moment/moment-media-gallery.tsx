"use client";

import { Carousel } from "@heroui-pro/react/carousel";
import { Button, Modal, Typography } from "@heroui/react";
import type { EmblaCarouselType } from "embla-carousel";
import { useEffect, useMemo, useState } from "react";

import type { MomentImageResponse } from "@/lib/features/moment";

interface MomentMediaGalleryProps {
  images: MomentImageResponse[];
  portalContainer?: Element;
}

function gridClassName(count: number) {
  if (count === 1) return "grid-cols-1";
  if (count === 2 || count === 4) return "grid-cols-2";
  return "grid-cols-3";
}

function itemClassName(count: number, index: number) {
  if (count === 1) return "aspect-[16/10]";
  if (count === 2 || count === 4) return "aspect-square";
  if (count === 3 && index === 0) return "col-span-2 row-span-2 aspect-auto min-h-52";
  return "aspect-square";
}

export function MomentMediaGallery({ images, portalContainer }: MomentMediaGalleryProps) {
  const orderedImages = useMemo(
    () => [...images].sort((first, second) => first.sortOrder - second.sortOrder),
    [images]
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [carouselApi, setCarouselApi] = useState<EmblaCarouselType>();

  useEffect(() => {
    if (activeIndex !== null && carouselApi) carouselApi.scrollTo(activeIndex, true);
  }, [activeIndex, carouselApi]);

  if (orderedImages.length === 0) return null;

  return (
    <>
      <div
        className={`grid max-w-2xl gap-1.5 overflow-hidden rounded-2xl ${gridClassName(orderedImages.length)}`}
      >
        {orderedImages.map((image, index) => (
          <Button
            key={image.id}
            aria-label={`Open image ${index + 1} of ${orderedImages.length}: ${image.altText}`}
            className={`group/image relative h-auto min-w-0 overflow-hidden rounded-none p-0 first:rounded-tl-2xl last:rounded-br-2xl ${itemClassName(orderedImages.length, index)}`}
            variant="ghost"
            onPress={() => setActiveIndex(index)}
          >
            {/* Dynamic uploaded URLs are served by Nexus and cannot be statically allow-listed. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={image.altText}
              className="size-full object-cover transition-transform duration-300 group-hover/image:scale-[1.02]"
              height={image.height ?? undefined}
              loading="lazy"
              src={image.thumbnailUrl || image.fileUrl}
              width={image.width ?? undefined}
            />
          </Button>
        ))}
      </div>

      <Modal>
        <Modal.Backdrop
          isOpen={activeIndex !== null}
          onOpenChange={(open) => !open && setActiveIndex(null)}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer}
        >
          <Modal.Container>
            <Modal.Dialog
              aria-label="Moment image viewer"
              className="max-h-[92dvh] max-w-5xl overflow-hidden bg-black p-0"
            >
              <Modal.CloseTrigger className="z-20 text-white" />
              <Modal.Body className="p-0">
                <Carousel
                  setApi={setCarouselApi}
                  opts={{ loop: orderedImages.length > 1 }}
                  className="w-full"
                >
                  <Carousel.Content>
                    {orderedImages.map((image) => (
                      <Carousel.Item key={image.id}>
                        <figure className="flex min-h-[60dvh] flex-col items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={image.altText}
                            className="max-h-[78dvh] w-full object-contain"
                            height={image.height ?? undefined}
                            src={image.fileUrl}
                            width={image.width ?? undefined}
                          />
                          <figcaption className="w-full bg-black/80 px-6 py-4 text-center">
                            <Typography className="text-white/80" type="body-sm">
                              {image.altText}
                            </Typography>
                          </figcaption>
                        </figure>
                      </Carousel.Item>
                    ))}
                  </Carousel.Content>
                  {orderedImages.length > 1 ? (
                    <>
                      <Carousel.Previous className="left-4" />
                      <Carousel.Next className="right-4" />
                      <Carousel.Dots className="absolute bottom-16 left-1/2 -translate-x-1/2" />
                    </>
                  ) : null}
                </Carousel>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
