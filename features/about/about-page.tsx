"use client";

import { motion, useReducedMotion } from "motion/react";
import { Card, Chip, Link, Separator, Surface, Typography, cn } from "@heroui/react";
import { AboutDefaults } from "./about-defaults";
import { AboutHeader } from "./about-header";
import { AboutTimeline } from "./about-timeline";
import {
  aboutClose,
  aboutCraft,
  aboutPlay,
  aboutProduct,
  playPlatforms,
  playTitles,
} from "./about-content";

const easeOut = [0.22, 1, 0.36, 1] as const;

interface AboutPageProps {
  compact?: boolean;
}

export function AboutPage({ compact = false }: AboutPageProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const reveal = (delay = 0, distance = 12) => ({
    initial: shouldReduceMotion ? false : { opacity: 1, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: shouldReduceMotion ? 0 : 0.45, delay, ease: easeOut },
  });

  return (
    <Surface variant="transparent" className={cn("w-full", compact ? "pb-8" : "pb-16 sm:pb-24")}>
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col",
          compact ? "gap-12 px-0" : "gap-16 px-5 pt-28 pb-8 sm:gap-20 sm:px-8 sm:pt-32 lg:px-12"
        )}
      >
        <motion.div {...reveal(0, 12)}>
          <AboutHeader compact={compact} />
        </motion.div>

        <motion.div {...reveal(0.04, 16)}>
          <AboutDefaults />
        </motion.div>

        <motion.section
          aria-labelledby="about-play-title"
          className="flex flex-col gap-4"
          {...reveal(0.06, 16)}
        >
          <div className="max-w-2xl">
            <Typography
              id="about-play-title"
              type="h2"
              weight="bold"
              className="tracking-[-0.03em]"
            >
              {aboutPlay.title}
            </Typography>
            <Typography color="muted" type="body" className="mt-2 text-pretty">
              {aboutPlay.description}
            </Typography>
          </div>
          <div className="flex flex-wrap gap-2">
            {playTitles.map((game) => (
              <Chip key={game.id} size="sm" variant="soft">
                {game.label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {playPlatforms.map((platform) => (
              <Chip key={platform} size="sm" variant="tertiary">
                {platform}
              </Chip>
            ))}
          </div>
        </motion.section>

        <motion.div className="grid gap-4" {...reveal(0.08, 16)}>
          <Card variant="secondary">
            <Card.Header>
              <Card.Title className="text-base">{aboutCraft.title}</Card.Title>
              <Card.Description className="leading-6">{aboutCraft.description}</Card.Description>
            </Card.Header>
            <Card.Footer className="flex flex-wrap gap-2">
              {aboutCraft.chips.map((chip) => (
                <Chip key={chip} size="sm" variant="tertiary">
                  {chip}
                </Chip>
              ))}
            </Card.Footer>
          </Card>

          <Card variant="secondary">
            <Card.Header>
              <Card.Title className="text-base">{aboutProduct.title}</Card.Title>
              <Card.Description className="leading-6">{aboutProduct.description}</Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link href={aboutProduct.href}>
                {aboutProduct.cta}
                <Link.Icon aria-hidden="true" />
              </Link>
            </Card.Footer>
          </Card>
        </motion.div>

        <motion.div {...reveal(0.1, 16)}>
          <AboutTimeline />
        </motion.div>

        <motion.section
          aria-labelledby="about-close-title"
          className="flex max-w-xl flex-col gap-5"
          {...reveal(0.12, 12)}
        >
          <Typography id="about-close-title" type="h2" weight="bold" className="tracking-[-0.03em]">
            {aboutClose.title}
          </Typography>
          <Separator />
          <div className="flex flex-wrap gap-4">
            <Link href={aboutClose.primary.href}>{aboutClose.primary.label}</Link>
            <Link href={aboutClose.secondary.href}>{aboutClose.secondary.label}</Link>
          </div>
        </motion.section>
      </div>
    </Surface>
  );
}
