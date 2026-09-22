"use client";

import { Card, Chip, Link, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";

import {
  FootprintsMap,
  FOOTPRINTS,
  getFeaturedFootprints,
  getFootprintArcs,
} from "@/features/footprints";

export function FootprintsShowcase() {
  const arcs = getFootprintArcs(FOOTPRINTS);
  const previewPlaces = getFeaturedFootprints(3, FOOTPRINTS);
  const latestYear = Math.max(...FOOTPRINTS.map((footprint) => footprint.year));

  return (
    <section
      id="footprints-showcase"
      aria-labelledby="footprints-showcase-title"
      className="w-full scroll-mt-24 py-24 sm:py-32"
    >
      <header className="flex w-full flex-col gap-6 px-6 sm:flex-row sm:items-end sm:justify-between sm:px-10">
        <div className="max-w-xl">
          <Chip size="sm" variant="secondary">
            Footprints
          </Chip>
          <Typography
            id="footprints-showcase-title"
            type="h2"
            weight="bold"
            className="mt-4 text-[clamp(2rem,4vw,3.5rem)] leading-[1.04] tracking-[-0.045em]"
          >
            Places I&apos;ve Been
          </Typography>
          <Typography color="muted" type="body" className="mt-3 max-w-lg leading-7">
            A record of provinces and cities across China. The stops that stayed on the map.
          </Typography>
        </div>
        <Link href="/footprints" className="shrink-0 text-sm no-underline">
          Open the atlas
          <Link.Icon aria-hidden="true">
            <Icon icon="gravity-ui:arrow-up-right" />
          </Link.Icon>
        </Link>
      </header>

      <div className="relative mt-10 w-full overflow-hidden rounded-lg">
        <FootprintsMap footprints={FOOTPRINTS} compact />

        <Card className="bg-overlay shadow-overlay absolute top-3 left-3 z-10 w-[260px] gap-3 p-4">
          <Card.Header>
            <Card.Title className="text-sm">Footprints</Card.Title>
            <Card.Description>Places kept on the map</Card.Description>
          </Card.Header>
          <Card.Content className="gap-3">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <span>
                <strong className="text-foreground block text-base tabular-nums">
                  {FOOTPRINTS.length}
                </strong>
                Places
              </span>
              <span>
                <strong className="text-foreground block text-base tabular-nums">
                  {arcs.length}
                </strong>
                Paths
              </span>
              <span>
                <strong className="text-foreground block text-base tabular-nums">
                  {latestYear}
                </strong>
                Latest
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
    </section>
  );
}
