"use client";

import { pageEaseOut } from "@/lib/motion";

import { Icon } from "@iconify/react";

import Link from "next/link";
import { MotionCard, MotionChip, MotionTypography } from "@/components/ui";
import type { PostDigestResponse, PostResponse } from "@/lib/features/post";
import { useGetFeaturedPostsQuery, useGetPublicPostsQuery } from "@/lib/features/post";
import { useRetrieveFacetsQuery } from "@/lib/features/openapi";
import { EmptyState } from "@heroui-pro/react";
import {
  Button,
  Card,
  Chip,
  Label,
  Pagination,
  ProgressBar,
  ScrollShadow,
  SearchField,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
} from "@heroui/react";
import { AnimatePresence, animate as animateMotion, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { type ReadingHistoryResponse, useGetLibraryOverviewQuery } from "@/lib/features/library";
import { ReadingListButton } from "@/features/library/reading-list-button";
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";

const PAGE_SIZE = 8;
const easeIn = [0.4, 0, 1, 1] as const;
const motionDuration = {
  interaction: 0.22,
  reveal: 0.5,
  exit: 0.22,
} as const;
const MotionLink = motion.create(Link);

function formatDate(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getDisplayAuthor(value?: string | null) {
  const author = value?.trim();

  if (!author || /^(anonymous|john doe|jane doe)$/i.test(author)) return "Odyssey";
  return author;
}

function getEstimatedReadingMinutes(post: Pick<PostResponse, "title" | "summary">) {
  const source = `${post.title} ${post.summary ?? ""}`.trim();
  return Math.max(2, Math.ceil(source.length / 180));
}

function BlogPostCard({
  post,
  index,
  isRefreshing,
}: {
  post: PostResponse;
  index: number;
  isRefreshing: boolean;
}) {
  const t = useTranslations("Blog");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const category = post.category?.name;
  const series = post.series?.name;

  return (
    <article aria-label={post.title} className="h-full">
      <MotionCard
        variant="secondary"
        className="group flex h-full flex-col"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={
          shouldReduceMotion
            ? undefined
            : { y: -2, transition: { duration: motionDuration.interaction, ease: pageEaseOut } }
        }
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          delay: shouldReduceMotion ? 0 : Math.min(index, 3) * 0.04,
          duration: shouldReduceMotion ? 0 : 0.65,
          ease: pageEaseOut,
        }}
      >
        <Card.Header className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-wrap gap-2">
              {category ? (
                <Chip size="sm" variant="soft">
                  {category}
                </Chip>
              ) : null}
              {series ? (
                <Chip size="sm" variant="tertiary">
                  <Icon icon="gravity-ui:book-open" aria-hidden="true" className="size-3.5" />
                  {series}
                </Chip>
              ) : null}
            </div>
            <span className="text-muted shrink-0 font-mono text-xs tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <Card.Title className="text-xl leading-snug sm:text-2xl">
            <Link
              className="hover:text-accent no-underline"
              href={`/single/${post.slug}`}
              prefetch={false}
            >
              {post.title}
            </Link>
          </Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-3 leading-6">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="text-muted mt-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="truncate">{getDisplayAuthor(post.authorName)}</span>
            <span>{formatDate(post.createdAt, locale, t("recentlyPublished"))}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex items-center gap-1.5 tabular-nums">
              <Icon icon="gravity-ui:eye" aria-hidden="true" className="size-3.5" />
              {post.views.toLocaleString(locale)}
            </span>
            <ReadingListButton
              postId={post.id}
              isSaved={Boolean(post.isInReadingList)}
              isRefreshing={isRefreshing}
            />
          </div>
        </Card.Footer>
      </MotionCard>
    </article>
  );
}

