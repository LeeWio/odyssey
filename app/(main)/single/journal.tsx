"use client";

import { Icon } from "@iconify/react";
import { Carousel } from "@heroui-pro/react/carousel";
import Autoplay from "embla-carousel-autoplay";
import { EmptyState, HoverCard, ItemCard, NumberValue, Segment } from "@heroui-pro/react";
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
  ScrollShadow,
  Separator,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
} from "@heroui/react";
import type { Key } from "react-aria-components/Breadcrumbs";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
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
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";

type CategoryFacet = OpenApiComponents["schemas"]["CategoryFacet"];
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

const coverHover =
  "transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100";

function Cover({ cover, ratio }: { cover?: string; ratio: string }) {
  if (!cover) return <span className={`${ratio} bg-default/40 block w-full`} />;

  return (
    // Cover hosts are not in next/image remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" className={`${ratio} w-full object-cover ${coverHover}`} src={cover} />
  );
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

  return (
    <article
      data-journal-reveal=""
      data-journal-order={delay > 0 ? "2" : "1"}
      className="bg-surface-secondary hover:bg-surface-tertiary overflow-hidden rounded-2xl transition-colors duration-150 motion-reduce:transition-none"
    >
      <HoverCard>
        <HoverCard.Trigger>
          <Link
            className="group relative block overflow-hidden no-underline"
            href={storyHref(post)}
          >
            <Cover cover={post.coverImage?.trim()} ratio="aspect-[16/9]" />
            <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pt-12 pb-3.5">
              {meta ? <span className="text-xs text-white/75">{meta}</span> : null}
              <span
                className={`line-clamp-2 font-semibold tracking-tight text-white ${featured ? "text-2xl leading-8" : "text-xl leading-7"}`}
              >
                {title}
              </span>
            </span>
          </Link>
        </HoverCard.Trigger>
        {post.summary ? (
          <HoverCard.Content aria-label={title}>
            <HoverCard.Arrow />
            <p className="text-sm leading-5">{post.summary}</p>
            <p className="text-muted mt-2 text-xs tabular-nums">
              <NumberValue locale={locale} notation="compact" value={post.views ?? 0}>
                {(formatted) => t("views", { count: formatted })}
              </NumberValue>
            </p>
          </HoverCard.Content>
        ) : null}
      </HoverCard>
    </article>
  );
}

