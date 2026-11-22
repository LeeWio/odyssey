"use client";

import { ArrowRight, ArrowRotateLeft } from "@gravity-ui/icons";
import { EmptyState, ItemCard, NumberValue, Segment } from "@heroui-pro/react";
import {
  Accordion,
  Alert,
  Button,
  Card,
  Chip,
  Description,
  Label,
  Link,
  ListBox,
  Meter,
  Pagination,
  SearchField,
  Select,
  ScrollShadow,
  Separator,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
} from "@heroui/react";
import { RouterProvider, type Key } from "react-aria-components";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useDebouncedCallback } from "use-debounce";
import { useEffect, useState } from "react";
import { selectIsAuthenticated } from "@/lib/features/auth";
import {
  useGetPublicColumnBySlugQuery,
  useGetPublicColumnsQuery,
  type ColumnResponse,
} from "@/lib/features/column";
import { type ReadingHistoryResponse, useGetLibraryOverviewQuery } from "@/lib/features/library";
import { useRetrieveDiscoveryQuery, useRetrieveFacetsQuery } from "@/lib/features/openapi";
import type { OpenApiComponents } from "@/lib/features/openapi/openapi.generated";
import { useGetFeaturedPostsQuery, useGetPublicPostDigestsQuery } from "@/lib/features/post";
import { parseJournalQuery } from "@/lib/features/post/journal-query";
import { useNearViewport } from "@/hooks/use-near-viewport";
import { useNormalizePageParam } from "@/lib/hooks/use-normalize-page-param";
import { useQueryState } from "@/lib/hooks/use-query-state";
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";
import { PageContainer } from "@/components/layout/page-container";
import type { PublicJournalInitialData } from "@/lib/features/post/server";
import {
  JournalHighlights,
  JournalHighlightSkeleton,
  JournalMasthead,
  JournalStoryList,
  JournalStoryListSkeleton,
} from "./journal-editorial";
import {
  formatJournalDate,
  journalPageNumbers,
  journalStoryHref,
  journalStoryKey,
  type JournalStory,
} from "./journal-story";

type ArchiveFacet = OpenApiComponents["schemas"]["ArchiveFacet"];
type CategoryFacet = OpenApiComponents["schemas"]["CategoryFacet"];
type CategoryGroup = OpenApiComponents["schemas"]["CategoryGroup"];
type TagFacet = OpenApiComponents["schemas"]["TagFacet"];
type Story = JournalStory;

