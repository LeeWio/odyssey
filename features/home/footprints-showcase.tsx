"use client";

import { PageContainer } from "@/components/layout/page-container";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { createPageReveal } from "@/lib/motion";

import { Card, Chip, Link, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import {
  FOOTPRINTS,
  FootprintsMap,
  getFeaturedFootprints,
  type Footprint,
} from "@/features/footprints";
import {
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER_CENTERED,
  HOME_SECTION_TITLE,
} from "./layout";

function FootprintCounts({ latestYear, dense = false }: { latestYear: number; dense?: boolean }) {
  const t = useTranslations("Home");

  return (
    <div
      className={dense ? "grid grid-cols-3 gap-2 text-[11px]" : "grid grid-cols-3 gap-3 text-xs"}
    >
      <span>
        <strong className={`text-foreground block tabular-nums ${dense ? "text-sm" : "text-base"}`}>
          {FOOTPRINTS.length}
        </strong>
        {t("footprints.places")}
      </span>
      <span>
        <strong className={`text-foreground block tabular-nums ${dense ? "text-sm" : "text-base"}`}>
          {FOOTPRINTS.length}
        </strong>
        {t("footprints.zones")}
      </span>
      <span>
        <strong className={`text-foreground block tabular-nums ${dense ? "text-sm" : "text-base"}`}>
          {latestYear}
        </strong>
        {t("footprints.latest")}
      </span>
    </div>
  );
}

function FootprintPreviewList({
  places,
  compact = false,
}: {
  places: readonly Footprint[];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <ul className="flex min-w-0 flex-col gap-1">
        {places.map((footprint) => (
          <li key={footprint.id} className="flex min-w-0 items-baseline justify-between gap-3">
            <Typography className="m-0 min-w-0 truncate text-xs font-medium">
              {footprint.title}
            </Typography>
            <Typography color="muted" type="body-xs" className="m-0 shrink-0 tabular-nums">
              {footprint.place} · {footprint.year}
            </Typography>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {places.map((footprint) => (
        <div key={footprint.id} className="min-w-0">
          <Typography className="truncate text-xs font-medium">{footprint.title}</Typography>
          <Typography color="muted" type="body-xs" className="tabular-nums">
            {footprint.place} · {footprint.year}
          </Typography>
        </div>
      ))}
    </div>
  );
}

export function FootprintsShowcase() {
  const t = useTranslations("Home");
  const shouldReduceMotion = useReducedMotionPreference();
  const { revealInView } = createPageReveal(shouldReduceMotion);
  const previewPlaces = getFeaturedFootprints(3, FOOTPRINTS);
  const latestYear = Math.max(...FOOTPRINTS.map((footprint) => footprint.year));

  return (
    <section
      id="footprints-showcase"
      aria-labelledby="footprints-showcase-title"
      className="@container/home-section scroll-mt-24 py-16 md:py-24"
    >
      <PageContainer>
        <header className={HOME_SECTION_HEADER_CENTERED}>
          <motion.div {...revealInView(0, 10)}>
            <Chip size="sm" variant="secondary">
              {t("footprints.eyebrow")}
            </Chip>
          </motion.div>
          <motion.div {...revealInView(0.06)}>
            <Typography
              id="footprints-showcase-title"
              type="h2"
              weight="bold"
              className={HOME_SECTION_TITLE}
            >
              {t("footprints.title")}
            </Typography>
          </motion.div>
          <motion.div {...revealInView(0.12, 14)}>
            <Typography color="muted" type="body" className={HOME_SECTION_DESCRIPTION}>
              {t("footprints.description")}
            </Typography>
          </motion.div>
          <motion.div {...revealInView(0.16, 14)}>
            <Link href="/footprints" className="mt-2 text-sm no-underline">
              {t("footprints.openAtlas")}
              <Link.Icon aria-hidden="true">
                <Icon icon="gravity-ui:arrow-up-right" />
              </Link.Icon>
            </Link>
          </motion.div>
        </header>
      </PageContainer>

      <div className="relative mt-9 w-full overflow-hidden md:mt-10">
        <FootprintsMap footprints={FOOTPRINTS} compact />

        <div className="absolute top-4 left-4 z-10 hidden w-[260px] @min-[64rem]/home-section:block">
          <Card
            data-testid="footprints-map-overlay"
            className="bg-overlay shadow-overlay gap-3 p-4"
          >
            <Card.Header className="gap-1">
              <Card.Title className="text-sm">{t("footprints.cardTitle")}</Card.Title>
              <Card.Description className="text-xs">
                {t("footprints.cardDescription")}
              </Card.Description>
            </Card.Header>
            <Card.Content className="gap-3">
              <FootprintCounts latestYear={latestYear} />
              <FootprintPreviewList places={previewPlaces} />
            </Card.Content>
          </Card>
        </div>
      </div>

      <PageContainer>
        <div
          data-testid="footprints-mobile-summary"
          className="mt-3 flex min-w-0 flex-col gap-2 @min-[64rem]/home-section:hidden"
        >
          <FootprintCounts latestYear={latestYear} dense />
          <FootprintPreviewList places={previewPlaces} compact />
        </div>
      </PageContainer>
    </section>
  );
}
