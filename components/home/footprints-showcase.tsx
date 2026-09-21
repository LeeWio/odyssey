"use client";

import { Card, Link, Typography } from "@heroui/react";
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

  return (
    <section
      id="footprints-showcase"
      aria-labelledby="footprints-showcase-title"
      className="w-full scroll-mt-24 py-24 sm:py-32"
    >
      <header className="flex w-full flex-col gap-3 px-6 sm:px-10">
        <Typography
          id="footprints-showcase-title"
          type="h2"
          weight="bold"
          className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.04] tracking-[-0.045em]"
        >
          Places I&apos;ve Been
        </Typography>
        <Typography color="muted" type="body" className="max-w-xl leading-7">
          A record of provinces and cities across China — the stops that stayed on the map.
        </Typography>
      </header>

      <div className="relative mt-10 w-full overflow-hidden rounded-lg">
        <FootprintsMap footprints={FOOTPRINTS} compact />

        <Card className="bg-overlay shadow-overlay absolute top-3 left-3 z-10 w-[260px] gap-3 p-4">
          <Card.Header>
            <Card.Title className="text-sm">Footprints</Card.Title>
            <Card.Description>Personal atlas</Card.Description>
          </Card.Header>
          <Card.Content className="gap-3">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <span>
                <strong className="text-foreground block text-base">{FOOTPRINTS.length}</strong>
                Places
              </span>
              <span>
                <strong className="text-foreground block text-base">{arcs.length}</strong>
                Paths
              </span>
              <span>
                <strong className="text-foreground block text-base">CN</strong>
                Region
              </span>
            </div>
            <div className="space-y-1">
              {previewPlaces.map((footprint) => (
                <div key={footprint.id} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="bg-accent h-0.5 w-4 rounded-full" />
                    {footprint.place}
                  </span>
                  <span className="text-muted">{footprint.year}</span>
                </div>
              ))}
            </div>
            <Link href="/footprints" className="mt-1 text-sm no-underline">
              Open the atlas
              <Link.Icon aria-hidden="true">
                <Icon icon="gravity-ui:arrow-up-right" />
              </Link.Icon>
            </Link>
          </Card.Content>
        </Card>
      </div>
    </section>
  );
}