function FeaturedPost({ post }: { post: PostDigestResponse }) {
  const t = useTranslations("Blog");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <Link
      className="group focus-visible:ring-accent block cursor-[var(--cursor-interactive)] rounded-2xl no-underline outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      href={`/single/${post.slug}`}
      prefetch={false}
    >
      <MotionCard
        variant="tertiary"
        className="group-focus-visible:ring-accent flex flex-col group-focus-visible:ring-2"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={
          shouldReduceMotion
            ? undefined
            : { y: -2, transition: { duration: motionDuration.interaction, ease: pageEaseOut } }
        }
        transition={{
          duration: shouldReduceMotion ? 0 : 0.65,
          ease: pageEaseOut,
        }}
      >
        <Card.Header>
          <Chip color="accent" size="sm" variant="soft">
            {t("featured")}
          </Chip>
          <Card.Title className="text-3xl leading-tight tracking-normal sm:text-4xl lg:text-5xl">
            {post.title}
          </Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-2 leading-6">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="mt-auto gap-3">
          <Typography color="muted" type="body-xs">
            {getDisplayAuthor(post.authorName)}
          </Typography>
          <Typography color="muted" type="body-xs">
            {formatDate(post.publishedAt, locale, t("recentlyPublished"))}
          </Typography>
        </Card.Footer>
      </MotionCard>
    </Link>
  );
}

function FeedSkeleton() {
  const t = useTranslations("Blog");

  return (
    <div
      aria-busy="true"
      aria-label={t("loadingArticles")}
      aria-live="polite"
      role="status"
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} variant="secondary" className="gap-8 p-5 sm:p-6">
          <Card.Header className="gap-4 p-0">
            <Skeleton className="h-6 w-28 rounded-lg" />
            <Skeleton className="h-8 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </Card.Header>
          <Card.Footer className="gap-3 p-0">
            <Skeleton className="h-3 w-28 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
          </Card.Footer>
        </Card>
      ))}
    </div>
  );
}

