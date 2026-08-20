"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Modal } from "@heroui/react";
import { Carousel } from "@heroui-pro/react/carousel";
import type { EmblaCarouselType } from "embla-carousel";

interface CarouselModalProps {
  images: { src: string; alt: string }[];
  activeIndex: number | null;
  onClose: () => void;
}

export const CarouselModal = ({ images, activeIndex, onClose }: CarouselModalProps) => {
  const [carouselApi, setCarouselApi] = useState<EmblaCarouselType>();

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
          <Modal.Dialog aria-label="Image viewer">
            <Modal.CloseTrigger className="z-50" />
            <Modal.Body>
              <Carousel opts={{ loop: true }} setApi={setCarouselApi}>
                <Carousel.Content>
                  {images.map((image, i) => (
                    <Carousel.Item key={i}>
                      <div className="relative aspect-square w-full overflow-hidden rounded-3xl">
                        <Image
                          alt={image.alt}
                          className="object-cover select-none"
                          draggable={false}
                          src={image.src}
                          fill
                          unoptimized
                        />
                      </div>
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
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
