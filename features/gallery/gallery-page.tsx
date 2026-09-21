"use client";

import { pageEaseOut } from "@/lib/motion";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import Image from "next/image";
import type { EmblaCarouselType } from "embla-carousel";
import { Carousel } from "@heroui-pro/react/carousel";
import { Button, Card, Chip, Modal, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";

// Real artist portfolio assets mapping
const GALLERY_ITEMS = [
  {
    src: "/IMG_4958.WEBP",
    alt: "Silent Snowfall over the Peaks",
    title: "Silent Snowfall over the Peaks",
    location: "Mount Rainier, WA",
    camera: "Hasselblad 500C/M",
    film: "Kodak Portra 400",
    description:
      "Capturing the stillness of early morning clouds rolling over glaciers, highlighting geometry and quiet weather boundaries.",
  },
  {
    src: "/IMG_5332.JPG",
    alt: "Urban Geometry & Intersections",
    title: "Urban Geometry & Intersections",
    location: "Shinjuku, Tokyo",
    camera: "Hasselblad 500C/M",
    film: "Ilford HP5 Plus 400",
    description:
      "Dissecting clean lines, stark shadows, and architectural leading lines in the Tokyo high-rise district.",
  },
  {
    src: "/IMG_2232.JPG",
    alt: "Shadows in the Forest Core",
    title: "Shadows in the Forest Core",
    location: "Redwoods National Park, CA",
    camera: "Hasselblad 500C/M",
    film: "Kodak Ektar 100",
    description:
      "A slow exposure deep within dense redwood canopies, mapping organic spatial depth and vibrant green contrasts.",
  },
  {
    src: "/IMG_2260.JPG",
    alt: "Coastline Sentinel",
    title: "Coastline Sentinel",
    location: "Cannon Beach, PNW",
    camera: "Hasselblad 500C/M",
    film: "Kodak Portra 160",
    description:
      "The moody meeting of heavy maritime fog and basalt sea stacks on a cold, overcast afternoon.",
  },
];

interface GalleryPageProps {
  compact?: boolean;
}

export function GalleryPage({ compact = false }: GalleryPageProps) {
  const [api, setApi] = useState<EmblaCarouselType>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const shouldReduceMotion = useReducedMotionPreference();

  // Sync state with Embla programmatic selection
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const activePhoto = GALLERY_ITEMS[currentIndex] || GALLERY_ITEMS[0];

  return (
    <div className={compact ? "w-full" : "mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32"}>
      {!compact ? (
        <motion.header
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: pageEaseOut }}
          className="flex flex-col items-center text-center"
        >
          <Chip color="accent" size="sm" variant="soft">
            Gallery
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 max-w-3xl text-4xl leading-tight tracking-tight text-balance sm:text-5xl"
          >
            Analog Observances
          </Typography>
          <Typography color="muted" type="body" className="mt-4 max-w-xl text-balance">
            Slow, deliberate framing of landscapes and quiet geometry captured on medium-format
            film.
          </Typography>
        </motion.header>
      ) : null}

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.65, ease: pageEaseOut, delay: shouldReduceMotion ? 0 : 0.08 }}
        className={[
          compact ? null : "mt-12",
          "grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Carousel setApi={setApi} opts={{ loop: true }} type="in-place" className="w-full">
          <Carousel.Content>
            {GALLERY_ITEMS.map((item) => (
              <Carousel.Item key={item.src}>
                <Card className="overflow-hidden p-0" variant="transparent">
                  <div className="group relative aspect-[4/3]">
                    <Image
                      fill
                      alt={item.alt}
                      className="object-cover select-none"
                      draggable={false}
                      sizes="(min-width: 1024px) 720px, 100vw"
                      src={item.src}
                    />
                    <Button
                      isIconOnly
                      aria-label={`View ${item.title} full screen`}
                      className="absolute right-4 bottom-4 bg-black/55 text-white opacity-0 shadow-lg backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      size="sm"
                      variant="ghost"
                      onPress={() => setIsLightboxOpen(true)}
                    >
                      <Icon aria-hidden="true" icon="lucide:expand" className="size-4" />
                    </Button>
                  </div>
                </Card>
              </Carousel.Item>
            ))}
          </Carousel.Content>
          <Carousel.Previous className="left-4" />
          <Carousel.Next className="right-4" />
          <Carousel.Dots className="mt-4" />
          <Carousel.Thumbnails className="mt-6">
            {GALLERY_ITEMS.map((item, index) => (
              <Carousel.Thumbnail key={item.src} index={index} src={item.src} alt={item.alt} />
            ))}
          </Carousel.Thumbnails>
        </Carousel>

        <Card className="flex h-full flex-col" variant="secondary">
          <Card.Header>
            <Typography color="muted" type="body-xs" className="font-mono tracking-wide">
              From the frame
            </Typography>
            <Card.Title className="mt-2 text-balance">{activePhoto.title}</Card.Title>
            <Card.Description className="mt-3 line-clamp-3 leading-relaxed">
              {activePhoto.description}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="flex flex-col gap-5">
              {[
                ["Location", activePhoto.location],
                ["Camera", activePhoto.camera],
                ["Film", activePhoto.film],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt>
                    <Typography color="muted" type="body-xs" className="font-mono tracking-wide">
                      {label}
                    </Typography>
                  </dt>
                  <dd>
                    <Typography type="body" weight="medium">
                      {value}
                    </Typography>
                  </dd>
                </div>
              ))}
            </dl>
          </Card.Content>
          <Card.Footer className="mt-auto flex items-center justify-between">
            <Typography color="muted" type="body-xs" className="font-mono tracking-wide">
              Frame
            </Typography>
            <Typography type="body-sm" weight="medium" className="tabular-nums">
              {String(currentIndex + 1).padStart(2, "0")} /{" "}
              {String(GALLERY_ITEMS.length).padStart(2, "0")}
            </Typography>
          </Card.Footer>
        </Card>
      </motion.section>

      <Modal>
        <Modal.Backdrop isOpen={isLightboxOpen} onOpenChange={setIsLightboxOpen} variant="blur">
          <Modal.Container size="cover">
            <Modal.Dialog aria-label={`${activePhoto.title} full screen viewer`}>
              <Modal.CloseTrigger className="z-20" />
              <Modal.Body className="grid min-h-0 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
                <div className="relative min-h-[55vh] overflow-hidden rounded-2xl bg-black/30 lg:min-h-[70vh]">
                  <Image
                    fill
                    alt={activePhoto.alt}
                    className="object-contain select-none"
                    draggable={false}
                    sizes="(max-width: 1024px) 100vw, calc(100vw - 24rem)"
                    src={activePhoto.src}
                  />
                </div>
                <div className="flex flex-col gap-5 px-2 pb-2 lg:px-0">
                  <div>
                    <Typography
                      color="muted"
                      type="body-xs"
                      className="font-mono tracking-wide uppercase"
                    >
                      Frame {String(currentIndex + 1).padStart(2, "0")} /{" "}
                      {String(GALLERY_ITEMS.length).padStart(2, "0")}
                    </Typography>
                    <Typography type="h2" weight="semibold" className="mt-2 text-balance">
                      {activePhoto.title}
                    </Typography>
                  </div>
                  <Typography color="muted" type="body-sm" className="leading-6">
                    {activePhoto.description}
                  </Typography>
                  <dl className="border-default-200 grid grid-cols-2 gap-4 border-t pt-5">
                    <div>
                      <dt>
                        <Typography color="muted" type="body-xs">
                          Location
                        </Typography>
                      </dt>
                      <dd className="mt-1">
                        <Typography type="body-sm" weight="medium">
                          {activePhoto.location}
                        </Typography>
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <Typography color="muted" type="body-xs">
                          Film
                        </Typography>
                      </dt>
                      <dd className="mt-1">
                        <Typography type="body-sm" weight="medium">
                          {activePhoto.film}
                        </Typography>
                      </dd>
                    </div>
                  </dl>
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
