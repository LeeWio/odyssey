"use client";

import { Icon } from "@iconify/react";
import { Card, Chip, Link, Typography } from "@heroui/react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

const GALLERY_PREVIEW = [
  {
    alt: "Silent snowfall over the peaks",
    location: "Mount Rainier, WA",
    src: "/IMG_4958.WEBP",
    title: "Silent snowfall",
  },
  {
    alt: "Urban geometry and intersections",
    location: "Shinjuku, Tokyo",
    src: "/IMG_5332.JPG",
    title: "Urban geometry",
  },
  {
    alt: "Shadows in the forest core",
    location: "Redwoods National Park, CA",
    src: "/IMG_2232.JPG",
    title: "Forest core",
  },
] as const;

export function GalleryShowcase() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section
      aria-labelledby="gallery-showcase-title"
      className="mx-auto w-full max-w-7xl scroll-mt-24 px-6 py-24 sm:px-10 sm:py-32"
    >
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <Chip color="default" size="sm" variant="secondary">
            Gallery
          </Chip>
          <Typography
            id="gallery-showcase-title"
            type="h2"
            weight="bold"
            className="mt-4 text-[clamp(2rem,4vw,3.5rem)] leading-[1.04] tracking-[-0.045em]"
          >
            A slower way to look.
          </Typography>
          <Typography color="muted" type="body" className="mt-3 max-w-lg leading-7">
            Quiet geometry, weather, and the frames that stayed with me.
          </Typography>
        </div>
        <Link href="/gallery" className="shrink-0 text-sm no-underline">
          Enter the gallery
          <Link.Icon aria-hidden="true">
            <Icon icon="gravity-ui:arrow-up-right" />
          </Link.Icon>
        </Link>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {GALLERY_PREVIEW.map((photo, index) => (
          <motion.div
            key={photo.src}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
              delay: shouldReduceMotion ? 0 : index * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Card className="group h-full overflow-hidden p-0" variant="secondary">
              <Card.Content className="p-0">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    fill
                    alt={photo.alt}
                    className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105 motion-reduce:transition-none"
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    src={photo.src}
                  />
                </div>
              </Card.Content>
              <Card.Header className="gap-1">
                <Card.Title className="text-lg tracking-[-0.025em]">{photo.title}</Card.Title>
                <Card.Description>{photo.location}</Card.Description>
              </Card.Header>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
