"use client";

import { Section } from "@/components/layout/section";

import { Card, Chip, Link, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import {
  FootprintsMap,
  FOOTPRINTS,
  getFeaturedFootprints,
  getFootprintArcs,
} from "@/features/footprints";

export function FootprintsShowcase() {
  const t = useTranslations("Home");
  const arcs = getFootprintArcs(FOOTPRINTS);
  const previewPlaces = getFeaturedFootprints(3, FOOTPRINTS);
  const latestYear = Math.max(...FOOTPRINTS.map((footprint) => footprint.year));

  return (
    <Section id="footprints-showcase" aria-labelledby="footprints-showcase-title">
      <header className="flex w-full flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <Chip size="sm" variant="secondary">
            {t("footprints.eyebrow")}
          </Chip>
          <Typography
            id="footprints-showcase-title"
            type="h2"
            weight="bold"
            className="mt-4 text-3xl leading-tight tracking-normal text-balance sm:text-4xl"
          >
            {t("footprints.title")}
          </Typography>
          <Typography color="muted" type="body" className="mt-3 max-w-lg leading-7">
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

      <div className="relative mt-10 w-full overflow-hidden rounded-lg">
        <FootprintsMap footprints={FOOTPRINTS} compact />

        <Card className="bg-overlay shadow-overlay absolute top-3 left-3 z-10 w-[260px] gap-3 p-4">
          <Card.Header>
            <Card.Title className="text-sm">{t("footprints.cardTitle")}</Card.Title>
            <Card.Description>{t("footprints.cardDescription")}</Card.Description>
          </Card.Header>
          <Card.Content className="gap-3">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <span>
                <strong className="text-foreground block text-base tabular-nums">
                  {FOOTPRINTS.length}
                </strong>
                {t("footprints.places")}
              </span>
              <span>
                <strong className="text-foreground block text-base tabular-nums">
                  {arcs.length}
                </strong>
                {t("footprints.paths")}
              </span>
              <span>
                <strong className="text-foreground block text-base tabular-nums">
                  {latestYear}
                </strong>
                {t("footprints.latest")}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {previewPlaces.map((footprint) => (
                <div key={footprint.id} className="min-w-0">
                  <Typography className="truncate text-xs font-medium">
                    {footprint.title}
                  </Typography>
                  <Typography color="muted" type="body-xs" className="tabular-nums">
                    {footprint.place} · {footprint.year}
                  </Typography>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      </div>
    </Section>
  );
}
