"use client";

import { Icon } from "@iconify/react";
import { Carousel } from "@heroui-pro/react/carousel";
import { EmptyState, ItemCard, NumberValue, Segment } from "@heroui-pro/react";
import {
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
  ScrollShadow,
  Separator,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
} from "@heroui/react";
import type { Key } from "react-aria-components/Breadcrumbs";
import { useRouter, useSearchParams } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);
import { useLocale, useTranslations } from "next-intl";
import { useDebouncedCallback } from "use-debounce";
import { useEffect, useRef, useState } from "react";
import { selectIsAuthenticated } from "@/lib/features/auth";
import {
  useGetPublicColumnBySlugQuery,
  useGetPublicColumnsQuery,
  type ColumnResponse,
} from "@/lib/features/column";
import { type ReadingHistoryResponse, useGetLibraryOverviewQuery } from "@/lib/features/library";
import { useRetrieveDiscoveryQuery, useRetrieveFacetsQuery } from "@/lib/features/openapi";
import type { OpenApiComponents } from "@/lib/features/openapi/openapi.generated";
import { useGetFeaturedPostsQuery, useGetPublicPostsQuery } from "@/lib/features/post";
import { ColumnArticleStack } from "@/features/column/column-article-stack";
import { useNormalizePageParam } from "@/lib/hooks/use-normalize-page-param";
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";
import { parsePageParam } from "@/lib/utils/pagination";
import { PageContainer } from "@/components/layout/page-container";
import { ArticleCard } from "@/components/card/article-card";
import { ArticleCover } from "@/components/card/article-cover";

const JOURNAL_STORY_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] gap-x-8 gap-y-0";
const LATEST_PAGE_SIZE = 12;

type ArchiveFacet = OpenApiComponents["schemas"]["ArchiveFacet"];
type CategoryFacet = OpenApiComponents["schemas"]["CategoryFacet"];
type CategoryGroup = OpenApiComponents["schemas"]["CategoryGroup"];
type TagFacet = OpenApiComponents["schemas"]["TagFacet"];
type Story = {
  id?: number;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  coverImage?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  category?: { name?: string | null } | null;
  views?: number;
  likesCount?: number;
  commentsCount?: number;
  isInReadingList?: boolean | null;
  publishedAt?: string | null;
  createdAt?: string | null;
};

function formatDate(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function storyDate(post: Story) {
  if ("publishedAt" in post && post.publishedAt) return post.publishedAt;
  return "createdAt" in post ? post.createdAt : undefined;
}

function storyHref(post: Story) {
  return post.slug ? `/single/${post.slug}` : "/single";
}

function storyKey(post: Story) {
  return post.slug ?? String(post.id ?? "");
}

function FeatureCard({
  delay = 0,
  featured = false,
  post,
}: {
  delay?: number;
  featured?: boolean;
  post: Story;
}) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const meta = [post.category?.name, formatDate(storyDate(post), locale, t("recentlyPublished"))]
    .filter(Boolean)
    .join(" · ");
  const title = post.title || t("untitledStory");
  const seed = String(post.id ?? post.slug ?? title);

  return (
    <article
      data-journal-reveal=""
      data-journal-order={delay > 0 ? "2" : "1"}
      className={
        featured
          ? "min-w-0"
          : "border-separator min-w-0 border-t py-6 first:border-t-0 first:pt-0 last:pb-0"
      }
      data-testid={featured ? "journal-lead" : "journal-companion"}
    >
      <Link
        className={
          featured
            ? "group relative flex h-80 w-full flex-col justify-end overflow-hidden rounded-lg text-white no-underline sm:h-96 2xl:h-112"
            : "group text-foreground flex w-full items-start gap-5 no-underline"
        }
        href={storyHref(post)}
      >
        {featured ? <ArticleCover seed={seed} /> : null}
        <div
          className={
            featured
              ? "relative flex min-w-0 flex-col gap-3 bg-gradient-to-t from-black/90 via-black/65 to-transparent p-6 pt-20 sm:p-8 sm:pt-24"
              : "flex min-w-0 flex-1 flex-col gap-3"
          }
        >
          <span className="text-xs text-white/80">{meta}</span>
          <Typography
            type="h3"
            weight="semibold"
            className={
              featured
                ? "line-clamp-3 text-2xl leading-tight tracking-normal wrap-anywhere text-white sm:text-3xl 2xl:text-4xl"
                : "group-hover:text-accent line-clamp-3 text-xl leading-snug tracking-normal wrap-anywhere"
            }
          >
            {title}
          </Typography>
          {post.summary ? (
            <Typography
              type="body-sm"
              className={`line-clamp-2 leading-6 ${featured ? "text-white/85" : "text-muted"}`}
            >
              {post.summary}
            </Typography>
          ) : null}
          <span className={`mt-1 text-xs ${featured ? "text-white/75" : "text-muted"}`}>
            {post.authorName || t("recentlyPublished")}
          </span>
        </div>
        {!featured ? (
          <div className="relative isolate aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md sm:w-32">
            <ArticleCover seed={seed} />
          </div>
        ) : null}
      </Link>
    </article>
  );
}

