"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import type { EmblaCarouselType } from "embla-carousel";
import { Carousel } from "@heroui-pro/react/carousel";
import { Card, Chip, Typography } from "@heroui/react";
import { Camera, MapPin, Film, Eye, Image as ImageIcon } from "lucide-react";

const easeOut = [0.22, 1, 0.36, 1] as const;

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

export function GalleryPage() {
  const [api, setApi] = useState<EmblaCarouselType>();
  const [currentIndex, setCurrentIndex] = useState(0);

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
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="border-default-200/50 mb-12 flex flex-col items-center border-b pb-8 text-center"
        >
          <Chip color="accent" size="sm" variant="soft" className="gap-1.5 pl-2">
            <Camera className="text-accent size-3" />
            Medium Format Portfolio
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-4xl leading-tight text-balance sm:text-5xl"
          >
            Analog Observances
          </Typography>
          <Typography color="muted" type="body" className="mt-4 max-w-xl leading-relaxed">
            Slow, deliberate framing of landscapes and quiet geometry captured exclusively on
            medium-format analog film.
          </Typography>
        </motion.header>

        {/* Museum-style Layout Split */}
        <div className="mt-10 grid items-start gap-8 md:grid-cols-12">
          {/* Left Panel: Carousel Slider */}
          <div className="flex w-full flex-col items-center md:col-span-7">
            <Carousel setApi={setApi} opts={{ loop: true }} type="in-place" className="w-full">
              <Carousel.Content>
                {GALLERY_ITEMS.map((item) => (
                  <Carousel.Item key={item.src}>
                    <div className="border-default-200/40 relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border bg-black/10 shadow-sm">
                      <Image
                        fill
                        alt={item.alt}
                        className="h-full w-full object-cover select-none"
                        draggable={false}
                        src={item.src}
                      />
                    </div>
                  </Carousel.Item>
                ))}
              </Carousel.Content>
              <Carousel.Previous className="left-4" />
              <Carousel.Next className="right-4" />
              <Carousel.Dots className="mt-4" />

              <Carousel.Thumbnails className="mt-6">
                {GALLERY_ITEMS.map((item, i) => (
                  <Carousel.Thumbnail key={item.src} index={i} src={item.src} alt={item.alt} />
                ))}
              </Carousel.Thumbnails>
            </Carousel>
          </div>

          {/* Right Panel: Museum Plate Metadata Metadata Details Card */}
          <Card
            variant="secondary"
            className="border-default-200/50 bg-surface-secondary/20 flex min-h-[420px] flex-col justify-between rounded-2xl border p-6 shadow-sm md:col-span-5"
          >
            <div className="flex flex-col gap-6">
              {/* Photo Title */}
              <div>
                <div className="text-muted/60 mb-2 flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider uppercase">
                  <Eye className="text-accent size-3.5" />
                  MUSEUM PLATE
                </div>
                <Typography type="h3" weight="bold" className="text-foreground tracking-tight">
                  {activePhoto.title}
                </Typography>
              </div>

              {/* Photo Description */}
              <div>
                <Typography
                  color="muted"
                  type="body"
                  className="text-foreground/85 text-sm leading-relaxed"
                >
                  {activePhoto.description}
                </Typography>
              </div>

              {/* Telemetry metadata tags */}
              <div className="border-default-100/60 flex flex-col gap-3.5 border-t pt-5">
                {/* Location */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-default-100 text-default-500 flex size-7 shrink-0 items-center justify-center rounded-lg">
                    <MapPin className="size-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted/60 font-mono text-[9px] font-bold tracking-wider uppercase">
                      Location
                    </span>
                    <span className="text-foreground font-semibold">{activePhoto.location}</span>
                  </div>
                </div>

                {/* Camera */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-default-100 text-default-500 flex size-7 shrink-0 items-center justify-center rounded-lg">
                    <Camera className="size-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted/60 font-mono text-[9px] font-bold tracking-wider uppercase">
                      Camera Rig
                    </span>
                    <span className="text-foreground font-semibold">{activePhoto.camera}</span>
                  </div>
                </div>

                {/* Film Stock */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-default-100 text-default-500 flex size-7 shrink-0 items-center justify-center rounded-lg">
                    <Film className="size-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted/60 font-mono text-[9px] font-bold tracking-wider uppercase">
                      Film Stock
                    </span>
                    <span className="text-foreground font-semibold">{activePhoto.film}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Index telemetry indicator */}
            <div className="border-default-100 text-muted/50 mt-6 flex items-center justify-between border-t border-dashed pt-4 font-mono text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 uppercase">
                <ImageIcon className="text-accent size-3.5" />
                FRAME
              </span>
              <span className="text-foreground">
                {currentIndex + 1} / {GALLERY_ITEMS.length}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
