"use client";

import { Section } from "@/components/layout/section";
import {
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER,
  HOME_SECTION_TITLE,
} from "./layout";

import { Icon } from "@iconify/react";
import { Chip, Link, Typography } from "@heroui/react";
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
        className={`${HOME_SECTION_CONTENT} grid gap-x-12 md:grid-cols-2`}
        data-testid="home-explore-grid"
      >
        {DESTINATIONS.map((destination) => (
          <Link
            key={destination.key}
            href={destination.href}
            className="group border-separator focus-visible:outline-accent flex min-h-24 items-center gap-4 border-t py-5 no-underline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <span className="text-muted group-hover:text-accent flex size-9 shrink-0 items-center justify-center transition-colors">
              <Icon aria-hidden="true" icon={destination.icon} className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-foreground font-medium">{t(`${destination.key}.title`)}</span>
              <span className="text-muted text-sm leading-5">
                {t(`${destination.key}.description`)}
              </span>
            </span>
            <Icon
              aria-hidden="true"
              icon="lucide:arrow-up-right"
              className="text-muted/60 size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        ))}
      </div>
    </Section>
  );
}
