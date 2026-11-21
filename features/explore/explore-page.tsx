"use client";

import { createPageReveal, pageEaseOut } from "@/lib/motion";

import { Icon } from "@iconify/react";

import { EmptyState, Segment } from "@heroui-pro/react";
import {
  Button,
  Card,
  Chip,
  Label,
  Pagination,
  SearchField,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
} from "@heroui/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { motion, useReducedMotion } from "motion/react";

import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
import { PageFrame } from "@/components/layout/page-frame";
import type { PostResponse } from "@/lib/features/post";
import { useGetPublicPostsQuery } from "@/lib/features/post";
import { useRetrieveFacetsQuery } from "@/lib/features/openapi";
import { useNormalizePageParam } from "@/lib/hooks/use-normalize-page-param";
import { useQueryState } from "@/lib/hooks/use-query-state";

const PAGE_SIZE = 9;
const EXPLORE_GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] gap-5";
const EXPLORE_LIST = "grid gap-4";

type ExploreView = "grid" | "list";

type Facet = {
  id: number;
  name: string;
  count: number;
};

function parsePositiveInteger(value: string | null) {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function formatDate(value: string, locale: string, fallback: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getPageNumbers(page: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const current = page + 1;
  const values: Array<number | "ellipsis-start" | "ellipsis-end"> = [1];

  if (current > 3) values.push("ellipsis-start");
  for (
    let value = Math.max(2, current - 1);
    value <= Math.min(totalPages - 1, current + 1);
    value++
  ) {
    values.push(value);
  }
  if (current < totalPages - 2) values.push("ellipsis-end");
  values.push(totalPages);

  return values;
}

function normalizeFacets(
  values: Array<{ id?: number; name?: string; count?: number }> | undefined
): Facet[] {
  return (values ?? []).flatMap((value) => {
    if (typeof value.id !== "number" || !value.name || typeof value.count !== "number") return [];
    return [{ id: value.id, name: value.name, count: value.count }];
  });
}

function ExplorePostCard({ post, view }: { post: PostResponse; view: ExploreView }) {
  const t = useTranslations("Explore");
  const locale = useLocale();
  const isList = view === "list";
  return (
    <Link className="group block h-full no-underline" href={`/single/${post.slug}`}>
      <Card
        variant="secondary"
        className={`h-full overflow-hidden p-0 transition-transform duration-200 group-hover:-translate-y-1 ${
          isList ? "flex-row" : ""
        }`}
      >
        <SmartColorSurface
          seed={`explore-${post.slug}`}
          tone={getSmartColorTone({ categoryName: post.category?.name, title: post.title })}
          className={isList ? "min-h-36 w-32 shrink-0 sm:min-h-40 sm:w-56" : undefined}
        >
          <div
            aria-hidden="true"
            className={isList ? "h-full min-h-36 w-full" : "aspect-[16/9] w-full"}
          />
        </SmartColorSurface>
        <div className="flex min-w-0 flex-1 flex-col">
          <Card.Header>
            <div className="flex flex-wrap items-center gap-2">
              {post.category?.name ? (
                <Chip size="sm" variant="soft">
                  {post.category.name}
                </Chip>
              ) : null}
              {(post.tags ?? []).slice(0, 2).map((tag) => (
                <span key={tag.id} className="text-muted text-xs">
                  #{tag.name}
                </span>
              ))}
            </div>
            <Card.Title className="line-clamp-2 text-lg wrap-anywhere">{post.title}</Card.Title>
            {post.summary ? (
              <Card.Description className="line-clamp-2">{post.summary}</Card.Description>
            ) : null}
          </Card.Header>
          <Card.Footer className="mt-auto justify-between gap-3">
            <Typography color="muted" type="body-xs">
              {formatDate(post.createdAt, locale, t("recently"))}
            </Typography>
            <Typography
              color="muted"
              type="body-xs"
              className="flex shrink-0 items-center gap-1.5 tabular-nums"
            >
              <Icon icon="gravity-ui:eye" aria-hidden="true" className="size-3.5" />
              {post.views.toLocaleString(locale)}
            </Typography>
          </Card.Footer>
        </div>
      </Card>
    </Link>
  );
}

function ExploreSkeleton() {
  const t = useTranslations("Explore");
  return (
    <div aria-busy="true" aria-label={t("loading")} className={EXPLORE_GRID} role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} variant="secondary" className="overflow-hidden p-0">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <Card.Header>
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-6 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
          </Card.Header>
        </Card>
      ))}
    </div>
  );
}

