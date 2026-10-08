"use client";

import { Section } from "@/components/layout/section";
import { HOME_PREVIEW_GRID } from "./layout";

import { pageEaseOut } from "@/lib/motion";

import { Icon } from "@iconify/react";
import { Card, Chip, Link, Typography } from "@heroui/react";
import Image from "next/image";
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

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
  {
    alt: "Coastline Sentinel",
    location: "Cannon Beach, PNW",
    src: "/IMG_2260.JPG",
    title: "Coastline Sentinel",
  },
] as const;

export function GalleryShowcase() {
  const shouldReduceMotion = useReducedMotionPreference();

  return (
    <Section aria-labelledby="gallery-showcase-title">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <Chip color="default" size="sm" variant="secondary">
            Gallery
          </Chip>
          <Typography
            id="gallery-showcase-title"
            type="h2"
            weight="bold"
            className="mt-4 text-3xl leading-tight tracking-normal text-balance sm:text-4xl"
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

      <div className={`mt-10 ${HOME_PREVIEW_GRID}`} data-testid="home-gallery-grid">
        {GALLERY_PREVIEW.map((photo, index) => (
          <motion.div
            key={photo.src}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
              delay: shouldReduceMotion ? 0 : index * 0.07,
              ease: pageEaseOut,
            }}
          >
            <Card className="group h-full overflow-hidden p-0" variant="secondary">
              <Card.Content className="p-0">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    fill
                    alt={photo.alt}
                    className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105 motion-reduce:transition-none"
                    sizes="(max-width: 639px) 100vw, (max-width: 943px) 50vw, (max-width: 1247px) 33vw, 25vw"
                    src={photo.src}
                  />
                </div>
              </Card.Content>
              <Card.Header className="gap-1">
                <Card.Title className="text-lg tracking-normal">{photo.title}</Card.Title>
                <Card.Description>{photo.location}</Card.Description>
              </Card.Header>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
