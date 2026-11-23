"use client";

import { Section } from "@/components/layout/section";
import { DestinationLink } from "@/components/ui/destination-link";
import {
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER,
  HOME_SECTION_TITLE,
} from "./layout";

import { ArrowUpRight, BookOpen, Comment, Hammer, MapPin, Bookmark } from "@gravity-ui/icons";
import { Chip, Link, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { createPageReveal } from "@/lib/motion";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

const DESTINATIONS = [
  { key: "writing", href: "/single", icon: BookOpen },
  { key: "moments", href: "/moments", icon: Comment },
  { key: "projects", href: "/projects", icon: Hammer },
  { key: "footprints", href: "/footprints", icon: MapPin },
  { key: "library", href: "/library", icon: Bookmark },
] as const;

export function ExploreOdyssey() {
  const t = useTranslations("Home.explore");
  const shouldReduceMotion = useReducedMotionPreference();
  const { revealInView } = createPageReveal(shouldReduceMotion);

  return (
    <Section aria-labelledby="explore-odyssey">
      <header className={HOME_SECTION_HEADER}>
        <motion.div {...revealInView(0, 10)}>
          <Chip color="accent" size="sm" variant="soft">
            {t("eyebrow")}
          </Chip>
          <Typography
            id="explore-odyssey"
            tabIndex={-1}
            type="h2"
            weight="bold"
            className={`${HOME_SECTION_TITLE} scroll-mt-24`}
          >
            {t("title")}
          </Typography>
          <Typography color="muted" type="body" className={HOME_SECTION_DESCRIPTION}>
            {t("description")}
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.08, 14)}>
          <Link href="/archive">
            {t("viewArchive")}
            <Link.Icon aria-hidden="true">
              <ArrowUpRight />
            </Link.Icon>
          </Link>
        </motion.div>
      </header>

      <div
        className={`${HOME_SECTION_CONTENT} grid gap-x-8 gap-y-1 md:grid-cols-2`}
        data-testid="home-explore-grid"
      >
        {DESTINATIONS.map(({ key, href, icon: Icon }) => (
          <div key={key}>
            <DestinationLink
              description={t(`${key}.description`)}
              href={href}
              icon={<Icon />}
              title={t(`${key}.title`)}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
