"use client";

import { createPageReveal } from "@/lib/motion";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { EmptyState } from "@heroui-pro/react";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Label,
  Link,
  SearchField,
  Separator,
  Surface,
  Tag,
  TagGroup,
  Typography,
  cn,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
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
            aria-label={`Open ${item.name}`}
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
  return (
    <motion.section
      key={category.name}
      aria-labelledby={`uses-category-${category.name}`}
      className="grid gap-8 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:gap-12"
      {...reveal(index * 0.06, 20)}
    >
      <header className="self-start lg:sticky lg:top-28">
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
              {category.items.length} {category.items.length === 1 ? "tool" : "tools"}
            </Typography>
          </div>
        </div>
        <Typography color="muted" type="body-sm" className="mt-4 max-w-sm leading-6">
          {category.description}
        </Typography>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {category.items.map((item) => (
          <UsesItemCard key={item.name} item={item} />
        ))}
      </div>
    </motion.section>
  );
}

export function UsesPage({ compact = false }: UsesPageProps) {
  const shouldReduceMotion = useReducedMotionPreference();
  const { reveal } = createPageReveal(shouldReduceMotion);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const deferredSearch = useDeferredValue(searchValue.trim().toLocaleLowerCase());

  const totalCount = useMemo(() => getUsesItemCount(usesData), []);
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

  return (
    <Surface variant="transparent" className={cn("w-full", compact ? undefined : "min-h-[100dvh]")}>
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col",
          compact ? "gap-10 px-0" : "gap-10 px-6 py-24 sm:px-10 sm:py-32"
        )}
      >
        {!compact ? (
          <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <motion.div {...reveal(0, 10)}>
                <Chip size="sm" variant="secondary">
                  Uses
                </Chip>
              </motion.div>
              <motion.div {...reveal(0.06)}>
                <Typography
                  type="h1"
                  weight="bold"
                  className="mt-5 text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.05em] text-balance"
                >
                  The tools behind the work.
                </Typography>
              </motion.div>
              <motion.div {...reveal(0.12, 14)}>
                <Typography color="muted" type="body" className="mt-4 max-w-xl text-balance">
                  A small, evolving set of hardware and software that makes space for writing,
                  building, and paying attention.
                </Typography>
              </motion.div>
            </div>
            <motion.div {...reveal(0.1, 12)}>
              <Surface variant="secondary" className="rounded-2xl px-5 py-4">
                <Typography className="font-mono text-3xl tabular-nums" type="body">
                  {totalCount.toLocaleString("en-US")}
                </Typography>
                <Typography color="muted" type="body-sm" className="mt-1">
                  tools on the desk
                </Typography>
              </Surface>
            </motion.div>
          </header>
        ) : null}

        {!compact ? <Separator /> : null}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchField
              className="w-full sm:max-w-sm"
              name="uses-search"
              value={searchValue}
              onChange={setSearchValue}
            >
              <Label className="sr-only">Search tools</Label>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search tools, tags, or notes" />
                <SearchField.ClearButton aria-label="Clear tool search" />
              </SearchField.Group>
            </SearchField>
            <Typography aria-live="polite" color="muted" type="body-xs">
              {deferredSearch || categoryFilter !== "all"
                ? `${visibleCount.toLocaleString("en-US")} matches`
                : "Browse the toolkit"}
            </Typography>
          </div>

          <TagGroup
            aria-label="Filter tools by category"
            selectedKeys={new Set([categoryFilter])}
            selectionMode="single"
            size="sm"
            variant="surface"
            onSelectionChange={handleCategoryChange}
          >
            <TagGroup.List className="flex-wrap">
              <Tag id="all" textValue="All tools">
                All
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
              <EmptyState.Title>No tools match</EmptyState.Title>
              <EmptyState.Description>
                Try another search term or clear the category filter.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button variant="outline" onPress={clearFilters}>
                Clear filters
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
      </div>
    </Surface>
  );
}