function FeatureMosaic({ lead, companions }: { lead: Story; companions: Story[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <FeatureCard featured post={lead} />
      {companions.map((post, index) => (
        <FeatureCard key={post.id ?? post.slug} delay={0.06 * (index + 1)} post={post} />
      ))}
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

function LatestPagination({
  onPageChange,
  page,
  pages,
}: {
  onPageChange: (page: number) => void;
  page: number;
  pages: number;
}) {
  const t = useTranslations("Journal");
  if (pages <= 1) return null;

  return (
    <div className="w-full overflow-x-auto">
      <Pagination className="justify-center" size="sm">
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous isDisabled={page === 1} onPress={() => onPageChange(page - 1)}>
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
                <Pagination.Link isActive={item === page} onPress={() => onPageChange(item)}>
                  {item}
                </Pagination.Link>
              </Pagination.Item>
            )
          )}
          <Pagination.Item>
            <Pagination.Next isDisabled={page === pages} onPress={() => onPageChange(page + 1)}>
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
  const t = useTranslations("Journal");
  const locale = useLocale();
  const title = post.title || t("untitledStory");
  const cover = post.coverImage?.trim();
  const author = post.authorName?.trim();

  return (
    <ItemCard className="items-start p-3" variant="secondary">
      {cover ? (
        <ItemCard.Icon className="size-20 overflow-hidden rounded-xl">
          <Cover cover={cover} ratio="size-20" />
        </ItemCard.Icon>
      ) : null}
      <ItemCard.Content className="gap-1.5">
        <ItemCard.Title className="text-base leading-6 font-semibold">
          <Link className="text-foreground line-clamp-2 no-underline" href={storyHref(post)}>
            {title}
          </Link>
        </ItemCard.Title>
        <p className="text-muted text-xs">
          {[
            author,
            post.category?.name,
            formatDate(storyDate(post), locale, t("recentlyPublished")),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {post.summary ? (
          <p className="text-muted line-clamp-3 text-sm leading-5">{post.summary}</p>
        ) : null}
        <p className="text-muted text-xs tabular-nums">
          <NumberValue locale={locale} notation="compact" value={post.views ?? 0}>
            {(formatted) => t("views", { count: formatted })}
          </NumberValue>
          {" · "}
          <NumberValue locale={locale} notation="compact" value={post.likesCount ?? 0}>
            {(formatted) => t("likes", { count: formatted })}
          </NumberValue>
        </p>
      </ItemCard.Content>
    </ItemCard>
  );
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
  const [autoplay] = useState(() => Autoplay({ delay: 2000, stopOnInteraction: true }));
  const locale = useLocale();
  const slides = column.posts.map((post) => {
    const image = post.coverImage?.trim();
    return {
      alt: post.title,
      detail: post.summary?.trim() || undefined,
      image,
      meta: [
        post.authorName,
        post.publishedAt ? formatDate(post.publishedAt, locale, "") : null,
        post.views ? t("views", { count: post.views.toLocaleString(locale) }) : null,
      ]
        .filter(Boolean)
        .join(" · "),
      slug: post.slug,
      title: post.title,
    };
  });
  if (slides.length === 0) return null;

  const updated = columnUpdatedAt(column);

  return (
    <article className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Typography type="h3" weight="semibold">
          {name}
        </Typography>
        <Link className="text-sm no-underline" href={`/columns/${column.slug}`}>
          {t("viewColumn")}
          <Link.Icon />
        </Link>
      </div>
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
      <div className="w-full max-w-xs">
        <Carousel opts={{ loop: true }} plugins={[autoplay]}>
          <Carousel.Content>
            {slides.map((slide) => (
              <Carousel.Item key={slide.slug}>
                <div className="p-1">
                  <Card className="overflow-hidden select-none">
                    <Link className="block no-underline" href={`/single/${slide.slug}`}>
                      {slide.image ? (
                        <>
                          {/* Remote cover hosts are not in next/image remotePatterns. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={slide.alt}
                            className="aspect-square w-full object-cover"
                            draggable={false}
                            src={slide.image}
                          />
                        </>
                      ) : null}
                      <Card.Footer className="flex flex-col items-start gap-1">
                        {slide.meta ? (
                          <span className="text-muted text-xs">{slide.meta}</span>
                        ) : null}
                        <Card.Title className="line-clamp-2">{slide.title}</Card.Title>
                        {slide.detail ? (
                          <Card.Description className="line-clamp-2">
                            {slide.detail}
                          </Card.Description>
                        ) : null}
                      </Card.Footer>
                    </Link>
                  </Card>
                </div>
              </Carousel.Item>
            ))}
          </Carousel.Content>
          <Carousel.Previous />
          <Carousel.Next />
          <Carousel.Dots />
        </Carousel>
      </div>
    </article>
  );
}

function ColumnDeckPreview({ column }: { column: ColumnResponse }) {
  const detail = useGetPublicColumnBySlugQuery(column.slug);
  const resolved = detail.data ?? column;
  if (detail.isLoading && resolved.posts.length === 0) {
    return <Skeleton className="h-80 w-full max-w-xs rounded-2xl" />;
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
      <div className="flex flex-wrap items-start gap-8">
        <ColumnDeckPreview column={active} />
        {rest.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Typography type="body-sm" weight="semibold">
              {t("nextColumn")}
            </Typography>
            {rest.map((column) => {
              const updated = columnUpdatedAt(column);
              return (
                <button
                  key={column.slug}
                  className="bg-surface-secondary hover:bg-surface-tertiary flex flex-col gap-1 rounded-2xl p-4 text-start transition-colors duration-150 motion-reduce:transition-none"
                  type="button"
                  onClick={() => setSelected(column.slug)}
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
                </button>
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
    <Card variant="secondary">
      <Card.Header className="flex-row items-center justify-between">
        <div className="flex flex-col">
          <Card.Title className="text-sm">{t("topics")}</Card.Title>
          <Card.Description>{t("topicsHint")}</Card.Description>
        </div>
        <Link className="text-xs no-underline" href="/archive">
          {t("archive")}
        </Link>
      </Card.Header>
      <Card.Content className="p-0">
        <ScrollShadow className="max-h-80">
          <ListBox
            aria-label={t("topics")}
            className="w-full p-1"
            selectionMode="none"
            onAction={(key) => router.push(`/explore?category=${key}`)}
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
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="aspect-[16/9] w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function JournalPage() {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const discoveryQuery = useRetrieveDiscoveryQuery();
  const facetsQuery = useRetrieveFacetsQuery();
  const featuredQuery = useGetFeaturedPostsQuery({ page: 0, size: 8 });
  const [latestPage, setLatestPage] = useState(0);
  const latestQuery = useGetPublicPostsQuery({ page: latestPage, size: 6 });
  const columnsQuery = useGetPublicColumnsQuery();
  const libraryQuery = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });

  const discovery = discoveryQuery.data;
  const featuredPosts = featuredQuery.data?.list ?? [];
  const latestPool = latestQuery.data?.list ?? [];
  const categories = (facetsQuery.data?.categories ?? []).filter(
    (category): category is CategoryFacet & { id: number; name: string } =>
      category.id != null && Boolean(category.name) && (category.count ?? 0) > 0
  );
  const tags = (facetsQuery.data?.tags ?? []).filter(
    (tag): tag is TagFacet & { id: number; name: string } =>
      tag.id != null && Boolean(tag.name) && (tag.count ?? 0) > 0
  );
  const essayCount = facetsQuery.data?.totalPublishedCount ?? latestQuery.data?.total ?? 0;
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
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          y: 28,
        });
      });
      return () => motion.revert();
    },
    { dependencies: [contentReady], scope: pageRef }
  );

  const trending = discovery?.trending ?? [];
  const mostRead = discovery?.mostRead ?? [];
  const openingSource = featuredPosts.length > 0 ? featuredPosts : latestPool;
  const lead = openingSource[0];
  const companions = openingSource.slice(1, 3);
  const shownSlugs = new Set(
    [lead, ...companions].flatMap((post) => (post?.slug ? [post.slug] : []))
  );
  const latestPosts = latestPool
    .filter((post) => !post.slug || !shownSlugs.has(post.slug))
    .slice(0, 6);
  const openingLoading =
    featuredQuery.isLoading || (featuredPosts.length === 0 && latestQuery.isLoading);
  const archiveEmpty =
    !openingLoading && !latestQuery.isLoading && !lead && latestPosts.length === 0;

  return (
    <div
      ref={pageRef}
      className="bg-background min-h-[100dvh] w-full px-8 pt-28 pb-24 md:px-12 xl:px-16"
    >
      <div className="flex w-full flex-col gap-16">
        <h1 className="sr-only">{t("title")}</h1>

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

        <div className="grid items-start gap-x-16 gap-y-14 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex min-w-0 flex-col gap-14">
            {openingLoading ? <JournalSkeleton /> : null}

            {!openingLoading && lead ? (
              <section aria-label={t("featuredStories")}>
                <FeatureMosaic companions={companions} lead={lead} />
              </section>
            ) : null}

            <div data-journal-reveal="">
              <ContinueReading entries={libraryQuery.data?.continueReading ?? []} />
            </div>

            <Separator />

            <div data-journal-reveal="">
              <ColumnDecks
                columns={(columnsQuery.data ?? []).filter((column) => column.isPublished)}
              />
            </div>

            <section aria-labelledby="latest-title" className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-4">
                <Typography id="latest-title" type="h3" weight="semibold">
                  {t("latest")}
                </Typography>
                <span className="text-muted text-xs tabular-nums">
                  <NumberValue locale={locale} value={essayCount}>
                    {(formatted) => t("essays", { count: formatted })}
                  </NumberValue>
                </span>
              </div>
              {latestQuery.isLoading && !openingLoading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-24 w-full rounded-2xl" />
                  ))}
                </div>
              ) : latestQuery.isError ? (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{t("latestFailed")}</Alert.Title>
                    <Alert.Description>{t("latestFailedHint")}</Alert.Description>
                  </Alert.Content>
                  <Button variant="outline" onPress={() => void latestQuery.refetch()}>
                    <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" />
                    {t("tryAgain")}
                  </Button>
                </Alert>
              ) : latestPosts.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {latestPosts.map((post) => (
                    <div key={post.id ?? post.slug} data-journal-reveal="">
                      <StoryRow post={post} />
                    </div>
                  ))}
                  <LatestPagination
                    page={latestPage + 1}
                    pages={Math.max(1, latestQuery.data?.totalPages ?? 1)}
                    onPageChange={(page) => setLatestPage(page - 1)}
                  />
                </div>
              ) : archiveEmpty ? (
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Title>{t("emptyTitle")}</EmptyState.Title>
                    <EmptyState.Description>{t("emptyDescription")}</EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              ) : null}
            </section>
          </div>

          <aside className="flex flex-col gap-8 xl:sticky xl:top-28 xl:self-start">
            <div data-journal-reveal="">
              <CategoryList categories={categories} />
            </div>
            <div data-journal-reveal="">
              <TagList tags={tags} />
            </div>
            <div data-journal-reveal="">
              <AttentionCard mostRead={mostRead} trending={trending} />
            </div>
          </aside>
        </div>

        {featuredPosts.some((post) => post.slug && !shownSlugs.has(post.slug)) ? (
          <>
            <Separator />
            <div data-journal-reveal="">
              <FeaturedCarousel
                posts={featuredPosts.filter((post) => !post.slug || !shownSlugs.has(post.slug))}
              />
            </div>
          </>
        ) : null}
      </div>
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
    <Card variant="secondary">
      <Card.Header>
        <Segment
          aria-label={t("attention")}
          selectedKey={selected}
          size="sm"
          onSelectionChange={setSelected}
        >
          {trending.length > 0 ? <Segment.Item id="trending">{t("trending")}</Segment.Item> : null}
          {mostRead.length > 0 ? <Segment.Item id="most-read">{t("mostRead")}</Segment.Item> : null}
        </Segment>
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

function TagList({ tags }: { tags: Array<TagFacet & { id: number; name: string }> }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const router = useRouter();
  if (tags.length === 0) return null;

  return (
    <Card variant="secondary">
      <Card.Header>
        <Card.Title className="text-sm">{t("tags")}</Card.Title>
        <Card.Description>{t("tagsHint")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <TagGroup
          aria-label={t("tags")}
          selectionMode="single"
          size="sm"
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const key = [...keys][0];
            if (key != null) router.push(`/explore?tag=${key}`);
          }}
        >
          <TagGroup.List className="flex-wrap">
            {tags.map((tag) => (
              <Tag key={tag.id} id={String(tag.id)} textValue={tag.name}>
                {tag.name}
                <span className="text-muted text-xs tabular-nums">
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

function FeaturedCarousel({ posts }: { posts: Story[] }) {
  const t = useTranslations("Journal");
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="featured-band-title" className="flex flex-col gap-4">
      <Typography id="featured-band-title" type="h2" weight="semibold">
        {t("featuredStories")}
      </Typography>
      <Carousel opts={{ align: "start" }}>
        <Carousel.Content>
          {posts.slice(0, 8).map((post) => (
            <Carousel.Item key={storyKey(post)} className="basis-full sm:basis-1/2 xl:basis-1/3">
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
