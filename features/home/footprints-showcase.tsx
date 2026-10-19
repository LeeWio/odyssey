"use client";

import { Section } from "@/components/layout/section";

import { Card, Chip, Link, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import {
  FOOTPRINTS,
  FootprintsMap,
  getFeaturedFootprints,
  type Footprint,
} from "@/features/footprints";
import {
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER,
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
  const previewPlaces = getFeaturedFootprints(3, FOOTPRINTS);
  const latestYear = Math.max(...FOOTPRINTS.map((footprint) => footprint.year));

  return (
    <Section id="footprints-showcase" aria-labelledby="footprints-showcase-title">
      <header className={`${HOME_SECTION_HEADER} w-full`}>
        <div className="max-w-xl">
          <Chip size="sm" variant="secondary">
            {t("footprints.eyebrow")}
          </Chip>
          <Typography
            id="footprints-showcase-title"
            type="h2"
            weight="bold"
            className={HOME_SECTION_TITLE}
          >
            {t("footprints.title")}
          </Typography>
          <Typography color="muted" type="body" className={HOME_SECTION_DESCRIPTION}>
            {t("footprints.description")}
          </Typography>
        </div>
        <Link href="/footprints" className="shrink-0 text-sm no-underline">
          {t("footprints.openAtlas")}
          <Link.Icon aria-hidden="true">
            <Icon icon="gravity-ui:arrow-up-right" />
          </Link.Icon>
        </Link>
      </header>

      <div className={`${HOME_SECTION_CONTENT} w-full`}>
        <div className="relative w-full overflow-hidden rounded-lg">
          <FootprintsMap footprints={FOOTPRINTS} compact />

          <div className="absolute top-3 left-3 z-10 hidden w-[260px] @min-[64rem]/home-section:block">
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

        <div
          data-testid="footprints-mobile-summary"
          className="mt-3 flex min-w-0 flex-col gap-2 @min-[64rem]/home-section:hidden"
        >
          <FootprintCounts latestYear={latestYear} dense />
          <FootprintPreviewList places={previewPlaces} compact />
        </div>
      </div>
    </Section>
  );
}