function ContinueReading({
  compact = false,
  entries,
}: {
  compact?: boolean;
  entries: ReadingHistoryResponse[];
}) {
  const t = useTranslations("Blog");
  const formatRelativeTime = useRelativeTime();
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section aria-labelledby="continue-reading-title" className={compact ? "" : "mt-12"}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <Typography id="continue-reading-title" type="h2" weight="semibold">
            {t("continueReading")}
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            {t("continueHint")}
          </Typography>
        </div>
      </div>
      <div className={compact ? "grid gap-3" : "grid gap-3 md:grid-cols-3"}>
        <AnimatePresence initial={false} mode="popLayout">
          {entries.map(({ lastReadAt, post, positionAnchor, progressPercent }, index) => (
            <motion.div
              key={post.id}
              layout={!shouldReduceMotion}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                ...(shouldReduceMotion ? {} : { y: -6 }),
                transition: {
                  duration: shouldReduceMotion ? 0 : motionDuration.exit,
                  ease: easeIn,
                },
              }}
              transition={{
                delay: shouldReduceMotion ? 0 : index * 0.04,
                duration: shouldReduceMotion ? 0 : motionDuration.reveal,
                ease: pageEaseOut,
              }}
            >
              <Card variant="secondary" className={compact ? "gap-3 p-4" : "gap-4 p-5"}>
                <Card.Header className="gap-2 p-0">
                  <div className="flex items-start justify-between gap-3">
                    {post.category?.name ? (
                      <Chip size="sm" variant="soft">
                        {post.category.name}
                      </Chip>
                    ) : (
                      <span />
                    )}
                    <span className="text-muted shrink-0 font-mono text-xs tabular-nums">
                      {progressPercent}%
                    </span>
                  </div>
                  <Card.Title className="line-clamp-2 text-base">{post.title}</Card.Title>
                </Card.Header>
                <ProgressBar
                  aria-label={t("readingProgress", { title: post.title })}
                  color="accent"
                  size="sm"
                  value={progressPercent}
                >
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
                <Card.Footer className="justify-between gap-3 p-0">
                  <Typography color="muted" type="body-xs" className="line-clamp-1">
                    {t("readRelative", { time: formatRelativeTime(lastReadAt) })}
                  </Typography>
                  <MotionLink
                    className="text-accent inline-flex items-center gap-1.5 text-sm font-medium no-underline"
                    href={getReadingPositionHref(post.slug, positionAnchor)}
                    whileHover={shouldReduceMotion ? undefined : { x: 2 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : motionDuration.interaction,
                      ease: pageEaseOut,
                    }}
                  >
                    {t("continue")}
                    <Icon icon="gravity-ui:play" aria-hidden="true" className="size-3.5" />
                  </MotionLink>
                </Card.Footer>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

type ArchiveCategory = {
  name?: string | null;
  count?: number | null;
};

function ArchiveRail({
  categories,
  posts,
  publishedTotal,
}: {
  categories: ArchiveCategory[];
  posts: PostResponse[];
  publishedTotal: number;
}) {
  const t = useTranslations("Blog");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const popularCategories = [...categories]
    .sort((first, second) => (second.count ?? 0) - (first.count ?? 0))
    .slice(0, 6);
  const seriesCounts = new Map<string, number>();

  for (const post of posts) {
    const seriesName = post.series?.name;
    if (seriesName) seriesCounts.set(seriesName, (seriesCounts.get(seriesName) ?? 0) + 1);
  }

  const activeSeries = Array.from(seriesCounts.entries())
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .slice(0, 4);
  const averageViews = posts.length
    ? Math.round(posts.reduce((total, post) => total + post.views, 0) / posts.length)
    : 0;
  const averageReadingMinutes = posts.length
    ? Math.round(
        posts.reduce((total, post) => total + getEstimatedReadingMinutes(post), 0) / posts.length
      )
    : 0;
  const latestDate = posts
    .map((post) => post.createdAt)
    .sort((first, second) => second.localeCompare(first))[0];

  return (
    <div className="flex flex-col gap-4">
      <Card variant="tertiary" className="gap-5 p-5 sm:p-6">
        <Card.Header className="gap-2 p-0">
          <Card.Title>{t("glanceTitle")}</Card.Title>
          <Card.Description>{t("glanceDescription")}</Card.Description>
        </Card.Header>

        <Card.Content className="p-0">
          <dl className="grid grid-cols-2 gap-3">
            <div className="border-default/40 rounded-xl border p-3">
              <dt className="text-muted text-xs">{t("published")}</dt>
              <dd className="text-foreground mt-1 font-mono text-2xl tabular-nums">
                {publishedTotal.toLocaleString(locale)}
              </dd>
            </div>
            <div className="border-default/40 rounded-xl border p-3">
              <dt className="text-muted text-xs">{t("topics")}</dt>
              <dd className="text-foreground mt-1 font-mono text-2xl tabular-nums">
                {categories.length}
              </dd>
            </div>
          </dl>
        </Card.Content>

        <Card.Footer className="p-0">
          <MotionLink
            className="text-accent inline-flex cursor-[var(--cursor-interactive)] items-center gap-2 text-sm font-medium no-underline"
            href="/columns"
            whileHover={shouldReduceMotion ? undefined : { x: 2 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            transition={{
              duration: shouldReduceMotion ? 0 : motionDuration.interaction,
              ease: pageEaseOut,
            }}
          >
            {t("browseColumns")}
            <Icon icon="gravity-ui:arrow-right" aria-hidden="true" className="size-4" />
          </MotionLink>
        </Card.Footer>
      </Card>

      {popularCategories.length > 0 ? (
        <Card variant="secondary" className="gap-4 p-5 sm:p-6">
          <Card.Header className="gap-1 p-0">
            <Card.Title className="text-base">{t("popularTopics")}</Card.Title>
            <Card.Description>{t("popularTopicsHint")}</Card.Description>
          </Card.Header>
          <Card.Content className="p-0">
            <ul className="flex flex-col gap-3">
              {popularCategories.map((category) => (
                <li key={category.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground truncate">{category.name}</span>
                  <span className="text-muted shrink-0 font-mono text-xs tabular-nums">
                    {category.count ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>
      ) : null}

      <Card variant="secondary" className="gap-4 p-5 sm:p-6">
        <Card.Header className="gap-1 p-0">
          <Card.Title className="text-base">{t("readingSignals")}</Card.Title>
          <Card.Description>{t("readingSignalsHint")}</Card.Description>
        </Card.Header>
        <Card.Content className="p-0">
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t("averageViews")}</dt>
              <dd className="text-foreground font-mono tabular-nums">
                {averageViews.toLocaleString(locale)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t("estimatedRead")}</dt>
              <dd className="text-foreground font-mono tabular-nums">
                {averageReadingMinutes ? t("minutes", { count: averageReadingMinutes }) : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t("latestEntry")}</dt>
              <dd className="text-foreground text-right text-xs">
                {latestDate
                  ? formatDate(latestDate, locale, t("recentlyPublished"))
                  : t("noEntries")}
              </dd>
            </div>
          </dl>
        </Card.Content>
      </Card>

      <AnimatePresence initial={false} mode="popLayout">
        {activeSeries.length > 0 ? (
          <motion.div
            key={activeSeries.map(([name]) => name).join("|")}
            layout={!shouldReduceMotion}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              ...(shouldReduceMotion ? {} : { y: -6 }),
              transition: {
                duration: shouldReduceMotion ? 0 : motionDuration.exit,
                ease: easeIn,
              },
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : motionDuration.reveal,
              ease: pageEaseOut,
            }}
          >
            <Card variant="secondary" className="gap-4 p-5 sm:p-6">
              <Card.Header className="gap-1 p-0">
                <Card.Title className="text-base">{t("columnsInView")}</Card.Title>
                <Card.Description>{t("columnsInViewHint")}</Card.Description>
              </Card.Header>
              <Card.Content className="p-0">
                <ul className="flex flex-col gap-3">
                  {activeSeries.map(([name, count]) => (
                    <li key={name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-foreground truncate">{name}</span>
                      <span className="text-muted shrink-0 font-mono text-xs tabular-nums">
                        {count}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card.Content>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
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

function parsePositiveInteger(value: string | null) {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default function BlogFeed() {
  const t = useTranslations("Blog");
  const shouldReduceMotion = useReducedMotion() ?? false;
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, (parsePositiveInteger(searchParams.get("page")) ?? 1) - 1);
  const categoryId = parsePositiveInteger(searchParams.get("categoryId"));
  const selectedCategoryId = categoryId;
  const [searchValue, setSearchValue] = useState(() => searchParams.get("keyword") ?? "");
  const scrollAnimationRef = useRef<{ stop: () => void } | null>(null);
  const updateSearch = useCallback(
    (changes: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(changes).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const syncKeywordFromHistory = () => {
      setSearchValue(new URLSearchParams(window.location.search).get("keyword") ?? "");
    };

    window.addEventListener("popstate", syncKeywordFromHistory);
    return () => window.removeEventListener("popstate", syncKeywordFromHistory);
  }, []);

  const normalizedKeyword = searchValue.trim();
  const keyword = useDeferredValue(normalizedKeyword);
  const isDeferringKeyword = keyword !== normalizedKeyword;
  const { currentData, isLoading, isFetching, isError, isSuccess, refetch } =
    useGetPublicPostsQuery(
      {
        categoryId: selectedCategoryId,
        keyword: keyword || undefined,
        page,
        size: PAGE_SIZE,
      },
      { skip: isDeferringKeyword, refetchOnMountOrArgChange: true }
    );
  const lastPage = Math.max(0, (currentData?.totalPages ?? 1) - 1);
  const isAdjustingPage =
    !isDeferringKeyword && isSuccess && !isFetching && !!currentData && page > lastPage;
  useEffect(() => {
    if (!isAdjustingPage) return;

    updateSearch({ page: lastPage === 0 ? undefined : String(lastPage + 1) });
  }, [isAdjustingPage, lastPage, updateSearch]);

  const data = isDeferringKeyword || isAdjustingPage ? undefined : currentData;
  const isLoadingPage = isDeferringKeyword || isAdjustingPage || isLoading || (isFetching && !data);
  const isUpdating = isDeferringKeyword || isAdjustingPage || isFetching;
  // A new selection must also remove exiting, still-clickable cards from the old selection.
  const selectionKey = JSON.stringify([normalizedKeyword, selectedCategoryId, page]);
  const { data: featuredData } = useGetFeaturedPostsQuery({ page: 0, size: 1 });
  const { data: libraryOverview } = useGetLibraryOverviewQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: facets, isLoading: isFacetsLoading } = useRetrieveFacetsQuery();
  const posts = data?.list ?? [];
  const featuredPost = featuredData?.list[0];
  const continueReading = (libraryOverview?.continueReading ?? []).slice(0, 3);
  const categories = (facets?.categories ?? []).filter(
    (category) => category.id != null && category.name && (category.count ?? 0) > 0
  );
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const totalPages = data?.totalPages ?? 0;
  const startItem = data && data.total > 0 ? page * data.size + 1 : 0;
  const endItem = data ? Math.min((page + 1) * data.size, data.total) : 0;
  const resultsKey = data
    ? `${data.page}:${data.total}:${data.list.map((post) => post.id).join(",")}`
    : `page-${page}`;
  const revealTransition = {
    duration: shouldReduceMotion ? 0 : motionDuration.reveal,
    ease: pageEaseOut,
  };
  const exitTransition = {
    duration: shouldReduceMotion ? 0 : motionDuration.exit,
    ease: easeIn,
  };
  const stateTransition = {
    duration: shouldReduceMotion ? 0 : motionDuration.interaction,
    ease: pageEaseOut,
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    updateSearch({ keyword: value.trim() || undefined, page: undefined });
  };

  const handleCategoryChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [key] = Array.from(keys);
    const nextCategoryId = key === "all" || key == null ? undefined : Number(key);

    updateSearch({
      categoryId: Number.isFinite(nextCategoryId) ? String(nextCategoryId) : undefined,
      page: undefined,
    });
  };

  const handlePageChange = (nextPage: number) => {
    updateSearch({ page: nextPage === 0 ? undefined : String(nextPage + 1) });
    const target = document.getElementById("all-writing");
    if (!target) return;

    const scrollMarginTop = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const targetTop = Math.max(
      0,
      target.getBoundingClientRect().top + window.scrollY - scrollMarginTop
    );

    scrollAnimationRef.current?.stop();
    if (shouldReduceMotion) {
      window.scrollTo({ top: targetTop, behavior: "auto" });
      return;
    }

    scrollAnimationRef.current = animateMotion(window.scrollY, targetTop, {
      duration: motionDuration.reveal,
      ease: pageEaseOut,
      onUpdate: (value) => window.scrollTo(0, value),
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-10 sm:py-32">
      <div className="w-full">
        <header className="flex w-full flex-col items-center text-center">
          <MotionChip
            color="accent"
            size="sm"
            variant="soft"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : motionDuration.reveal,
              ease: pageEaseOut,
            }}
          >
            {t("eyebrow")}
          </MotionChip>
          <MotionTypography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] leading-[0.98] tracking-[-0.05em]"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : motionDuration.reveal,
              delay: shouldReduceMotion ? 0 : 0.06,
              ease: pageEaseOut,
            }}
          >
            {t("title")}
          </MotionTypography>
          <MotionTypography
            color="muted"
            type="body"
            className="mt-3 max-w-xl text-balance"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : motionDuration.reveal,
              delay: shouldReduceMotion ? 0 : 0.12,
              ease: pageEaseOut,
            }}
          >
            {t("description")}
          </MotionTypography>
          <MotionLink
            className="text-accent mt-2 inline-flex cursor-[var(--cursor-interactive)] items-center gap-2 text-sm font-medium no-underline"
            href="/columns"
            whileHover={shouldReduceMotion ? undefined : { x: 2 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            transition={{
              duration: shouldReduceMotion ? 0 : motionDuration.interaction,
              ease: pageEaseOut,
            }}
          >
            {t("browseColumns")}
            <Icon icon="gravity-ui:arrow-right" aria-hidden="true" className="size-4" />
          </MotionLink>
        </header>

        <section
          aria-label={t("browseArchive")}
          className="bg-surface-secondary mx-auto mt-12 flex w-full max-w-6xl flex-col gap-4 rounded-2xl p-3 sm:p-4"
        >
          <SearchField
            fullWidth
            name="article-search"
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full"
          >
            <Label className="sr-only">{t("searchArticles")}</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={t("searchPlaceholder")} />
              <SearchField.ClearButton aria-label={t("clearSearch")} />
            </SearchField.Group>
          </SearchField>

          <div className="min-w-0">
            {isFacetsLoading ? (
              <div aria-label={t("loadingTopics")} className="flex gap-2" role="status">
                {["w-20", "w-28", "w-24", "w-36"].map((width) => (
                  <Skeleton key={width} className={`h-8 ${width} rounded-full`} />
                ))}
              </div>
            ) : categories.length > 0 ? (
              <ScrollShadow hideScrollBar orientation="horizontal" className="-mx-1 px-1">
                <TagGroup
                  aria-label={t("filterTopics")}
                  selectedKeys={new Set([selectedCategoryId ? String(selectedCategoryId) : "all"])}
                  selectionMode="single"
                  size="sm"
                  variant="surface"
                  className="w-max min-w-full"
                  onSelectionChange={handleCategoryChange}
                >
                  <TagGroup.List className="flex-nowrap pr-8">
                    <Tag id="all" textValue={t("allTopics")}>
                      {t("allTopics")}
                      <span className="text-muted text-xs tabular-nums">
                        {facets?.totalPublishedCount ?? 0}
                      </span>
                    </Tag>
                    {categories.map((category) => (
                      <Tag key={category.id} id={String(category.id)} textValue={category.name}>
                        {category.name}
                        <span className="text-muted text-xs tabular-nums">
                          {category.count ?? 0}
                        </span>
                      </Tag>
                    ))}
                  </TagGroup.List>
                </TagGroup>
              </ScrollShadow>
            ) : null}
          </div>
        </section>

        <div className="mt-12 grid gap-10 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] xl:items-start">
          <div className="min-w-0">
            <AnimatePresence initial={false} mode="wait">
              {!normalizedKeyword && !selectedCategoryId && featuredPost ? (
                <motion.section
                  key="featured-writing"
                  aria-labelledby="featured-writing-title"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0, transition: exitTransition }
                      : { opacity: 0, y: -6, transition: exitTransition }
                  }
                  transition={revealTransition}
                >
                  <Typography
                    id="featured-writing-title"
                    type="h2"
                    weight="semibold"
                    className="mb-5"
                  >
                    {t("featuredWriting")}
                  </Typography>
                  <FeaturedPost post={featuredPost} />
                </motion.section>
              ) : null}
            </AnimatePresence>

            <section
              id="all-writing"
              aria-busy={isUpdating}
              aria-labelledby="all-writing-title"
              className="scroll-mt-28 pt-16 sm:pt-20"
            >
              <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Typography id="all-writing-title" type="h2" weight="semibold">
                    {normalizedKeyword
                      ? t("searchResults")
                      : selectedCategory?.name || t("allWriting")}
                  </Typography>
                  <Typography aria-live="polite" color="muted" type="body-sm" className="mt-1">
                    {data ? t("articleCount", { count: data.total }) : t("browseArchive")}
                  </Typography>
                </div>
                <AnimatePresence initial={false} mode="wait">
                  {isFetching && !isLoadingPage ? (
                    <motion.div
                      key="updating-results"
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0, transition: exitTransition }
                          : { opacity: 0, y: -4, transition: exitTransition }
                      }
                      transition={{
                        duration: shouldReduceMotion ? 0 : motionDuration.interaction,
                        ease: pageEaseOut,
                      }}
                    >
                      <Typography aria-live="polite" color="muted" type="body-xs">
                        {t("updating")}
                      </Typography>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <AnimatePresence key={`results-${selectionKey}`} initial={false} mode="wait">
                {isLoadingPage ? (
                  <motion.div
                    key="loading"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0, transition: exitTransition }
                        : { opacity: 0, y: -6, transition: exitTransition }
                    }
                    transition={stateTransition}
                  >
                    <FeedSkeleton />
                  </motion.div>
                ) : isError ? (
                  <motion.div
                    key="error"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0, transition: exitTransition }
                        : { opacity: 0, y: -6, transition: exitTransition }
                    }
                    transition={stateTransition}
                  >
                    <EmptyState size="lg">
                      <EmptyState.Header>
                        <EmptyState.Media variant="icon">
                          <Icon icon="gravity-ui:book-open" aria-hidden="true" />
                        </EmptyState.Media>
                        <EmptyState.Title>{t("unavailableTitle")}</EmptyState.Title>
                        <EmptyState.Description>{t("unavailableHint")}</EmptyState.Description>
                      </EmptyState.Header>
                      <EmptyState.Content>
                        <Button variant="outline" onPress={() => refetch()}>
                          <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" />
                          {t("tryAgain")}
                        </Button>
                      </EmptyState.Content>
                    </EmptyState>
                  </motion.div>
                ) : posts.length === 0 ? (
                  <motion.div
                    key={`empty-${normalizedKeyword || "all"}-${selectedCategoryId ?? "all"}`}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0, transition: exitTransition }
                        : { opacity: 0, y: -6, transition: exitTransition }
                    }
                    transition={stateTransition}
                  >
                    <EmptyState size="lg">
                      <EmptyState.Header>
                        <EmptyState.Media variant="icon">
                          <Icon icon="gravity-ui:book-open" aria-hidden="true" />
                        </EmptyState.Media>
                        <EmptyState.Title>
                          {normalizedKeyword
                            ? t("noMatches")
                            : selectedCategoryId
                              ? t("noTopic")
                              : t("empty")}
                        </EmptyState.Title>
                        <EmptyState.Description>
                          {normalizedKeyword
                            ? t("noMatchesHint")
                            : selectedCategoryId
                              ? t("noTopicHint")
                              : t("emptyHint")}
                        </EmptyState.Description>
                      </EmptyState.Header>
                      {normalizedKeyword ? (
                        <EmptyState.Content>
                          <Button variant="outline" onPress={() => handleSearchChange("")}>
                            {t("clearSearch")}
                          </Button>
                        </EmptyState.Content>
                      ) : selectedCategoryId ? (
                        <EmptyState.Content>
                          <Button
                            variant="outline"
                            onPress={() => handleCategoryChange(new Set(["all"]))}
                          >
                            {t("viewAllTopics")}
                          </Button>
                        </EmptyState.Content>
                      ) : null}
                    </EmptyState>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`results-${resultsKey}`}
                    className="min-w-0"
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: exitTransition }}
                    transition={stateTransition}
                  >
                    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {posts.map((post, index) => (
                        <BlogPostCard
                          key={post.id}
                          index={index}
                          post={post}
                          isRefreshing={isFetching}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence key={`pagination-${selectionKey}`} initial={false} mode="wait">
                {!isAdjustingPage && (page > 0 || totalPages > 1) ? (
                  <motion.div
                    key={`pagination-${totalPages}`}
                    layout={!shouldReduceMotion}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0, transition: exitTransition }
                        : { opacity: 0, y: -4, transition: exitTransition }
                    }
                    transition={{
                      duration: shouldReduceMotion ? 0 : motionDuration.interaction,
                      ease: pageEaseOut,
                    }}
                  >
                    <Pagination
                      className="mt-10 w-full flex-col items-start gap-4 sm:mt-12 sm:flex-row sm:items-center sm:justify-between"
                      size="sm"
                    >
                      <Pagination.Summary>
                        {data
                          ? t("showing", { start: startItem, end: endItem, total: data.total })
                          : t("pageNumber", { page: page + 1 })}
                      </Pagination.Summary>
                      <Pagination.Content>
                        <Pagination.Item>
                          <Pagination.Previous
                            isDisabled={page === 0 || isUpdating}
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
                                isDisabled={isUpdating}
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
                            isDisabled={isUpdating || !data || page >= totalPages - 1}
                            onPress={() => handlePageChange(page + 1)}
                          >
                            <span>{t("next")}</span>
                            <Pagination.NextIcon />
                          </Pagination.Next>
                        </Pagination.Item>
                      </Pagination.Content>
                    </Pagination>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>
          </div>

          <aside
            aria-label={t("overview")}
            className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-24"
          >
            <motion.div
              layout={!shouldReduceMotion}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.16,
                duration: shouldReduceMotion ? 0 : motionDuration.reveal,
                ease: pageEaseOut,
              }}
            >
              <ArchiveRail
                key={selectionKey}
                categories={categories}
                posts={posts}
                publishedTotal={facets?.totalPublishedCount ?? data?.total ?? 0}
              />
            </motion.div>
            <AnimatePresence initial={false} mode="wait">
              {!normalizedKeyword && !selectedCategoryId && continueReading.length > 0 ? (
                <motion.div
                  key="continue-reading"
                  layout={!shouldReduceMotion}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0, transition: exitTransition }
                      : { opacity: 0, y: -8, transition: exitTransition }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0 : motionDuration.reveal,
                    ease: pageEaseOut,
                  }}
                >
                  <ContinueReading compact entries={continueReading} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </aside>
        </div>
      </div>
    </div>
  );
}
