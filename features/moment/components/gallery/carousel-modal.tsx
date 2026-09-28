"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Selection } from "@heroui/react";
import { Button, Dropdown, Header, Label, Modal } from "@heroui/react";
import { Carousel } from "@heroui-pro/react/carousel";
import type { EmblaCarouselType } from "embla-carousel";
import { useTranslations } from "next-intl";

interface CarouselModalProps {
  images: { src: string; alt: string }[];
  activeIndex: number | null;
  onClose: () => void;
}

const sizes = ["xs", "sm", "md", "lg", "cover", "full"] as const;
type ViewerSize = (typeof sizes)[number];

const sizeLabels = {
  cover: "viewerSizeCover",
  full: "viewerSizeFull",
  lg: "viewerSizeLg",
  md: "viewerSizeMd",
  sm: "viewerSizeSm",
  xs: "viewerSizeXs",
} as const;

export const CarouselModal = ({ images, activeIndex, onClose }: CarouselModalProps) => {
  const t = useTranslations("Moments");
  const [carouselApi, setCarouselApi] = useState<EmblaCarouselType>();
  const [size, setSize] = useState<ViewerSize>("lg");

  useEffect(() => {
    if (activeIndex !== null && carouselApi) {
      carouselApi.scrollTo(activeIndex, true);
    }
  }, [activeIndex, carouselApi]);

  const selectSize = (keys: Selection) => {
    if (keys === "all") return;
    const next = [...keys][0];
    if (typeof next === "string" && sizes.includes(next as ViewerSize)) {
      setSize(next as ViewerSize);
    }
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={activeIndex !== null}
        onOpenChange={(open) => !open && onClose()}
        variant="blur"
      >
        <Modal.Container size={size}>
          <Modal.Dialog
            aria-label="Image viewer"
            className="transition-[max-width,height,border-radius,padding] duration-300 ease-out motion-reduce:transition-none"
          >
            <div className="absolute top-4 right-4 z-50">
              <Dropdown>
                <Button aria-label={t("viewerSize")} size="sm" variant="secondary">
                  {t(sizeLabels[size])}
                </Button>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    selectedKeys={new Set([size])}
                    selectionMode="single"
                    onSelectionChange={selectSize}
                  >
                    <Dropdown.Section>
                      <Header>{t("viewerSize")}</Header>
                      {sizes.map((item) => (
                        <Dropdown.Item key={item} id={item} textValue={t(sizeLabels[item])}>
                          <Dropdown.ItemIndicator />
                          <Label>{t(sizeLabels[item])}</Label>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Section>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
            <Modal.Body>
              <Carousel opts={{ loop: true }} setApi={setCarouselApi}>
                <Carousel.Content>
                  {images.map((image, i) => (
                    <Carousel.Item key={i}>
                      <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
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