function LatestPagination({
  onPageChange,
  page,
  pages,
  isDisabled = false,
}: {
  onPageChange: (page: number) => void;
  page: number;
  pages: number;
  isDisabled?: boolean;
}) {
  const t = useTranslations("Journal");
  if (pages <= 1) return null;

  return (
    <div className="w-full">
      <Pagination aria-label={t("indexPagination")} className="justify-center" size="sm">
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous
              isDisabled={isDisabled || page === 1}
              onPress={() => onPageChange(page - 1)}
            >
              <Pagination.PreviousIcon />
              <span>{t("previous")}</span>
            </Pagination.Previous>
          </Pagination.Item>
          <Pagination.Item className="px-2 sm:hidden">
            <Typography color="muted" type="body-xs" className="tabular-nums">
              {t("pageOf", { page, pages })}
            </Typography>
          </Pagination.Item>
          {journalPageNumbers(page, pages).map((item, index) =>
            item === "ellipsis" ? (
              <Pagination.Item className="hidden sm:flex" key={`ellipsis-${index}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item className="hidden sm:flex" key={item}>
                <Pagination.Link
                  isDisabled={isDisabled}
                  isActive={item === page}
                  onPress={() => onPageChange(item)}
                >
                  {item}
                </Pagination.Link>
              </Pagination.Item>
            )
          )}
          <Pagination.Item>
            <Pagination.Next
              isDisabled={isDisabled || page === pages}
              onPress={() => onPageChange(page + 1)}
            >
              <span>{t("next")}</span>
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </div>
  );
}

function CategoryList({
  categories,
}: {
  categories: Array<CategoryFacet & { id: number; name: string }>;
}) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const router = useRouter();
  if (categories.length === 0) return null;

  return (
    <Card variant="transparent" className="min-w-0 gap-4 rounded-none p-0">
      <Card.Header className="flex-row items-center justify-between">
        <div className="flex flex-col">
          <Card.Title className="text-sm">{t("topics")}</Card.Title>
        </div>
        <Link className="text-xs no-underline" href="/single/categories">
          {t("allCategories")}
        </Link>
      </Card.Header>
      <Card.Content>
        <ScrollShadow className="max-h-80">
          <ListBox
            aria-label={t("topics")}
            selectionMode="none"
            onAction={(key) => {
              const category = categories.find((item) => String(item.id) === String(key));
              if (category?.slug)
                router.push(`/single/categories/${encodeURIComponent(category.slug)}`);
            }}
          >
            {categories.map((category) => (
              <ListBox.Item key={category.id} id={String(category.id)} textValue={category.name}>
                <Label className="truncate">{category.name}</Label>
                <Chip className="ms-auto shrink-0" size="sm" variant="soft">
                  {(category.count ?? 0).toLocaleString(locale)}
                </Chip>
              </ListBox.Item>
            ))}
          </ListBox>
        </ScrollShadow>
      </Card.Content>
    </Card>
  );
}

function ContinueReading({ entries }: { entries: ReadingHistoryResponse[] }) {
  const t = useTranslations("Journal");
  const formatRelativeTime = useRelativeTime();
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="continue-reading-title" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <Typography id="continue-reading-title" type="h2" weight="semibold">
          {t("yourReading")}
        </Typography>
        <Link className="shrink-0 text-sm no-underline" href="/library">
          {t("library")}
          <Link.Icon />
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {entries.slice(0, 4).map(({ lastReadAt, post, positionAnchor, currentProgressPercent }) => (
          <ItemCard key={post.id} variant="transparent">
            <ItemCard.Content>
              <ItemCard.Title>
                <Link
                  className="text-foreground line-clamp-1 no-underline"
                  href={getReadingPositionHref(post.slug, positionAnchor)}
                >
                  {post.title}
                </Link>
              </ItemCard.Title>
              <ItemCard.Description>{formatRelativeTime(lastReadAt)}</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action className="w-28">
              <Meter
                aria-label={t("readingProgress", { title: post.title })}
                size="sm"
                value={currentProgressPercent}
              >
                <Meter.Track>
                  <Meter.Fill />
                </Meter.Track>
              </Meter>
            </ItemCard.Action>
          </ItemCard>
        ))}
      </div>
    </section>
  );
}

export function BlogIndex({ initialData }: { initialData: PublicJournalInitialData }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const router = useRouter();
  const { searchParams, updateQuery } = useQueryState();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const query = parseJournalQuery((key) => searchParams.get(key));
  const { categoryId: selectedCategoryId, page: latestPage } = query;
  const normalizedQuery = query.keyword ?? "";
  const [searchDraft, setSearchDraft] = useState(() => ({
    source: normalizedQuery,
    value: normalizedQuery,
  }));
  if (searchDraft.source !== normalizedQuery) {
    setSearchDraft({ source: normalizedQuery, value: normalizedQuery });
  }
  const searchValue = searchDraft.source === normalizedQuery ? searchDraft.value : normalizedQuery;
  const isDebouncingSearch = searchValue.trim() !== normalizedQuery;
  const requestedLatestPage = latestPage + 1;
  const hasArchiveFilters = Boolean(normalizedQuery || selectedCategoryId || isDebouncingSearch);
  const hasInitialLatest = Boolean(initialData.latest);
  const hasInitialFeatured = !hasArchiveFilters && Boolean(initialData.featured);
  const { ref: discoveryRef, isNear: isDiscoveryNear } = useNearViewport<HTMLDivElement>();
  const discoveryQuery = useRetrieveDiscoveryQuery(undefined, {
    skip: hasArchiveFilters || !isDiscoveryNear,
  });
  const facetsQuery = useRetrieveFacetsQuery();
  const featuredQuery = useGetFeaturedPostsQuery(
    { page: 0, size: 8 },
    { skip: hasArchiveFilters || hasInitialFeatured || (latestPage > 0 && !isDiscoveryNear) }
  );
  const latestQuery = useGetPublicPostDigestsQuery(query, {
    skip: isDebouncingSearch || hasInitialLatest,
    refetchOnMountOrArgChange: true,
  });
  const latestData = hasInitialLatest
    ? initialData.latest
    : isDebouncingSearch
      ? undefined
      : latestQuery.currentData;
  const isAdjustingPage =
    !latestQuery.isFetching &&
    !!latestData &&
    requestedLatestPage > Math.max(1, latestData.totalPages);
  const latestLoading =
    isDebouncingSearch ||
    isAdjustingPage ||
    (!hasInitialLatest && latestQuery.isLoading) ||
    (latestQuery.isFetching && !latestData);
  useNormalizePageParam(
    requestedLatestPage,
    latestData && !latestQuery.isFetching ? latestData.totalPages : undefined
  );
  const columnsQuery = useGetPublicColumnsQuery(undefined, {
    skip: hasArchiveFilters || !isDiscoveryNear,
  });
  const libraryQuery = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });

  const updateArchiveSearch = (changes: Record<string, string | undefined>) => {
    updateQuery(changes, { pathname: "/single", scroll: false });
  };
  const updateSearch = useDebouncedCallback((value: string) => {
    updateArchiveSearch({ q: value.trim() || undefined, page: undefined });
  }, 300);

  useEffect(() => () => updateSearch.cancel(), [normalizedQuery, updateSearch]);

  const discoveryData = discoveryQuery.data;
  const featuredPosts = hasInitialFeatured
    ? (initialData.featured?.list ?? [])
    : (featuredQuery.data?.list ?? []);
  const latestPool = latestLoading ? [] : (latestData?.list ?? []);
  const categories = (facetsQuery.data?.categories ?? []).filter(
    (category): category is CategoryFacet & { id: number; name: string } =>
      category.id != null && Boolean(category.name) && (category.count ?? 0) > 0
  );
  const tags = (facetsQuery.data?.tags ?? []).filter(
    (tag): tag is TagFacet & { id: number; name: string } =>
      tag.id != null && Boolean(tag.name) && (tag.count ?? 0) > 0
  );
  const archives = (facetsQuery.data?.archives ?? []).filter(
    (facet): facet is ArchiveFacet & { year: number } =>
      typeof facet.year === "number" && (facet.count ?? 0) > 0
  );
  const essayCount = hasArchiveFilters
    ? (latestData?.total ?? 0)
    : (facetsQuery.data?.totalPublishedCount ?? latestData?.total ?? 0);
  const trending = discoveryData?.trending ?? [];
  const mostRead = discoveryData?.mostRead ?? [];
  const hasDiscoveryRail =
    categories.length + tags.length + archives.length + trending.length + mostRead.length > 0;
  const openingSource =
    hasArchiveFilters || latestPage > 0
      ? []
      : featuredPosts.length > 0
        ? featuredPosts
        : latestPool;
  const lead = openingSource[0];
  const companions = openingSource.slice(1, 3);
  const shownSlugs = new Set(
    [lead, ...companions].flatMap((post) => (post?.slug ? [post.slug] : []))
  );
  const latestPosts = latestPool.filter((post) => !post.slug || !shownSlugs.has(post.slug));
  const openingLoading =
    !hasArchiveFilters &&
    latestPage === 0 &&
    (featuredQuery.isLoading || (featuredPosts.length === 0 && latestLoading));
  const archiveEmpty =
    !openingLoading && !latestLoading && !latestQuery.isError && !lead && latestPosts.length === 0;

  return (
    <RouterProvider navigate={router.push}>
      <PageContainer className="mx-auto flex min-h-dvh max-w-[76rem] flex-col gap-6 pt-19 pb-20 sm:gap-8 sm:pt-24 md:gap-9 lg:pt-28">
        <JournalMasthead />

        <div
          role="search"
          aria-label={t("searchArticles")}
          className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3"
        >
          <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_7.5rem] gap-2 sm:max-w-2xl sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-3">
            <SearchField
              className="min-w-0"
              name="article-search"
              value={searchValue}
              onChange={(value) => {
                setSearchDraft({ source: normalizedQuery, value });
                updateSearch(value);
              }}
            >
              <Label className="sr-only">{t("searchArticles")}</Label>
              <SearchField.Group className="min-h-11">
                <SearchField.SearchIcon />
                <SearchField.Input className="min-w-0" placeholder={t("searchArticles")} />
                {searchValue ? <SearchField.ClearButton aria-label={t("clearSearch")} /> : null}
              </SearchField.Group>
            </SearchField>
            <Select
              className="min-w-0"
              isDisabled={categories.length === 0}
              placeholder={t("allTopics")}
              value={selectedCategoryId ? String(selectedCategoryId) : "all"}
              onChange={(key) => {
                updateSearch.cancel();
                updateArchiveSearch({
                  q: searchValue.trim() || undefined,
                  category: key && key !== "all" ? String(key) : undefined,
                  page: undefined,
                });
              }}
            >
              <Label className="sr-only">{t("filterTopics")}</Label>
              <Select.Trigger className="min-h-11 items-center">
                <Select.Value className="min-w-0 truncate" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="min-w-52" placement="bottom end">
                <ListBox>
                  <ListBox.Item id="all" textValue={t("allTopics")}>
                    <Label>{t("allTopics")}</Label>
                  </ListBox.Item>
                  {categories.map((category) => (
                    <ListBox.Item
                      key={category.id}
                      id={String(category.id)}
                      textValue={category.name}
                    >
                      <Label className="min-w-0 wrap-anywhere">{category.name}</Label>
                      <Chip size="sm" variant="soft" className="ms-auto shrink-0">
                        {category.count?.toLocaleString(locale)}
                      </Chip>
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          {hasArchiveFilters ? (
            <Button
              className="min-h-10"
              variant="ghost"
              onPress={() => {
                updateSearch.cancel();
                setSearchDraft({ source: normalizedQuery, value: "" });
                updateArchiveSearch({ q: undefined, category: undefined, page: undefined });
              }}
            >
              {t("clearFilters")}
            </Button>
          ) : null}
        </div>

        {openingLoading ? <JournalHighlightSkeleton /> : null}
        {!openingLoading && lead ? <JournalHighlights lead={lead} companions={companions} /> : null}

        {!hasArchiveFilters && featuredQuery.isError ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t("featuredUnavailable")}</Alert.Title>
              <Alert.Description>{t("featuredUnavailableHint")}</Alert.Description>
            </Alert.Content>
            <Button variant="outline" onPress={() => void featuredQuery.refetch()}>
              {t("tryAgain")}
            </Button>
          </Alert>
        ) : null}

        <div className="flex min-w-0 flex-col gap-12 sm:gap-16">
          <div className="flex min-w-0 flex-col gap-11 sm:gap-14">
            <section
              aria-labelledby="latest-title"
              aria-busy={latestLoading || latestQuery.isFetching}
              className="relative flex min-w-0 flex-col gap-3"
            >
              <div className="flex items-baseline justify-between gap-4">
                <Typography
                  id="latest-title"
                  type="h2"
                  weight="semibold"
                  className="min-w-0 text-2xl tracking-tight wrap-anywhere"
                >
                  {normalizedQuery
                    ? t("searchResults")
                    : selectedCategoryId
                      ? (categories.find((category) => category.id === selectedCategoryId)?.name ??
                        t("latest"))
                      : t("latest")}
                </Typography>
                {!latestLoading && !latestQuery.isError ? (
                  <Typography
                    aria-live="polite"
                    type="body-xs"
                    className="text-foreground/75 shrink-0 tabular-nums"
                  >
                    {t("indexArticleCount", { count: essayCount })}
                  </Typography>
                ) : null}
              </div>
              {latestLoading ? (
                <JournalStoryListSkeleton />
              ) : latestQuery.isError ? (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{t("latestFailed")}</Alert.Title>
                    <Alert.Description>{t("latestFailedHint")}</Alert.Description>
                  </Alert.Content>
                  <Button
                    isDisabled={latestQuery.isFetching}
                    variant="outline"
                    onPress={() => void latestQuery.refetch()}
                  >
                    <ArrowRotateLeft aria-hidden="true" className="size-4" />
                    {t("tryAgain")}
                  </Button>
                  {latestPage > 0 ? (
                    <Button
                      variant="secondary"
                      onPress={() =>
                        updateArchiveSearch({
                          page: latestPage === 1 ? undefined : String(latestPage),
                        })
                      }
                    >
                      {t("previous")}
                    </Button>
                  ) : null}
                </Alert>
              ) : latestPool.length > 0 ? (
                <div className="flex min-w-0 flex-col gap-4">
                  <JournalStoryList posts={latestPosts.length > 0 ? latestPosts : latestPool} />
                  <LatestPagination
                    page={latestPage + 1}
                    pages={Math.max(1, latestData?.totalPages ?? 1)}
                    isDisabled={latestQuery.isFetching}
                    onPageChange={(page) => {
                      updateQuery(
                        { page: page <= 1 ? undefined : String(page) },
                        { pathname: "/single", scroll: true }
                      );
                    }}
                  />
                </div>
              ) : archiveEmpty ? (
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Title>
                      {t(hasArchiveFilters ? "noResultsTitle" : "emptyTitle")}
                    </EmptyState.Title>
                    <EmptyState.Description>
                      {t(hasArchiveFilters ? "noResultsDescription" : "emptyDescription")}
                    </EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              ) : null}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                ref={discoveryRef}
              />
            </section>

            <ContinueReading entries={libraryQuery.data?.continueReading ?? []} />

            {!hasArchiveFilters ? (
              <>
                <ColumnDecks
                  columns={(columnsQuery.data ?? []).filter((column) => column.isPublished)}
                />
                <CategoryShelves groups={discoveryData?.categoryGroups ?? []} />
              </>
            ) : null}
          </div>

          {!hasArchiveFilters && hasDiscoveryRail ? (
            <aside
              aria-label={t("exploreWriting")}
              className="border-separator grid min-w-0 gap-8 border-t pt-8 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]"
            >
              <Typography type="h2" className="sr-only">
                {t("exploreWriting")}
              </Typography>
              {mostRead.length + trending.length > 0 ? (
                <div className="min-w-0">
                  <AttentionCard mostRead={mostRead} trending={trending} />
                </div>
              ) : null}
              {categories.length > 0 ? (
                <div className="min-w-0">
                  <CategoryList categories={categories} />
                </div>
              ) : null}
              {tags.length > 0 ? (
                <div className="min-w-0">
                  <TagList tags={tags} />
                </div>
              ) : null}
              {archives.length > 0 ? (
                <div className="min-w-0">
                  <YearList archives={archives} />
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>

        {!hasArchiveFilters &&
        featuredPosts.some((post) => post.slug && !shownSlugs.has(post.slug)) ? (
          <>
            <Separator />
            <div className="min-w-0">
              <MoreFeaturedStories
                posts={featuredPosts.filter((post) => !post.slug || !shownSlugs.has(post.slug))}
              />
            </div>
          </>
        ) : null}
      </PageContainer>
    </RouterProvider>
  );
}

function AttentionCard({ mostRead, trending }: { mostRead: Story[]; trending: Story[] }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const router = useRouter();
  const panels = [
    trending.length > 0 ? { id: "trending", posts: trending, title: t("trending") } : null,
    mostRead.length > 0 ? { id: "most-read", posts: mostRead, title: t("mostRead") } : null,
  ].filter((panel) => panel != null);
  const [selected, setSelected] = useState<Key>(panels[0]?.id ?? "trending");
  const active = panels.find((panel) => panel.id === selected) ?? panels[0];
  if (!active) return null;

  return (
    <Card variant="transparent" className="min-w-0 gap-4 rounded-none p-0">
      <Card.Header className="flex-row flex-wrap items-center justify-between gap-3">
        <Segment
          aria-label={t("attention")}
          selectedKey={selected}
          size="sm"
          onSelectionChange={setSelected}
        >
          {trending.length > 0 ? <Segment.Item id="trending">{t("trending")}</Segment.Item> : null}
          {mostRead.length > 0 ? <Segment.Item id="most-read">{t("mostRead")}</Segment.Item> : null}
        </Segment>
        <Link
          className="shrink-0 text-xs no-underline"
          href={active.id === "most-read" ? "/single/reading/most" : "/single/reading/week"}
        >
          {t("all")}
        </Link>
      </Card.Header>
      <Card.Content className="p-1 pt-0">
        <ListBox
          aria-label={active.title}
          selectionMode="none"
          onAction={(key) => {
            const post = active.posts.find((item) => journalStoryKey(item) === String(key));
            if (post) router.push(journalStoryHref(post));
          }}
        >
          {active.posts.slice(0, 6).map((post, index) => {
            const title = post.title || t("untitledStory");
            const category = post.category?.name;

            return (
              <ListBox.Item
                key={journalStoryKey(post)}
                className="items-start"
                id={journalStoryKey(post)}
                textValue={title}
              >
                <span className="text-muted w-4 shrink-0 pt-0.5 text-xs tabular-nums">
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-col">
                  <Label className="line-clamp-2 w-full whitespace-normal">{title}</Label>
                  <Description>
                    {category ? `${category} · ` : null}
                    <NumberValue locale={locale} notation="compact" value={post.views ?? 0}>
                      {(formatted) => t("views", { count: formatted })}
                    </NumberValue>
                  </Description>
                </span>
              </ListBox.Item>
            );
          })}
        </ListBox>
      </Card.Content>
    </Card>
  );
}

function YearList({ archives }: { archives: Array<ArchiveFacet & { year: number }> }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const router = useRouter();
  const years = [
    ...archives
      .reduce((totals, facet) => {
        totals.set(facet.year, (totals.get(facet.year) ?? 0) + (facet.count ?? 0));
        return totals;
      }, new Map<number, number>())
      .entries(),
  ]
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => right - left);

  if (years.length === 0) return null;

  return (
    <Card variant="transparent" className="min-w-0 gap-4 rounded-none p-0">
      <Card.Header>
        <Card.Title className="text-sm">{t("years")}</Card.Title>
      </Card.Header>
      <Card.Content>
        <ListBox
          aria-label={t("years")}
          selectionMode="none"
          onAction={(key) => router.push(`/single/years/${key}`)}
        >
          {years.map(([year, count]) => (
            <ListBox.Item key={year} id={String(year)} textValue={String(year)}>
              <Label>{year}</Label>
              <Chip className="ms-auto shrink-0" size="sm" variant="soft">
                {count.toLocaleString(locale)}
              </Chip>
            </ListBox.Item>
          ))}
        </ListBox>
      </Card.Content>
    </Card>
  );
}

function TagList({ tags }: { tags: Array<TagFacet & { id: number; name: string }> }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const router = useRouter();
  if (tags.length === 0) return null;

  return (
    <Card variant="transparent" className="min-w-0 gap-4 rounded-none p-0">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-sm">{t("tags")}</Card.Title>
        <Link className="text-xs no-underline" href="/single/tags">
          {t("allTags")}
        </Link>
      </Card.Header>
      <Card.Content>
        <TagGroup
          aria-label={t("tags")}
          selectionMode="single"
          size="sm"
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const key = [...keys][0];
            if (key == null) return;
            const tag = tags.find((item) => String(item.id) === String(key));
            if (tag?.slug) router.push(`/single/tags/${encodeURIComponent(tag.slug)}`);
          }}
        >
          <TagGroup.List className="flex-wrap">
            {tags.map((tag) => (
              <Tag key={tag.id} id={String(tag.id)} textValue={tag.name} className="max-w-full">
                <span className="truncate">{tag.name}</span>
                <span className="text-muted shrink-0 text-xs tabular-nums">
                  {(tag.count ?? 0).toLocaleString(locale)}
                </span>
              </Tag>
            ))}
          </TagGroup.List>
        </TagGroup>
      </Card.Content>
    </Card>
  );
}

function StoryLinks({ posts }: { posts: Story[] }) {
  const t = useTranslations("Journal");
  return (
    <ul className="flex min-w-0 list-none flex-col">
      {posts.map((post) => (
        <li key={journalStoryKey(post)} className="min-w-0">
          <Link
            className="text-foreground hover:text-accent flex min-h-10 w-full items-center justify-between gap-3 text-sm no-underline"
            href={journalStoryHref(post)}
          >
            <span className="min-w-0 wrap-anywhere">{post.title || t("untitledStory")}</span>
            <Link.Icon aria-hidden="true">
              <ArrowRight />
            </Link.Icon>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ColumnDecks({ columns }: { columns: ColumnResponse[] }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const decks = columns.filter((column) => column.postsCount > 0 || column.posts.length > 0);
  const [selected, setSelected] = useState<Key>(decks[0]?.slug ?? "");
  const active = decks.find((column) => column.slug === selected) ?? decks[0];
  const detail = useGetPublicColumnBySlugQuery(active?.slug ?? "", { skip: !active });
  if (!active) return null;

  const column = detail.currentData ?? active;
  const updated = column.posts
    .map((post) => post.publishedAt)
    .reduce<string | null>(
      (latest, value) => (value && (!latest || value > latest) ? value : latest),
      null
    );

  return (
    <section aria-labelledby="columns-title" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Typography id="columns-title" type="h2" weight="semibold" className="text-2xl">
          {t("indexColumns")}
        </Typography>
        <Link className="text-sm no-underline" href="/columns">
          {t("viewAllColumns")}
          <Link.Icon />
        </Link>
      </div>
      {decks.length > 1 ? (
        <ScrollShadow hideScrollBar orientation="horizontal">
          <Segment
            aria-label={t("indexColumns")}
            className="w-max"
            selectedKey={active.slug}
            onSelectionChange={setSelected}
          >
            {decks.map((deck) => (
              <Segment.Item id={deck.slug} key={deck.slug}>
                {deck.name}
              </Segment.Item>
            ))}
          </Segment>
        </ScrollShadow>
      ) : null}
      <Card variant="secondary" className="gap-4 p-5 sm:p-6">
        <Card.Header className="gap-2">
          <Card.Title className="text-lg font-semibold">
            {column.name || t("untitledColumn")}
          </Card.Title>
          {column.description ? <Card.Description>{column.description}</Card.Description> : null}
          <Typography type="body-xs" color="muted">
            {[
              t("essays", { count: column.postsCount.toLocaleString(locale) }),
              updated ? t("updated", { date: formatJournalDate(updated, locale, "") }) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        </Card.Header>
        {column.posts.length > 0 ? (
          <Card.Content className="gap-0">
            <Separator />
            <StoryLinks posts={column.posts.slice(0, 4)} />
          </Card.Content>
        ) : detail.isLoading ? (
          <Skeleton className="h-16 w-full" aria-label={t("loadingStories")} />
        ) : null}
        <Card.Footer>
          <Link
            className="text-sm no-underline"
            href={"/columns/" + encodeURIComponent(column.slug)}
          >
            {t("viewColumn")}
            <Link.Icon />
          </Link>
        </Card.Footer>
      </Card>
    </section>
  );
}

function CategoryShelves({ groups }: { groups: CategoryGroup[] }) {
  const t = useTranslations("Journal");
  const shelves = groups.flatMap((group) => {
    if (!group.category?.name || !group.category.slug) return [];
    const posts = [group.heroPost, ...(group.supportingPosts ?? group.posts ?? [])].flatMap(
      (post) => (post?.slug ? [post] : [])
    );
    const unique = posts.filter(
      (post, index) => posts.findIndex((item) => item.slug === post.slug) === index
    );
    return unique.length
      ? [{ name: group.category.name, slug: group.category.slug, posts: unique }]
      : [];
  });
  if (shelves.length === 0) return null;

  return (
    <section aria-labelledby="archive-shelves-title" className="flex min-w-0 flex-col gap-3">
      <Typography id="archive-shelves-title" type="h2" weight="semibold" className="text-2xl">
        {t("fromTheArchive")}
      </Typography>
      <Accordion>
        {shelves.slice(0, 4).map(({ name, slug, posts }) => (
          <Accordion.Item id={slug} key={slug}>
            <Accordion.Heading>
              <Accordion.Trigger>
                <span className="min-w-0 wrap-anywhere">{name}</span>
                <Accordion.Indicator />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                <StoryLinks posts={posts.slice(0, 4)} />
                <Link
                  className="mt-2 w-fit text-sm no-underline"
                  href={"/single/categories/" + encodeURIComponent(slug)}
                >
                  {t("browseCategory", { name })}
                  <Link.Icon />
                </Link>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  );
}

function MoreFeaturedStories({ posts }: { posts: Story[] }) {
  const t = useTranslations("Journal");
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="featured-band-title" className="flex min-w-0 flex-col gap-3">
      <Typography id="featured-band-title" type="h2" weight="semibold" className="text-2xl">
        {t("moreFeaturedStories")}
      </Typography>
      <StoryLinks posts={posts.slice(0, 12)} />
    </section>
  );
}
