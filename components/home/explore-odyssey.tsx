"use client";

import { Section } from "@/components/layout/section";
import {
  HOME_CONTENT_GRID,
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER,
  HOME_SECTION_TITLE,
} from "./layout";

import { Icon } from "@iconify/react";
import { Card, Chip, Link, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { createPageReveal } from "@/lib/motion";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

const DESTINATIONS = [
  { key: "writing", href: "/single", icon: "lucide:book-open-text" },
  { key: "moments", href: "/moments", icon: "lucide:sparkles" },
  { key: "projects", href: "/projects", icon: "lucide:hammer" },
  { key: "gallery", href: "/gallery", icon: "lucide:images" },
  { key: "footprints", href: "/footprints", icon: "lucide:map" },
  { key: "library", href: "/library", icon: "lucide:library" },
] as const;

export function ExploreOdyssey() {
  const t = useTranslations("Home.explore");
  const shouldReduceMotion = useReducedMotionPreference();
  const { revealInView } = createPageReveal(shouldReduceMotion);

  return (
    <Section aria-labelledby="explore-odyssey-title">
      <header className={HOME_SECTION_HEADER}>
        <motion.div {...revealInView(0, 10)}>
          <Chip color="accent" size="sm" variant="soft">
            {t("eyebrow")}
          </Chip>
          <Typography
            id="explore-odyssey-title"
            type="h2"
            weight="bold"
            className={HOME_SECTION_TITLE}
          >
            {t("title")}
          </Typography>
          <Typography color="muted" type="body" className={HOME_SECTION_DESCRIPTION}>
            {t("description")}
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.08, 14)}>
          <Link href="/archive" className="no-underline">
            {t("viewArchive")}
            <Link.Icon aria-hidden="true">
              <Icon icon="lucide:arrow-up-right" />
            </Link.Icon>
          </Link>
        </motion.div>
      </header>

      <div
        className={`${HOME_SECTION_CONTENT} ${HOME_CONTENT_GRID}`}
        data-testid="home-explore-grid"
      >
        {DESTINATIONS.map((destination, index) => (
          <motion.div key={destination.key} {...revealInView(0.1 + index * 0.04, 18)}>
            <Link
              href={destination.href}
              className="group focus-visible:outline-accent block h-full no-underline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <Card
                variant="secondary"
                className="group-hover:border-accent/40 group-hover:bg-surface-secondary/70 border-default-200/70 h-full min-h-32 bg-transparent transition-[border-color,background-color,transform] duration-200 group-hover:-translate-y-1"
              >
                <Card.Header className="flex-row items-start justify-between gap-4">
                  <span className="bg-accent/12 text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Icon aria-hidden="true" icon={destination.icon} className="size-5" />
                  </span>
                  <Icon
                    aria-hidden="true"
                    icon="lucide:arrow-up-right"
                    className="text-muted/60 size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Card.Header>
                <Card.Content className="mt-auto gap-1">
                  <Card.Title>{t(`${destination.key}.title`)}</Card.Title>
                  <Card.Description className="leading-5">
                    {t(`${destination.key}.description`)}
                  </Card.Description>
                </Card.Content>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