function ExploreSearchField({
  query,
  onChange,
}: {
  query: string;
  onChange: (query: string) => void;
}) {
  const t = useTranslations("Explore");

  return (
    <SearchField
      fullWidth
      className="max-w-xl"
      name="explore-search"
      value={query}
      onChange={onChange}
    >
      <Label className="sr-only">{t("searchLabel")}</Label>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder={t("searchPlaceholder")} />
        <SearchField.ClearButton aria-label={t("clearSearch")} />
      </SearchField.Group>
    </SearchField>
  );
}

export function ExplorePage({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations("Explore");
  const locale = useLocale();
  const { searchParams, updateQuery: updateSearch } = useQueryState({ clientOnly: true });
  const shouldReduceMotion = useReducedMotion() ?? false;
  const selectedCategoryId = parsePositiveInteger(searchParams.get("category"));
  const selectedTagId = parsePositiveInteger(searchParams.get("tag"));
  const page = Math.max(0, (parsePositiveInteger(searchParams.get("page")) ?? 1) - 1);
  const view: ExploreView = searchParams.get("view") === "list" ? "list" : "grid";
  const queryFromUrl = searchParams.get("q") ?? "";
  const normalizedQuery = queryFromUrl.trim();
  const [searchDraft, setSearchDraft] = useState(queryFromUrl);
  const lastWrittenQuery = useRef(queryFromUrl);
  const commitQuery = useDebouncedCallback((draft: string) => {
    const locationQuery = new URLSearchParams(window.location.search);
    if (embedded && locationQuery.get("section") !== "explore") return;
    const query = draft.trim();
    if ((locationQuery.get("q") ?? "") === query) return;
    lastWrittenQuery.current = query;
    updateSearch({ page: undefined, q: query || undefined });
  }, 300);

  useEffect(() => {
    if (lastWrittenQuery.current === queryFromUrl) return;
    commitQuery.cancel();
    lastWrittenQuery.current = queryFromUrl;
    setSearchDraft(queryFromUrl);
  }, [commitQuery, queryFromUrl]);

  useEffect(() => {
    const restoreQuery = () => {
      commitQuery.cancel();
      const query = new URLSearchParams(window.location.search).get("q") ?? "";
      lastWrittenQuery.current = query;
      setSearchDraft(query);
    };
    window.addEventListener("popstate", restoreQuery);
    return () => {
      window.removeEventListener("popstate", restoreQuery);
      commitQuery.cancel();
    };
  }, [commitQuery]);

  const facetsQuery = useRetrieveFacetsQuery();
  const postsQuery = useGetPublicPostsQuery({
    categoryId: selectedCategoryId,
    keyword: normalizedQuery || undefined,
    page,
    size: PAGE_SIZE,
    tagId: selectedTagId,
  });
  useNormalizePageParam(
    page + 1,
    postsQuery.currentData && !postsQuery.isFetching
      ? postsQuery.currentData.totalPages
      : undefined,
    { clientOnly: true }
  );

  const categories = useMemo(
    () => normalizeFacets(facetsQuery.data?.categories).filter((facet) => facet.count > 0),
    [facetsQuery.data?.categories]
  );
  const tags = useMemo(
    () => normalizeFacets(facetsQuery.data?.tags).filter((facet) => facet.count > 0),
    [facetsQuery.data?.tags]
  );
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const selectedTag = tags.find((tag) => tag.id === selectedTagId);
  const results = postsQuery.currentData;
  const isLoading = postsQuery.isLoading || (postsQuery.isFetching && !results);
  const posts = results?.list ?? [];
  const totalPages = results?.totalPages ?? 0;
  const startItem = results && results.total > 0 ? page * results.size + 1 : 0;
  const endItem = results ? Math.min((page + 1) * results.size, results.total) : 0;
  const hasActiveFilters = Boolean(selectedCategoryId || selectedTagId || normalizedQuery);

  const handleCategoryChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [key] = Array.from(keys);
    const categoryId = String(key) === "all" ? undefined : String(key).replace("category-", "");
    updateSearch({ category: categoryId, page: undefined });
  };

  const handleTagChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [key] = Array.from(keys);
    const tagId = String(key) === "all" ? undefined : String(key).replace("tag-", "");
    updateSearch({ page: undefined, tag: tagId });
  };

  const handlePageChange = (nextPage: number) => {
    updateSearch({ page: String(nextPage + 1) });
    document
      .getElementById("explore-results")
      ?.scrollIntoView({ behavior: "auto", block: "start" });
  };

  const handleViewChange = (key: React.Key) => {
    if (key !== "grid" && key !== "list") return;
    updateSearch({ view: key });
  };

  const clearFilters = () => {
    commitQuery.cancel();
    lastWrittenQuery.current = "";
    setSearchDraft("");
    updateSearch({ category: undefined, page: undefined, q: undefined, tag: undefined });
  };

  const resultsTitle = normalizedQuery
    ? t("resultsFor", { query: normalizedQuery })
    : selectedCategory?.name || selectedTag?.name || t("allWriting");

  const { revealInView } = createPageReveal(shouldReduceMotion);

  const Shell = embedded ? "div" : PageFrame;

  return (
    <Shell className={embedded ? "bg-background w-full pt-10" : "bg-background"}>
      <div className="w-full">
        <header className="border-separator grid gap-8 border-b pb-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <motion.div {...revealInView(0, 10)}>
              <Chip size="sm">{t("eyebrow")}</Chip>
            </motion.div>
            <motion.div {...revealInView(0.06)}>
              <Typography
                type="h1"
                weight="bold"
                className="mt-4 text-4xl leading-none tracking-normal text-balance wrap-anywhere sm:text-5xl lg:text-6xl"
              >
                {t("title")}
              </Typography>
            </motion.div>
            <motion.div {...revealInView(0.12, 14)}>
              <Typography color="muted" type="body" className="mt-3 max-w-xl text-balance">
                {t("description")}
              </Typography>
            </motion.div>
          </div>
          <div className="flex items-center gap-3 lg:pb-1">
            <Icon icon="gravity-ui:book-open" aria-hidden="true" className="text-muted size-5" />
            <div>
              <Typography className="font-mono text-3xl tabular-nums" type="body">
                {(facetsQuery.data?.totalPublishedCount ?? 0).toLocaleString(locale)}
              </Typography>
              <Typography color="muted" type="body-xs">
                {t("publishedArticles")}
              </Typography>
            </div>
          </div>
        </header>

        <motion.section
          aria-label={t("filters")}
          className="border-separator mt-10 border-b pb-8"
          {...revealInView(0.18, 16)}
        >
          <ExploreSearchField
            query={searchDraft}
            onChange={(value) => {
              setSearchDraft(value);
              commitQuery(value);
            }}
          />

          <div className="mt-7 grid gap-7">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <Icon
                  icon="gravity-ui:book-open"
                  aria-hidden="true"
                  className="text-muted size-4"
                />
                <Typography type="body-sm" weight="semibold">
                  {t("topics")}
                </Typography>
              </div>
              {facetsQuery.isLoading ? (
                <div className="flex gap-2">
                  {["w-20", "w-28", "w-24", "w-32"].map((width) => (
                    <Skeleton key={width} className={`h-8 ${width} rounded-full`} />
                  ))}
                </div>
              ) : categories.length > 0 ? (
                <TagGroup
                  aria-label={t("filterTopics")}
                  selectedKeys={
                    new Set([selectedCategoryId ? `category-${selectedCategoryId}` : "all"])
                  }
                  selectionMode="single"
                  size="sm"
                  variant="surface"
                  onSelectionChange={handleCategoryChange}
                >
                  <TagGroup.List className="flex-wrap">
                    <Tag id="all" textValue={t("allTopics")}>
                      {t("allTopics")}
                      <span className="text-muted text-xs tabular-nums">
                        {facetsQuery.data?.totalPublishedCount ?? 0}
                      </span>
                    </Tag>
                    {categories.map((category) => (
                      <Tag
                        key={category.id}
                        id={`category-${category.id}`}
                        textValue={category.name}
                      >
                        {category.name}
                        <span className="text-muted text-xs tabular-nums">{category.count}</span>
                      </Tag>
                    ))}
                  </TagGroup.List>
                </TagGroup>
              ) : facetsQuery.isError ? (
                <Button size="sm" variant="secondary" onPress={() => facetsQuery.refetch()}>
                  <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" className="size-4" />
                  {t("reloadTopics")}
                </Button>
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <Icon icon="gravity-ui:hashtag" aria-hidden="true" className="text-muted size-4" />
                <Typography type="body-sm" weight="semibold">
                  {t("tags")}
                </Typography>
              </div>
              {facetsQuery.isLoading ? (
                <div className="flex gap-2">
                  {["w-16", "w-24", "w-20", "w-28", "w-20"].map((width, index) => (
                    <Skeleton key={`${width}-${index}`} className={`h-8 ${width} rounded-full`} />
                  ))}
                </div>
              ) : tags.length > 0 ? (
                <TagGroup
                  aria-label={t("filterTags")}
                  selectedKeys={new Set([selectedTagId ? `tag-${selectedTagId}` : "all"])}
                  selectionMode="single"
                  size="sm"
                  variant="surface"
                  onSelectionChange={handleTagChange}
                >
                  <TagGroup.List className="flex-wrap">
                    <Tag id="all" textValue={t("allTags")}>
                      {t("allTags")}
                    </Tag>
                    {tags.map((tag) => (
                      <Tag key={tag.id} id={`tag-${tag.id}`} textValue={tag.name}>
                        #{tag.name}
                        <span className="text-muted text-xs tabular-nums">{tag.count}</span>
                      </Tag>
                    ))}
                  </TagGroup.List>
                </TagGroup>
              ) : null}
            </div>

            <div className="border-default-200 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted flex items-center gap-2 text-sm">
                <Icon icon="gravity-ui:calendar" aria-hidden="true" className="size-4" />
                {t("preferDate")}
              </div>
              <Link
                className="text-accent inline-flex items-center gap-2 text-sm font-medium no-underline"
                href="/archive"
              >
                {t("browseByDate")}
                <Icon icon="gravity-ui:arrow-right" aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="explore-results"
          aria-busy={postsQuery.isFetching}
          aria-labelledby="explore-results-title"
          className="scroll-mt-28 pt-14"
          {...revealInView(0.22, 20)}
        >
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Typography id="explore-results-title" type="h2" weight="semibold">
                {resultsTitle}
              </Typography>
              <Typography aria-live="polite" color="muted" type="body-sm" className="mt-1">
                {results
                  ? t("articlesFound", { count: results.total.toLocaleString(locale) })
                  : t("searching")}
              </Typography>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Segment
                aria-label={t("viewMode")}
                selectedKey={view}
                size="sm"
                onSelectionChange={handleViewChange}
              >
                <Segment.Item id="grid">
                  <Icon icon="gravity-ui:rectangles-4" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">{t("gridView")}</span>
                </Segment.Item>
                <Segment.Item id="list">
                  <Icon icon="gravity-ui:list-ul" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">{t("listView")}</span>
                </Segment.Item>
              </Segment>
              {hasActiveFilters ? (
                <Button size="sm" variant="ghost" onPress={clearFilters}>
                  <Icon icon="gravity-ui:xmark" aria-hidden="true" className="size-4" />
                  {t("clearFilters")}
                </Button>
              ) : null}
            </div>
          </div>

          {isLoading ? <ExploreSkeleton /> : null}

          {!isLoading && postsQuery.isError ? (
            <EmptyState size="lg">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <Icon icon="gravity-ui:book-open" aria-hidden="true" />
                </EmptyState.Media>
                <EmptyState.Title>{t("unavailable")}</EmptyState.Title>
                <EmptyState.Description>{t("unavailableHint")}</EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button variant="outline" onPress={() => postsQuery.refetch()}>
                  <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" />
                  {t("tryAgain")}
                </Button>
              </EmptyState.Content>
            </EmptyState>
          ) : null}

          {!isLoading && !postsQuery.isError && posts.length === 0 ? (
            <EmptyState size="lg">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <Icon icon="gravity-ui:book-open" aria-hidden="true" />
                </EmptyState.Media>
                <EmptyState.Title>{t("emptyTitle")}</EmptyState.Title>
                <EmptyState.Description>{t("emptyHint")}</EmptyState.Description>
              </EmptyState.Header>
              {hasActiveFilters ? (
                <EmptyState.Content>
                  <Button variant="outline" onPress={clearFilters}>
                    {t("clearFilters")}
                  </Button>
                </EmptyState.Content>
              ) : null}
            </EmptyState>
          ) : null}

          {!isLoading && !postsQuery.isError && posts.length > 0 ? (
            <div
              className={view === "list" ? EXPLORE_LIST : EXPLORE_GRID}
              data-testid="explore-results"
              data-view={view}
            >
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.65,
                    delay: Math.min(index, 5) * 0.05,
                    ease: pageEaseOut,
                  }}
                >
                  <ExplorePostCard post={post} view={view} />
                </motion.div>
              ))}
            </div>
          ) : null}

          {!isLoading && !postsQuery.isError && totalPages > 1 ? (
            <Pagination className="mt-12 w-full" size="sm">
              <Pagination.Summary>
                {t("showing", {
                  start: startItem,
                  end: endItem,
                  total: results?.total ?? 0,
                })}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 0}
                    onPress={() => handlePageChange(page - 1)}
                  >
                    <Pagination.PreviousIcon />
                    <span>{t("previous")}</span>
                  </Pagination.Previous>
                </Pagination.Item>
                {getPageNumbers(page, totalPages).map((value) =>
                  typeof value === "number" ? (
                    <Pagination.Item key={value}>
                      <Pagination.Link
                        isActive={value === page + 1}
                        onPress={() => handlePageChange(value - 1)}
                      >
                        {value}
                      </Pagination.Link>
                    </Pagination.Item>
                  ) : (
                    <Pagination.Item key={value}>
                      <Pagination.Ellipsis />
                    </Pagination.Item>
                  )
                )}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page >= totalPages - 1}
                    onPress={() => handlePageChange(page + 1)}
                  >
                    <span>{t("next")}</span>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          ) : null}
        </motion.section>

        <div className="border-default-200 mt-16 flex flex-col gap-3 border-t pt-7 sm:flex-row sm:items-center sm:justify-between">
          <Typography color="muted" type="body-sm">
            {t("preferColumn")}
          </Typography>
          <Link
            className="text-accent inline-flex items-center gap-2 text-sm font-medium no-underline"
            href="/columns"
          >
            {t("browseColumns")}
            <Icon icon="gravity-ui:arrow-right" aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </Shell>
  );
}
