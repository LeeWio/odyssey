"use client";

import { createPageReveal } from "@/lib/motion";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { EmptyState, Timeline } from "@heroui-pro/react";
import { Button, Card, Chip, Link, Surface, Tabs, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PageFrame } from "@/components/layout/page-frame";
import { FootprintsMap } from "./footprints-map";
import {
  getFootprintMetaLabel,
  getFootprintYears,
  getSortedFootprints,
  type Footprint,
} from "./footprints-data";

const ALL_YEARS = "all";

function FootprintDetail({ footprint }: { footprint: Footprint | null }) {
  const t = useTranslations("Footprints");
  if (!footprint) {
    return (
      <EmptyState className="bg-surface-secondary min-h-56 rounded-2xl" size="lg">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Icon icon="gravity-ui:location-pin" aria-hidden="true" />
          </EmptyState.Media>
          <EmptyState.Title>{t("noPlaces")}</EmptyState.Title>
          <EmptyState.Description>{t("noPlacesHint")}</EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    );
  }

  return (
    <Card aria-label={t("selectedMemory")} className="overflow-hidden" variant="secondary">
      {footprint.image ? (
        <Card.Content className="p-0">
          <div className="relative aspect-[16/9] w-full">
            <Image
              fill
              alt={t("memoryAlt", { place: footprint.place })}
              className="object-cover"
              sizes="(min-width: 1024px) 24rem, 100vw"
              src={footprint.image}
            />
          </div>
        </Card.Content>
      ) : null}
      <Card.Header className="gap-3">
        <Chip size="sm" variant="soft" className="w-fit">
          {getFootprintMetaLabel(footprint)}
        </Chip>
        <Card.Title className="text-2xl tracking-[-0.03em] text-balance">
          {footprint.title}
        </Card.Title>
        <Typography color="muted" type="body-sm">
          {footprint.place}
        </Typography>
        <Card.Description className="leading-6">{footprint.memory}</Card.Description>
      </Card.Header>
      <Card.Footer className="flex flex-wrap gap-2">
        {footprint.tags.map((tag) => (
          <Chip key={tag} size="sm" variant="tertiary">
            {tag}
          </Chip>
        ))}
      </Card.Footer>
    </Card>
  );
}

export function FootprintsPage() {
  const t = useTranslations("Footprints");
  const shouldReduceMotion = useReducedMotionPreference();
  const { reveal } = createPageReveal(shouldReduceMotion);
  const years = getFootprintYears();
  const [selectedYear, setSelectedYear] = useState<string>(ALL_YEARS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleFootprints = useMemo(() => {
    const sorted = getSortedFootprints();
    if (selectedYear === ALL_YEARS) return sorted;
    return sorted.filter((footprint) => footprint.year === Number(selectedYear));
  }, [selectedYear]);

  const activeId =
    selectedId && visibleFootprints.some((footprint) => footprint.id === selectedId)
      ? selectedId
      : (visibleFootprints[0]?.id ?? null);

  const selectedFootprint =
    visibleFootprints.find((footprint) => footprint.id === activeId) ?? null;

  const selectFootprint = (footprint: Footprint) => setSelectedId(footprint.id);

  return (
    <Surface variant="transparent" className="bg-background min-h-[100dvh] w-full">
      <PageFrame className="w-full">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <motion.div {...reveal(0, 10)}>
              <Chip color="accent" size="sm" variant="soft">
                {t("eyebrow")}
              </Chip>
            </motion.div>
            <motion.div {...reveal(0.06)}>
              <Typography
                type="h1"
                weight="bold"
                className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-balance"
              >
                {t("title")}
              </Typography>
            </motion.div>
            <motion.div {...reveal(0.12, 14)}>
              <Typography color="muted" type="body" className="mt-5 max-w-xl leading-7">
                {t("description")}
              </Typography>
            </motion.div>
          </div>
          <motion.div {...reveal(0.1, 12)}>
            <Link href="/gallery" className="shrink-0 text-sm no-underline">
              {t("seePhotos")}
              <Link.Icon aria-hidden="true">
                <Icon icon="gravity-ui:arrow-up-right" />
              </Link.Icon>
            </Link>
          </motion.div>
        </header>

        <div className="relative mt-8">
          <FootprintsMap
            footprints={visibleFootprints}
            selectedId={activeId}
            onSelect={selectFootprint}
          />
          <div className="mt-4 lg:absolute lg:top-4 lg:right-4 lg:mt-0 lg:w-96">
            <FootprintDetail footprint={selectedFootprint} />
          </div>
        </div>

        <section aria-labelledby="footprints-timeline-title" className="mt-20">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Chip size="sm" variant="secondary">
                {t("routeNotes")}
              </Chip>
              <Typography
                id="footprints-timeline-title"
                type="h2"
                weight="semibold"
                className="mt-3 text-3xl tracking-[-0.04em]"
              >
                {t("yearsInMotion")}
              </Typography>
            </div>
            <Typography color="muted" type="body-sm" className="tabular-nums">
              {t("placesInView", { count: visibleFootprints.length })}
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
                aria-label={t("filterYear")}
                className="justify-start gap-5 overflow-x-auto"
              >
                <Tabs.Tab id={ALL_YEARS} className="px-1">
                  {t("allYears")}
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

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {visibleFootprints.length === 0 ? (
              <EmptyState className="bg-surface-secondary rounded-2xl" size="md">
                <EmptyState.Header>
                  <EmptyState.Title>{t("noStops")}</EmptyState.Title>
                  <EmptyState.Description>{t("noStopsHint")}</EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            ) : (
              <Timeline density="compact" size="sm">
                {visibleFootprints.map((footprint) => {
                  const isActive = footprint.id === activeId;

                  return (
                    <Timeline.Item key={footprint.id} status={isActive ? "current" : "default"}>
                      <Timeline.Marker>
                        <Icon icon="gravity-ui:location-pin" aria-hidden="true" />
                      </Timeline.Marker>
                      <Timeline.Content>
                        <Button
                          variant="ghost"
                          aria-pressed={isActive}
                          aria-label={t("readMemory", { place: footprint.place })}
                          className="h-auto w-full flex-col items-start gap-2 p-3 text-left whitespace-normal"
                          onPress={() => selectFootprint(footprint)}
                        >
                          <div className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1">
                            <Typography
                              color="muted"
                              type="body-xs"
                              className="font-mono tabular-nums"
                            >
                              {footprint.year}
                            </Typography>
                            <Typography color="muted" type="body-xs">
                              {footprint.place}
                            </Typography>
                          </div>
                          <Typography weight="semibold" className="text-left">
                            {footprint.title}
                          </Typography>
                          <Typography
                            color="muted"
                            type="body-sm"
                            className="line-clamp-2 text-left leading-6"
                          >
                            {footprint.memory}
                          </Typography>
                        </Button>
                      </Timeline.Content>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            )}
          </div>
        </section>
      </PageFrame>
    </Surface>
  );
}