function FeatureMosaic({ lead, companions }: { lead: Story; companions: Story[] }) {
  return (
    <div
      className={`grid min-w-0 gap-8 lg:gap-10 ${companions.length > 0 ? "lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]" : ""}`}
      data-testid="journal-feature-layout"
    >
      <FeatureCard featured post={lead} />
      {companions.length > 0 ? (
        <div className="flex min-w-0 flex-col justify-center">
          {companions.map((post, index) => (
            <FeatureCard key={post.id ?? post.slug} delay={0.06 * (index + 1)} post={post} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function pageNumbers(page: number, totalPages: number) {
  const pages: (number | "ellipsis")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (page > 3) {
      pages.push("ellipsis");
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push("ellipsis");
    }

    pages.push(totalPages);
  }

  return pages;
}

function parsePositiveInteger(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

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
    <div className="w-full overflow-x-auto">
      <Pagination className="justify-center" size="sm">
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
          {pageNumbers(page, pages).map((item, index) =>
            item === "ellipsis" ? (
              <Pagination.Item key={`ellipsis-${index}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={item}>
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

function StoryRow({ post }: { post: Story }) {
  return <ArticleCard post={post} />;
}

function columnUpdatedAt(column: ColumnResponse) {
  const stamps = column.posts
    .map((post) => post.publishedAt)
    .filter((value): value is string => Boolean(value));
  if (stamps.length === 0) return column.createdAt || null;
  return stamps.reduce((latest, value) => (value > latest ? value : latest));
}

function columnCadence(column: ColumnResponse, t: (key: string) => string) {
  const stamps = column.posts
    .map((post) => (post.publishedAt ? new Date(post.publishedAt).getTime() : Number.NaN))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b);
  if (stamps.length < 2) return t("occasional");
  const spanDays = (stamps[stamps.length - 1] - stamps[0]) / 86_400_000;
  const gap = spanDays / (stamps.length - 1);
  if (gap <= 10) return t("weekly");
  if (gap <= 40) return t("monthly");
  return t("occasional");
}

function ColumnDeck({ column }: { column: ColumnResponse }) {
  const t = useTranslations("Journal");
  const name = column.name || t("untitledColumn");
  const locale = useLocale();
  if (column.posts.length === 0) return null;

  const updated = columnUpdatedAt(column);

  return (
    <article className="flex min-w-0 flex-col gap-4">
      {column.description ? (
        <Typography className="line-clamp-2" color="muted" type="body-sm">
          {column.description}
        </Typography>
      ) : null}
      <p className="text-muted text-xs">
        {[
          t("essays", { count: column.postsCount.toLocaleString(locale) }),
          columnCadence(column, t),
          updated ? t("updated", { date: formatDate(updated, locale, "") }) : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <ColumnArticleStack posts={column.posts} title={name} />
      <Link className="w-fit text-sm no-underline" href={`/columns/${column.slug}`}>
        {t("viewColumn")}
        <Link.Icon />
      </Link>
    </article>
  );
}

function ColumnDeckPreview({ column }: { column: ColumnResponse }) {
  const detail = useGetPublicColumnBySlugQuery(column.slug);
  const resolved = detail.data ?? column;
  if (detail.isLoading && resolved.posts.length === 0) {
    return <Skeleton className="h-80 w-full rounded-lg" />;
  }
  return <ColumnDeck column={resolved} />;
}

function ColumnDecks({ columns }: { columns: ColumnResponse[] }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const decks = columns.filter((column) => column.postsCount > 0 || column.posts.length > 0);
  const [selected, setSelected] = useState(decks[0]?.slug ?? "");
  const active = decks.find((column) => column.slug === selected) ?? decks[0];
  const rest = decks.filter((column) => column.slug !== active?.slug);
  if (!active) return null;

  return (
    <section aria-labelledby="columns-title" className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <Typography id="columns-title" type="h2" weight="semibold">
          {t("columns")}
        </Typography>
        <Link className="text-sm no-underline" href="/columns">
          {t("viewAllColumns")}
          <Link.Icon />
        </Link>
      </div>
      <div className="grid min-w-0 items-start gap-8 md:grid-cols-2">
        <ColumnDeckPreview column={active} />
        {rest.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Typography type="body-sm" weight="semibold">
              {t("nextColumn")}
            </Typography>
            {rest.map((column) => {
              const updated = columnUpdatedAt(column);
              return (
                <Button
                  key={column.slug}
                  variant="tertiary"
                  onPress={() => setSelected(column.slug)}
                >
                  <span className="text-sm font-semibold">{column.name}</span>
                  <span className="text-muted line-clamp-2 text-xs">{column.description}</span>
                  <span className="text-muted text-xs">
                    {[
                      t("essays", { count: column.postsCount.toLocaleString(locale) }),
                      updated ? t("updated", { date: formatDate(updated, locale, "") }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Button>
              );
            })}
            <Link className="px-1 text-sm no-underline" href={`/columns/${active.slug}`}>
              {t("followColumn")}
              <Link.Icon />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
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
      <Card.Content className="p-0">
        <ScrollShadow className="max-h-80">
          <ListBox
            aria-label={t("topics")}
            className="w-full p-1"
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
        {entries.slice(0, 4).map(({ lastReadAt, post, positionAnchor, progressPercent }) => (
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
                value={progressPercent}
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

function JournalSkeleton() {
  const t = useTranslations("Journal");

  return (
    <div
      aria-busy="true"
      aria-label={t("loadingStories")}
      className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]"
      role="status"
    >
      <Skeleton className="h-80 w-full rounded-lg sm:h-96 2xl:h-112" />
      <div className="flex flex-col justify-center gap-6">
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-36 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function JournalPage() {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const normalizedQuery = (searchParams.get("q") ?? "").trim();
  const [searchDraft, setSearchDraft] = useState(() => ({
    source: normalizedQuery,
    value: normalizedQuery,
  }));
  if (searchDraft.source !== normalizedQuery) {
    setSearchDraft({ source: normalizedQuery, value: normalizedQuery });
  }
  const searchValue = searchDraft.source === normalizedQuery ? searchDraft.value : normalizedQuery;
  const isDebouncingSearch = searchValue.trim() !== normalizedQuery;
  const selectedCategoryId = parsePositiveInteger(searchParams.get("category"));
  const discoveryQuery = useRetrieveDiscoveryQuery();
  const facetsQuery = useRetrieveFacetsQuery();
  const featuredQuery = useGetFeaturedPostsQuery({ page: 0, size: 8 });
  const requestedLatestPage = parsePageParam(searchParams.get("page"));
  const latestPage = requestedLatestPage - 1;
  const latestQuery = useGetPublicPostsQuery(
    {
      categoryId: selectedCategoryId,
      keyword: normalizedQuery || undefined,
      page: latestPage,
      size: LATEST_PAGE_SIZE,
    },
    { skip: isDebouncingSearch, refetchOnMountOrArgChange: true }
  );
  const latestData = isDebouncingSearch ? undefined : latestQuery.currentData;
  const isAdjustingPage =
    latestQuery.isSuccess &&
    !latestQuery.isFetching &&
    !!latestData &&
    requestedLatestPage > Math.max(1, latestData.totalPages);
  const latestLoading =
    isDebouncingSearch ||
    isAdjustingPage ||
    latestQuery.isLoading ||
    (latestQuery.isFetching && !latestData);
  useNormalizePageParam(
    requestedLatestPage,
    latestData && !latestQuery.isFetching && latestQuery.isSuccess
      ? latestData.totalPages
      : undefined
  );
  const columnsQuery = useGetPublicColumnsQuery();
  const libraryQuery = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });

  const updateArchiveSearch = (changes: Record<string, string | undefined>) => {
    const query = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value) query.set(key, value);
      else query.delete(key);
    });
    const serialized = query.toString();
    router.replace(serialized ? `/single?${serialized}` : "/single", { scroll: false });
  };
  const updateSearch = useDebouncedCallback((value: string) => {
    updateArchiveSearch({ q: value.trim() || undefined, page: undefined });
  }, 300);

  useEffect(() => () => updateSearch.cancel(), [normalizedQuery, updateSearch]);

  const discovery = discoveryQuery.data;
  const featuredPosts = featuredQuery.data?.list ?? [];
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
  const hasArchiveFilters = Boolean(normalizedQuery || selectedCategoryId || isDebouncingSearch);
  const essayCount = hasArchiveFilters
    ? (latestData?.total ?? 0)
    : (facetsQuery.data?.totalPublishedCount ?? latestData?.total ?? 0);
  const pageRef = useRef<HTMLDivElement>(null);
  const contentReady = !discoveryQuery.isLoading && !featuredQuery.isLoading;

  useGSAP(
    () => {
      const root = pageRef.current;
      if (!root || !contentReady) return;
      const pieces = root.querySelectorAll<HTMLElement>("[data-journal-reveal]");
      const motion = gsap.matchMedia();
      motion.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(pieces, {
          autoAlpha: 0,
          duration: 0.28,
          ease: "power3.out",
          stagger: 0.04,
          y: 12,
        });
      });
      return () => motion.revert();
    },
    { dependencies: [contentReady], scope: pageRef, revertOnUpdate: true }
  );

  const trending = discovery?.trending ?? [];
  const mostRead = discovery?.mostRead ?? [];
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
  const latestPosts = hasArchiveFilters
    ? latestPool
    : latestPool.filter((post) => !post.slug || !shownSlugs.has(post.slug));
  const openingLoading =
    !hasArchiveFilters &&
    latestPage === 0 &&
    (featuredQuery.isLoading || (featuredPosts.length === 0 && latestLoading));
  const archiveEmpty =
    !openingLoading && !latestLoading && !latestQuery.isError && !lead && latestPosts.length === 0;

  return (
    <div ref={pageRef} className="bg-background min-h-dvh w-full pt-28 pb-24 lg:pt-32">
      <PageContainer className="flex flex-col gap-10 md:gap-12">
        <header className="border-separator flex min-w-0 flex-col gap-6 border-b pb-8 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 flex-col gap-4">
            <Typography
              type="h1"
              weight="bold"
              className="font-display text-4xl leading-none tracking-normal sm:text-5xl lg:text-6xl"
            >
              {t("title")}
            </Typography>
            <Typography color="muted" className="max-w-xl text-pretty">
              {t("description")}
            </Typography>
          </div>
          <nav
            aria-label={t("browseArchive")}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm"
          >
            <Link className="text-foreground no-underline" href="/single/categories">
              {t("topics")}
              <Link.Icon />
            </Link>
            <Link className="text-foreground no-underline" href="/single/authors">
              {t("authors")}
              <Link.Icon />
            </Link>
            <Link className="text-foreground no-underline" href="/archive">
              {t("archive")}
              <Link.Icon />
            </Link>
          </nav>
        </header>

        {openingLoading ? <JournalSkeleton /> : null}
        {!openingLoading && lead ? (
          <section aria-labelledby="journal-featured-title" className="flex min-w-0 flex-col gap-5">
            <Typography
              id="journal-featured-title"
              type="h2"
              className="text-muted text-sm font-medium tracking-normal"
            >
              {t("featuredStories")}
            </Typography>
            <FeatureMosaic companions={companions} lead={lead} />
          </section>
        ) : null}

        <section
          aria-label={t("browseArchive")}
          className="border-separator flex w-full min-w-0 flex-col gap-5 border-y py-5"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchField
              className="w-full sm:w-96"
              name="article-search"
              value={searchValue}
              onChange={(value) => {
                setSearchDraft({ source: normalizedQuery, value });
                updateSearch(value);
              }}
            >
              <Label className="sr-only">{t("searchArticles")}</Label>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder={t("searchPlaceholder")} />
                <SearchField.ClearButton aria-label={t("clearSearch")} />
              </SearchField.Group>
            </SearchField>
            {hasArchiveFilters ? (
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => {
                  updateSearch.cancel();
                  setSearchDraft({ source: normalizedQuery, value: "" });
                  updateArchiveSearch({ q: undefined, category: undefined, page: undefined });
                }}
              >
                <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" />
                {t("clearFilters")}
              </Button>
            ) : (
              <Link className="w-fit shrink-0 text-sm no-underline" href="/library">
                {t("library")}
                <Link.Icon />
              </Link>
            )}
          </div>

          {categories.length > 0 ? (
            <ScrollShadow hideScrollBar orientation="horizontal" className="-mx-1 px-1">
              <TagGroup
                aria-label={t("filterTopics")}
                className="w-max min-w-full xl:w-full"
                selectedKeys={new Set([selectedCategoryId ? String(selectedCategoryId) : "all"])}
                selectionMode="single"
                size="sm"
                onSelectionChange={(keys) => {
                  if (keys === "all") return;
                  const [key] = Array.from(keys);
                  updateSearch.cancel();
                  updateArchiveSearch({
                    q: searchValue.trim() || undefined,
                    category: key && String(key) !== "all" ? String(key) : undefined,
                    page: undefined,
                  });
                }}
              >
                <TagGroup.List className="flex-nowrap pr-8 xl:flex-wrap xl:pr-0">
                  <Tag id="all" textValue={t("allTopics")}>
                    {t("allTopics")}
                  </Tag>
                  {categories.map((category) => (
                    <Tag key={category.id} id={String(category.id)} textValue={category.name}>
                      {category.name}
                      <span className="text-muted text-xs tabular-nums">{category.count}</span>
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            </ScrollShadow>
          ) : null}
        </section>

        {discoveryQuery.isError && featuredQuery.isError ? (
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

        <div
          className={`grid min-w-0 items-start gap-12 xl:gap-10 2xl:gap-16 ${hasDiscoveryRail ? "xl:grid-cols-[minmax(0,1fr)_17rem]" : ""}`}
        >
          <div className="flex min-w-0 flex-col gap-12">
            <section
              aria-labelledby="latest-title"
              aria-busy={latestLoading || latestQuery.isFetching}
              className="flex min-w-0 flex-col gap-6"
            >
              <div className="flex items-baseline justify-between gap-4">
                <Typography
                  id="latest-title"
                  type="h2"
                  weight="semibold"
                  className="min-w-0 text-2xl tracking-normal wrap-anywhere"
                >
                  {normalizedQuery
                    ? t("searchResults")
                    : selectedCategoryId
                      ? (categories.find((category) => category.id === selectedCategoryId)?.name ??
                        t("latest"))
                      : t("latest")}
                </Typography>
                <span className="text-muted text-xs tabular-nums">
                  <NumberValue locale={locale} value={essayCount}>
                    {(formatted) => t("essays", { count: formatted })}
                  </NumberValue>
                </span>
              </div>
              {latestLoading && !openingLoading ? (
                <div role="status" aria-label={t("loadingStories")} className={JOURNAL_STORY_GRID}>
                  {Array.from({ length: LATEST_PAGE_SIZE }, (_, index) => (
                    <Skeleton key={index} className="my-6 h-56 w-full rounded-lg" />
                  ))}
                </div>
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
                    <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" />
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
              ) : latestPosts.length > 0 ? (
                <div className="flex min-w-0 flex-col gap-6">
                  <div className={JOURNAL_STORY_GRID} data-testid="journal-latest-grid">
                    {latestPosts.map((post) => (
                      <div key={post.id ?? post.slug} className="min-w-0" data-journal-reveal="">
                        <StoryRow post={post} />
                      </div>
                    ))}
                  </div>
                  <LatestPagination
                    page={latestPage + 1}
                    pages={Math.max(1, latestData?.totalPages ?? 1)}
                    isDisabled={latestQuery.isFetching}
                    onPageChange={(page) => {
                      const query = new URLSearchParams(searchParams.toString());
                      if (page <= 1) query.delete("page");
                      else query.set("page", String(page));
                      const serialized = query.toString();
                      router.replace(serialized ? `/single?${serialized}` : "/single", {
                        scroll: true,
                      });
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
            </section>

            <ContinueReading entries={libraryQuery.data?.continueReading ?? []} />

            {!hasArchiveFilters ? (
              <div data-journal-reveal="">
                <ColumnDecks
                  columns={(columnsQuery.data ?? []).filter((column) => column.isPublished)}
                />
              </div>
            ) : null}

            {!hasArchiveFilters ? (
              <div data-journal-reveal="">
                <CategoryShelves groups={discovery?.categoryGroups ?? []} />
              </div>
            ) : null}
          </div>

          {hasDiscoveryRail ? (
            <aside
              aria-label={t("exploreWriting")}
              className="border-separator grid min-w-0 gap-8 border-t pt-8 sm:grid-cols-2 xl:grid-cols-1 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6"
            >
              <Typography type="h2" className="sr-only">
                {t("exploreWriting")}
              </Typography>
              {mostRead.length + trending.length > 0 ? (
                <div data-journal-reveal="">
                  <AttentionCard mostRead={mostRead} trending={trending} />
                </div>
              ) : null}
              {categories.length > 0 ? (
                <div data-journal-reveal="">
                  <CategoryList categories={categories} />
                </div>
              ) : null}
              {tags.length > 0 ? (
                <div data-journal-reveal="">
                  <TagList tags={tags} />
                </div>
              ) : null}
              {archives.length > 0 ? (
                <div data-journal-reveal="">
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
            <div data-journal-reveal="">
              <FeaturedCarousel
                posts={featuredPosts.filter((post) => !post.slug || !shownSlugs.has(post.slug))}
              />
            </div>
          </>
        ) : null}
      </PageContainer>
    </div>
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
      <Card.Header className="flex-row items-center justify-between gap-3">
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
          className="w-full p-1"
          selectionMode="none"
          onAction={(key) => {
            const post = active.posts.find((item) => storyKey(item) === String(key));
            if (post) router.push(storyHref(post));
          }}
        >
          {active.posts.slice(0, 6).map((post, index) => {
            const title = post.title || t("untitledStory");
            const category = post.category?.name;

            return (
              <ListBox.Item
                key={storyKey(post)}
                className="items-start"
                id={storyKey(post)}
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
      <Card.Content className="p-0">
        <ListBox
          aria-label={t("years")}
          className="w-full p-1"
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

function CategoryShelf({ group }: { group: CategoryGroup }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const category = group.category;
  const name = category?.name;
  if (!name) return null;
  const posts = [group.heroPost, ...(group.supportingPosts ?? group.posts ?? [])].filter(
    (post): post is NonNullable<typeof post> => Boolean(post?.slug)
  );
  const unique = posts.filter(
    (post, index) => posts.findIndex((item) => item.slug === post.slug) === index
  );
  if (unique.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <Typography type="body-sm" weight="semibold">
          {name}
        </Typography>
        <span className="text-muted text-xs tabular-nums">
          <NumberValue locale={locale} value={group.totalPublishedCount ?? unique.length}>
            {(formatted) => t("categoryEssays", { count: formatted })}
          </NumberValue>
        </span>
        <Link
          className="text-sm no-underline"
          href={
            category?.slug
              ? `/single/categories/${encodeURIComponent(category.slug)}`
              : "/single/categories"
          }
        >
          {t("archive")}
          <Link.Icon />
        </Link>
      </div>
      <div className={JOURNAL_STORY_GRID}>
        {unique.slice(0, 4).map((post) => (
          <StoryRow key={post.id ?? post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

function CategoryShelves({ groups }: { groups: CategoryGroup[] }) {
  const t = useTranslations("Journal");
  const ready = groups.filter(
    (group) => group.category?.name && (group.heroPost || group.posts?.length)
  );
  if (ready.length === 0) return null;

  return (
    <section aria-labelledby="archive-shelves-title" className="flex flex-col gap-4">
      <Typography id="archive-shelves-title" type="h2" weight="semibold">
        {t("fromTheArchive")}
      </Typography>
      {ready.slice(0, 4).map((group) => (
        <CategoryShelf key={group.category?.id ?? group.category?.slug} group={group} />
      ))}
    </section>
  );
}

function FeaturedCarousel({ posts }: { posts: Story[] }) {
  const t = useTranslations("Journal");
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="featured-band-title" className="@container flex flex-col gap-4">
      <Typography id="featured-band-title" type="h2" weight="semibold">
        {t("featuredStories")}
      </Typography>
      <Carousel opts={{ align: "start" }}>
        <Carousel.Content>
          {posts.slice(0, 12).map((post) => (
            <Carousel.Item
              key={storyKey(post)}
              className="basis-full @min-[36rem]:basis-1/2 @min-[52rem]:basis-1/3 @min-[68rem]:basis-1/4 @min-[84rem]:basis-1/5"
            >
              <div className="pe-3">
                <FeatureCard post={post} />
              </div>
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <Carousel.Previous />
        <Carousel.Next />
      </Carousel>
    </section>
  );
}
