"use client";

import { Button, Card, Chip, Link, Separator, Tabs, Typography } from "@heroui/react";
import { Timeline } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { FootprintsMap } from "./footprints-map";
import { getFootprintYears, getSortedFootprints, type Footprint } from "./footprints-data";

const ALL_YEARS = "all";

function FootprintDetail({ footprint }: { footprint: Footprint | null }) {
  if (!footprint) {
    return (
      <Card className="min-h-56 justify-center" variant="secondary">
        <Card.Header>
          <Chip size="sm" variant="soft" className="w-fit">
            Choose a place
          </Chip>
          <Card.Title className="mt-2">Follow a memory on the map.</Card.Title>
          <Card.Description>
            Select a marker or a year entry to read the note attached to it.
          </Card.Description>
        </Card.Header>
      </Card>
    );
  }

  return (
    <Card aria-label="Selected travel memory" className="overflow-hidden" variant="secondary">
      {footprint.image ? (
        <Card.Content className="p-0">
          <div className="relative aspect-[16/9] w-full">
            <Image
              fill
              alt={`${footprint.place} travel memory`}
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, 32vw"
              src={footprint.image}
            />
          </div>
        </Card.Content>
      ) : null}
      <Card.Header className="gap-2">
        <Typography color="muted" type="body-xs" className="font-mono uppercase">
          {footprint.year} · {footprint.country}
        </Typography>
        <Card.Title className="text-2xl tracking-[-0.03em]">{footprint.place}</Card.Title>
        <Card.Description className="leading-6">{footprint.memory}</Card.Description>
      </Card.Header>
      <Card.Footer className="flex flex-wrap gap-2">
        {footprint.tags.map((tag) => (
          <Chip key={tag} size="sm" variant="soft">
            {tag}
          </Chip>
        ))}
      </Card.Footer>
    </Card>
  );
}

export function FootprintsPage() {
  const years = getFootprintYears();
  const [selectedYear, setSelectedYear] = useState<string>(ALL_YEARS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleFootprints = useMemo(() => {
    const sorted = getSortedFootprints();
    if (selectedYear === ALL_YEARS) return sorted;
    return sorted.filter((footprint) => footprint.year === Number(selectedYear));
  }, [selectedYear]);

  const selectedFootprint =
    visibleFootprints.find((footprint) => footprint.id === selectedId) ??
    visibleFootprints[0] ??
    null;

  const selectFootprint = (footprint: Footprint) => setSelectedId(footprint.id);

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Chip color="accent" size="sm" variant="soft">
              Footprints · China
            </Chip>
            <Typography
              type="h1"
              weight="bold"
              className="mt-5 text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.96] tracking-[-0.06em] text-balance"
            >
              Places I have actually been.
            </Typography>
            <Typography color="muted" type="body" className="mt-5 max-w-xl leading-7">
              A living atlas of provinces and cities across China. Years and longer notes will fill
              in as the record grows.
            </Typography>
          </div>
          <Link href="/gallery" className="shrink-0 text-sm no-underline">
            See the photographs
            <Link.Icon aria-hidden="true">
              <Icon icon="gravity-ui:arrow-up-right" />
            </Link.Icon>
          </Link>
        </header>

        <Separator className="mt-10" />

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
          <FootprintsMap
            footprints={visibleFootprints}
            selectedId={selectedId}
            onClearSelection={() => setSelectedId(null)}
            onSelect={selectFootprint}
          />
          <FootprintDetail footprint={selectedFootprint} />
        </div>

        <section aria-labelledby="footprints-timeline-title" className="mt-20">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Typography color="muted" type="body-xs" className="font-mono uppercase">
                The route, in notes
              </Typography>
              <Typography
                id="footprints-timeline-title"
                type="h2"
                weight="semibold"
                className="mt-2 text-3xl tracking-[-0.04em]"
              >
                A few years in motion.
              </Typography>
            </div>
            <Typography color="muted" type="body-sm">
              {visibleFootprints.length} {visibleFootprints.length === 1 ? "place" : "places"} in
              view
            </Typography>
          </header>

          <Tabs
            className="mt-7 w-full"
            selectedKey={selectedYear}
            onSelectionChange={(key) => {
              setSelectedYear(String(key));
              setSelectedId(null);
            }}
          >
            <Tabs.ListContainer className="border-default-200 border-b bg-transparent p-0">
              <Tabs.List
                aria-label="Filter footprints by year"
                className="justify-start gap-5 overflow-x-auto"
              >
                <Tabs.Tab id={ALL_YEARS} className="px-1">
                  All years
                  <Tabs.Indicator />
                </Tabs.Tab>
                {years.map((year) => (
                  <Tabs.Tab key={year} id={String(year)} className="px-1">
                    {year}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          <div className="mt-8 max-w-3xl">
            <Timeline size="sm">
              {visibleFootprints.map((footprint) => (
                <Timeline.Item
                  key={footprint.id}
                  status={footprint.id === selectedFootprint?.id ? "current" : "default"}
                >
                  <Timeline.Marker>
                    <Icon icon="gravity-ui:location-pin" aria-hidden="true" />
                  </Timeline.Marker>
                  <Timeline.Content>
                    <Button
                      variant="ghost"
                      aria-pressed={footprint.id === selectedId}
                      aria-label={`Read memory from ${footprint.place}`}
                      className="h-auto w-full flex-col items-start gap-2 p-3 text-left whitespace-normal"
                      onPress={() => selectFootprint(footprint)}
                    >
                      <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                        <Typography
                          weight="semibold"
                          className="group-hover:text-accent transition-colors"
                        >
                          {footprint.place}
                        </Typography>
                        <Typography color="muted" type="body-xs" className="font-mono">
                          {footprint.year}
                        </Typography>
                      </div>
                      <Typography color="muted" type="body-sm" className="mt-1 leading-6">
                        {footprint.memory}
                      </Typography>
                    </Button>
                  </Timeline.Content>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        </section>
      </div>
    </div>
  );
}
