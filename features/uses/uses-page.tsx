"use client";

import { createPageReveal } from "@/lib/motion";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { PageFrame } from "@/components/layout/page-frame";

import { EmptyState } from "@heroui-pro/react";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Label,
  Link,
  SearchField,
  Surface,
  Tag,
  TagGroup,
  Typography,
  cn,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";

import {
  filterUsesCategories,
  getUsesItemCount,
  toSafeExternalUrl,
  usesData,
  type UsesCategory,
  type UsesItem,
} from "./uses-data";

interface UsesPageProps {
  compact?: boolean;
}

function hostnameFrom(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function UsesItemCard({ item }: { item: UsesItem }) {
  const t = useTranslations("Uses");
  const url = toSafeExternalUrl(item.link);

  return (
    <Card variant="secondary" className="h-full">
      <Card.Header>
        <Card.Title className="text-base">{item.name}</Card.Title>
        <Card.Description className="line-clamp-3 leading-6">{item.description}</Card.Description>
      </Card.Header>
      <Card.Footer className="mt-auto flex flex-col items-start gap-3">
        <div className="flex flex-wrap gap-2">
          {item.note ? (
            <Chip size="sm" variant="soft">
              {item.note}
            </Chip>
          ) : null}
          {item.tags?.map((tag) => (
            <Chip key={tag} size="sm" variant="tertiary">
              {tag}
            </Chip>
          ))}
        </div>
        {url ? (
          <Link
            aria-label={t("openNamed", { name: item.name })}
            className="text-sm"
            href={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {hostnameFrom(url)}
            <Link.Icon aria-hidden="true" />
          </Link>
        ) : null}
      </Card.Footer>
    </Card>
  );
}

function CategorySection({
  category,
  index,
  reveal,
}: {
  category: UsesCategory;
  index: number;
  reveal: ReturnType<typeof createPageReveal>["reveal"];
}) {
  const t = useTranslations("Uses");
  return (
    <motion.section
      key={category.name}
      aria-labelledby={`uses-category-${category.name}`}
      className="flex flex-col gap-6"
      {...reveal(index * 0.06, 20)}
    >
      <header>
        <div className="flex items-center gap-3">
          <Avatar className="size-10 shrink-0" size="sm" variant="soft">
            <Avatar.Fallback>
              <Icon aria-hidden="true" icon={category.icon} className="text-muted size-5" />
            </Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <Typography
              id={`uses-category-${category.name}`}
              type="h2"
              weight="bold"
              className="tracking-[-0.03em]"
            >
              {category.name}
            </Typography>
            <Typography color="muted" type="body-xs" className="mt-1 tabular-nums">
              {t("toolCount", { count: category.items.length })}
            </Typography>
          </div>
        </div>
        <Typography color="muted" type="body-sm" className="mt-4 max-w-sm leading-6">
          {category.description}
        </Typography>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {category.items.map((item) => (
          <UsesItemCard key={item.name} item={item} />
        ))}
      </div>
    </motion.section>
  );
}

export function UsesPage({ compact = false }: UsesPageProps) {
  const t = useTranslations("Uses");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotionPreference();
  const { reveal } = createPageReveal(shouldReduceMotion);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const deferredSearch = useDeferredValue(searchValue.trim().toLocaleLowerCase());

  const totalCount = useMemo(() => getUsesItemCount(usesData), []);
  const linkedCount = useMemo(
    () =>
      usesData.reduce(
        (count, category) => count + category.items.filter((item) => item.link).length,
        0
      ),
    []
  );
  const visibleCategories = useMemo(
    () =>
      filterUsesCategories(usesData, {
        query: deferredSearch,
        category: categoryFilter === "all" ? null : categoryFilter,
      }),
    [categoryFilter, deferredSearch]
  );
  const visibleCount = useMemo(() => getUsesItemCount(visibleCategories), [visibleCategories]);

  const handleCategoryChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [next] = Array.from(keys);
    if (typeof next === "string" && next.length > 0) {
      setCategoryFilter(next);
    }
  };

  const clearFilters = () => {
    setSearchValue("");
    setCategoryFilter("all");
  };

  const Container = compact ? "div" : PageFrame;

  return (
    <Surface variant="transparent" className={cn("w-full", compact ? undefined : "min-h-[100dvh]")}>
      <Container
        className={cn("mx-auto flex w-full flex-col gap-10", compact ? "w-full px-0" : "w-full")}
      >
        {!compact ? (
          <header className="border-default-200 grid gap-8 border-b pb-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <motion.div {...reveal(0, 10)}>
                <Chip size="sm" variant="secondary">
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
                <Typography
                  color="muted"
                  type="body"
                  className="mt-4 max-w-xl leading-7 text-balance"
                >
                  {t("description")}
                </Typography>
              </motion.div>
            </div>
            <motion.div {...reveal(0.1, 12)} className="grid grid-cols-3 gap-5 lg:min-w-80">
              <div className="border-default-200 border-l pl-3">
                <Typography className="font-mono text-3xl tabular-nums" type="body">
                  {totalCount.toLocaleString(locale)}
                </Typography>
                <Typography color="muted" type="body-xs" className="mt-1 leading-5">
                  {t("onTheDesk")}
                </Typography>
              </div>
              <div className="border-default-200 border-l pl-3">
                <Typography className="font-mono text-3xl tabular-nums" type="body">
                  {usesData.length.toLocaleString(locale)}
                </Typography>
                <Typography color="muted" type="body-xs" className="mt-1 leading-5">
                  {t("categories")}
                </Typography>
              </div>
              <div className="border-default-200 border-l pl-3">
                <Typography className="font-mono text-3xl tabular-nums" type="body">
                  {linkedCount.toLocaleString(locale)}
                </Typography>
                <Typography color="muted" type="body-xs" className="mt-1 leading-5">
                  {t("officialLinks")}
                </Typography>
              </div>
            </motion.div>
          </header>
        ) : null}

        <div className="border-default-200 flex flex-col gap-4 border-b pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchField
              className="w-full sm:max-w-sm"
              name="uses-search"
              value={searchValue}
              onChange={setSearchValue}
            >
              <Label className="sr-only">{t("searchLabel")}</Label>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder={t("searchPlaceholder")} />
                <SearchField.ClearButton aria-label={t("clearSearch")} />
              </SearchField.Group>
            </SearchField>
            <div className="flex min-h-9 items-center justify-between gap-4">
              <Typography aria-live="polite" color="muted" type="body-xs" role="status">
                {deferredSearch || categoryFilter !== "all"
                  ? t("matches", { count: visibleCount.toLocaleString(locale) })
                  : t("browse")}
              </Typography>
              {categoryFilter !== "all" && !deferredSearch ? (
                <Button size="sm" variant="tertiary" onPress={clearFilters}>
                  <Icon aria-hidden="true" icon="lucide:x" className="size-3.5" />
                  {t("clearFilters")}
                </Button>
              ) : null}
            </div>
          </div>

          <TagGroup
            aria-label={t("filterCategory")}
            selectedKeys={new Set([categoryFilter])}
            selectionMode="single"
            size="sm"
            variant="surface"
            onSelectionChange={handleCategoryChange}
          >
            <TagGroup.List className="flex-wrap">
              <Tag id="all" textValue={t("allTools")}>
                {t("all")}
                <span className="text-muted text-xs tabular-nums">{totalCount}</span>
              </Tag>
              {usesData.map((category) => (
                <Tag key={category.name} id={category.name} textValue={category.name}>
                  {category.name}
                  <span className="text-muted text-xs tabular-nums">{category.items.length}</span>
                </Tag>
              ))}
            </TagGroup.List>
          </TagGroup>
        </div>

        {visibleCategories.length === 0 ? (
          <EmptyState className="bg-surface-secondary rounded-2xl" size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Icon icon="gravity-ui:magnifier" aria-hidden="true" />
              </EmptyState.Media>
              <EmptyState.Title>{t("noMatchTitle")}</EmptyState.Title>
              <EmptyState.Description>{t("noMatchHint")}</EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button variant="outline" onPress={clearFilters}>
                {t("clearFilters")}
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <div className={compact ? "flex flex-col gap-16" : "flex flex-col gap-20"}>
            {visibleCategories.map((category, index) => (
              <CategorySection
                key={category.name}
                category={category}
                index={index}
                reveal={reveal}
              />
            ))}
          </div>
        )}
      </Container>
    </Surface>
  );
}
