"use client";

import { createPageReveal, pageEaseOut } from "@/lib/motion";

import { Icon } from "@iconify/react";

import {
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  SearchField,
  Select,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useGetPublicColumnsQuery } from "@/lib/features/column";
import { ColumnCard } from "./column-card";

type AvailabilityFilter = "all" | "ready" | "starting";
type ColumnSort = "newest" | "most-essays" | "alphabetical";

function getCreatedAtTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function ColumnsIndex() {
  const t = useTranslations("Columns");
  const { data: columns = [], error, isLoading, refetch } = useGetPublicColumnsQuery();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<ColumnSort>("newest");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const visibleColumns = useMemo(() => {
    const filtered = columns.filter((column) => {
      const matchesSearch =
        !deferredSearch ||
        [column.name, column.slug, column.description ?? ""].some((value) =>
          value.toLocaleLowerCase().includes(deferredSearch)
        );
      const matchesAvailability =
        availability === "all" ||
        (availability === "ready" ? column.postsCount > 0 : column.postsCount === 0);

      return matchesSearch && matchesAvailability;
    });

    return [...filtered].sort((first, second) => {
      if (sort === "most-essays") return second.postsCount - first.postsCount;
      if (sort === "alphabetical") return first.name.localeCompare(second.name);

      return getCreatedAtTime(second.createdAt) - getCreatedAtTime(first.createdAt);
    });
  }, [availability, columns, deferredSearch, sort]);

  const clearFilters = () => {
    setSearch("");
    setAvailability("all");
  };

  const handleAvailabilityChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [key] = Array.from(keys);
    if (key === "all" || key === "ready" || key === "starting") {
      setAvailability(key);
    }
  };

  const { revealInView } = createPageReveal(shouldReduceMotion);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex flex-col items-center text-center">
        <motion.div {...revealInView(0, 10)}>
          <Chip color="default" size="sm" variant="secondary">
            {t("eyebrow")}
          </Chip>
        </motion.div>
        <motion.div {...revealInView(0.06)}>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.05em] text-balance"
          >
            {t("title")}
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className="mt-3 max-w-xl text-balance">
            {t("description")}
          </Typography>
        </motion.div>
      </header>

      <motion.section aria-label={t("published")} className="mt-12" {...revealInView(0.18, 16)}>
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Card key={index} variant="secondary" className="overflow-hidden p-0">
                <Skeleton className="aspect-[16/9] w-full rounded-none" />
                <Card.Header>
                  <Skeleton className="h-5 w-20 rounded-lg" />
                  <Skeleton className="h-7 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-lg" />
                </Card.Header>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card variant="secondary">
            <Card.Header>
              <Card.Title>{t("unavailable")}</Card.Title>
              <Card.Description>{t("tryAgainHint")}</Card.Description>
            </Card.Header>
            <Card.Footer>
              <Button size="sm" variant="secondary" onPress={() => refetch()}>
                <Icon icon="gravity-ui:arrow-rotate-right" aria-hidden="true" className="size-4" />
                {t("retry")}
              </Button>
            </Card.Footer>
          </Card>
        ) : columns.length === 0 ? (
          <Card variant="secondary">
            <Card.Header>
              <Card.Title>{t("nonePublished")}</Card.Title>
              <Card.Description>{t("nonePublishedHint")}</Card.Description>
            </Card.Header>
          </Card>
        ) : (
          <>
            <div className="border-default-200 grid gap-5 border-y py-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-end">
              <div className="min-w-0">
                <SearchField fullWidth name="column-search" value={search} onChange={setSearch}>
                  <Label className="sr-only">{t("searchLabel")}</Label>
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder={t("searchPlaceholder")} />
                    <SearchField.ClearButton aria-label={t("clearSearch")} />
                  </SearchField.Group>
                </SearchField>
                <TagGroup
                  aria-label={t("filterAvailability")}
                  selectedKeys={new Set([availability])}
                  selectionMode="single"
                  size="sm"
                  variant="surface"
                  className="mt-4"
                  onSelectionChange={handleAvailabilityChange}
                >
                  <TagGroup.List className="flex-wrap">
                    <Tag id="all" textValue={t("allColumns")}>
                      {t("allPaths")}
                      <span className="text-muted text-xs tabular-nums">{columns.length}</span>
                    </Tag>
                    <Tag id="ready" textValue={t("readyToRead")}>
                      {t("readyToRead")}
                      <span className="text-muted text-xs tabular-nums">
                        {columns.filter((column) => column.postsCount > 0).length}
                      </span>
                    </Tag>
                    <Tag id="starting" textValue={t("startingSoon")}>
                      {t("startingSoon")}
                      <span className="text-muted text-xs tabular-nums">
                        {columns.filter((column) => column.postsCount === 0).length}
                      </span>
                    </Tag>
                  </TagGroup.List>
                </TagGroup>
              </div>
              <Select
                aria-label={t("sortLabel")}
                className="w-full lg:w-52 lg:justify-self-end"
                value={sort}
                variant="secondary"
                onChange={(value) => {
                  if (value === "newest" || value === "most-essays" || value === "alphabetical") {
                    setSort(value);
                  }
                }}
              >
                <Label>{t("sortPaths")}</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="newest" textValue={t("newestFirst")}>
                      {t("newestFirst")}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="most-essays" textValue={t("mostEssays")}>
                      {t("mostEssays")}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="alphabetical" textValue={t("alphabetical")}>
                      {t("alphabetical")}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="mt-7 flex items-center justify-between gap-4">
              <Typography color="muted" type="body-sm">
                {t("pathsToExplore", { count: visibleColumns.length })}
              </Typography>
              {search || availability !== "all" ? (
                <Button size="sm" variant="tertiary" onPress={clearFilters}>
                  {t("clearFilters")}
                </Button>
              ) : null}
            </div>

            {visibleColumns.length > 0 ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {visibleColumns.map((column, index) => (
                  <motion.div
                    key={column.id}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.65,
                      delay: Math.min(index, 5) * 0.05,
                      ease: pageEaseOut,
                    }}
                  >
                    <ColumnCard column={column} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card variant="secondary" className="mt-6">
                <Card.Header>
                  <Chip size="sm" variant="soft">
                    {t("noMatches")}
                  </Chip>
                  <Card.Title>{t("noMatchTitle")}</Card.Title>
                  <Card.Description>{t("noMatchHint")}</Card.Description>
                </Card.Header>
                <Card.Footer>
                  <Button size="sm" variant="secondary" onPress={clearFilters}>
                    {t("showAll")}
                  </Button>
                </Card.Footer>
              </Card>
            )}
          </>
        )}
      </motion.section>
    </div>
  );
}
