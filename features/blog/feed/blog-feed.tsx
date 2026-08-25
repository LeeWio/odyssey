"use client";

import Link from "next/link";
import { MotionCard, MotionChip, MotionTypography } from "@/components/ui";
import type { PostDigestResponse, PostResponse } from "@/features/blog/api/blog-api";
import { useGetFeaturedPostsQuery, useGetPublicPostsQuery } from "@/features/blog/api/blog-api";
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
import { ArrowRight, ArrowRotateLeft, BookOpen, Eye, Play } from "@gravity-ui/icons";
import { AnimatePresence, animate as animateMotion, motion, useReducedMotion } from "motion/react";
import { useDeferredValue, useRef, useState } from "react";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { type ReadingHistoryResponse, useGetLibraryOverviewQuery } from "@/lib/features/library";
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";

const PAGE_SIZE = 8;
const easeOut = [0.22, 1, 0.36, 1] as const;
const easeIn = [0.4, 0, 1, 1] as const;
const motionDuration = {
  interaction: 0.22,
  reveal: 0.5,
  exit: 0.22,
} as const;
const MotionLink = motion.create(Link);

function formatDate(value?: string | null) {
  if (!value) return "Recently published";

  return new Intl.DateTimeFormat("en-US", {
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

function BlogPostCard({ post, index }: { post: PostResponse; index: number }) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const category = post.category?.name;
  const series = post.series?.name;

  return (
    <Link
      className="group focus-visible:ring-accent block h-full cursor-[var(--cursor-interactive)] rounded-2xl no-underline outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      href={`/single/${post.slug}`}
      prefetch={false}
    >
      <MotionCard
        variant="secondary"
        className="group-focus-visible:ring-accent flex h-full flex-col p-5 group-focus-visible:ring-2 sm:p-6"
        initial={
          shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.985, filter: "blur(3px)" }
        }
        whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        whileHover={
          shouldReduceMotion
            ? undefined
            : { y: -2, transition: { duration: motionDuration.interaction, ease: easeOut } }
        }
        whileTap={
          shouldReduceMotion
            ? undefined
            : { scale: 0.985, transition: { duration: motionDuration.interaction, ease: easeOut } }
        }
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          delay: shouldReduceMotion ? 0 : Math.min(index, 3) * 0.04,
          duration: shouldReduceMotion ? 0 : motionDuration.reveal,
          ease: easeOut,
        }}
      >
        <Card.Header className="gap-4 p-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-wrap gap-2">
              {category ? (
                <Chip size="sm" variant="soft">
                  {category}
                </Chip>
              ) : null}
              {series ? (
                <Chip size="sm" variant="tertiary">
                  <BookOpen aria-hidden="true" className="size-3.5" />
                  {series}
                </Chip>
              ) : null}
            </div>
            <span className="text-muted shrink-0 font-mono text-xs tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <Card.Title className="text-xl leading-snug sm:text-2xl">{post.title}</Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-3 leading-6">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="text-muted mt-auto flex flex-wrap items-center justify-between gap-3 p-0 pt-8 text-xs">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="truncate">{getDisplayAuthor(post.authorName)}</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
            <Eye aria-hidden="true" className="size-3.5" />
            {post.views.toLocaleString("en-US")}
          </span>
        </Card.Footer>
      </MotionCard>
    </Link>
  );
}

function FeaturedPost({ post }: { post: PostDigestResponse }) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <Link
      className="group focus-visible:ring-accent block cursor-[var(--cursor-interactive)] rounded-2xl no-underline outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      href={`/single/${post.slug}`}
      prefetch={false}
    >
      <MotionCard
        variant="tertiary"
        className="group-focus-visible:ring-accent group-focus-visible:ring-2"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={
          shouldReduceMotion
            ? undefined
            : { y: -2, transition: { duration: motionDuration.interaction, ease: easeOut } }
        }
        whileTap={
          shouldReduceMotion
            ? undefined
            : { scale: 0.985, transition: { duration: motionDuration.interaction, ease: easeOut } }
        }
        transition={{
          duration: shouldReduceMotion ? 0 : motionDuration.reveal,
          ease: easeOut,
        }}
      >
        <div className="flex flex-1 flex-col gap-5 p-6 sm:p-8 lg:p-10">
          <Chip color="accent" size="sm" variant="soft">
            Featured
          </Chip>
          <Card.Header className="p-0">
            <Card.Title className="text-3xl leading-tight tracking-normal sm:text-4xl lg:text-5xl">
              {post.title}
            </Card.Title>
            {post.summary ? (
              <Card.Description className="line-clamp-2 leading-6">{post.summary}</Card.Description>
            ) : null}
          </Card.Header>
          <Card.Footer className="gap-3 p-0">
            <Typography color="muted" type="body-xs">
              {getDisplayAuthor(post.authorName)}
            </Typography>
            <Typography color="muted" type="body-xs">
              {formatDate(post.publishedAt)}
            </Typography>
          </Card.Footer>
        </div>
      </MotionCard>
    </Link>
  );
}

function FeedSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading articles"
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
  const formatRelativeTime = useRelativeTime();
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section aria-labelledby="continue-reading-title" className={compact ? "" : "mt-12"}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <Typography id="continue-reading-title" type="h2" weight="semibold">
            Continue reading
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            Pick up where you left off.
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
                ease: easeOut,
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
                  aria-label={`${post.title} reading progress`}
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
                    Read {formatRelativeTime(lastReadAt)}
                  </Typography>
                  <MotionLink
                    className="text-accent inline-flex items-center gap-1.5 text-sm font-medium no-underline"
                    href={getReadingPositionHref(post.slug, positionAnchor)}
                    whileHover={shouldReduceMotion ? undefined : { x: 2 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : motionDuration.interaction,
                      ease: easeOut,
                    }}
                  >
                    Continue
                    <Play aria-hidden="true" className="size-3.5" />
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
          <Card.Title>Archive at a glance</Card.Title>
          <Card.Description>
            A quick view of what is published and where the archive is growing.
          </Card.Description>
        </Card.Header>

        <Card.Content className="p-0">
          <dl className="grid grid-cols-2 gap-3">
            <div className="border-default/40 rounded-xl border p-3">
              <dt className="text-muted text-xs">Published</dt>
              <dd className="text-foreground mt-1 font-mono text-2xl tabular-nums">
                {publishedTotal.toLocaleString("en-US")}
              </dd>
            </div>
            <div className="border-default/40 rounded-xl border p-3">
              <dt className="text-muted text-xs">Topics</dt>
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
              ease: easeOut,
            }}
          >
            Browse columns
            <ArrowRight aria-hidden="true" className="size-4" />
          </MotionLink>
        </Card.Footer>
      </Card>

      {popularCategories.length > 0 ? (
        <Card variant="secondary" className="gap-4 p-5 sm:p-6">
          <Card.Header className="gap-1 p-0">
            <Card.Title className="text-base">Popular topics</Card.Title>
            <Card.Description>Start with the subjects readers return to most.</Card.Description>
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
          <Card.Title className="text-base">Reading signals</Card.Title>
          <Card.Description>A small pulse from the current results.</Card.Description>
        </Card.Header>
        <Card.Content className="p-0">
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Average views</dt>
              <dd className="text-foreground font-mono tabular-nums">
                {averageViews.toLocaleString("en-US")}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Estimated read</dt>
              <dd className="text-foreground font-mono tabular-nums">
                {averageReadingMinutes ? `${averageReadingMinutes} min` : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Latest entry</dt>
              <dd className="text-foreground text-right text-xs">
                {latestDate ? formatDate(latestDate) : "No entries"}
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
              ease: easeOut,
            }}
          >
            <Card variant="secondary" className="gap-4 p-5 sm:p-6">
              <Card.Header className="gap-1 p-0">
                <Card.Title className="text-base">Columns in view</Card.Title>
                <Card.Description>Series represented in this page.</Card.Description>
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

export default function BlogFeed() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();
  const scrollAnimationRef = useRef<{ stop: () => void } | null>(null);
  const keyword = useDeferredValue(searchValue.trim());
  const { data, isLoading, isFetching, isError, refetch } = useGetPublicPostsQuery({
    categoryId: selectedCategoryId,
    keyword: keyword || undefined,
    page,
    size: PAGE_SIZE,
  });
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
    ease: easeOut,
  };
  const exitTransition = {
    duration: shouldReduceMotion ? 0 : motionDuration.exit,
    ease: easeIn,
  };
  const stateTransition = {
    duration: shouldReduceMotion ? 0 : motionDuration.interaction,
    ease: easeOut,
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(0);
  };

  const handleCategoryChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [key] = Array.from(keys);
    const nextCategoryId = key === "all" || key == null ? undefined : Number(key);

    setSelectedCategoryId(Number.isFinite(nextCategoryId) ? nextCategoryId : undefined);
    setPage(0);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
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
      ease: easeOut,
      onUpdate: (value) => window.scrollTo(0, value),
    });
  };

  return (
    <div className="bg-background min-h-[100dvh] w-full px-4 pt-24 pb-28 sm:px-8 sm:pt-28 lg:px-10 lg:pt-32">
      <div className="w-full">
        <header className="flex w-full flex-col items-start">
          <MotionChip
            color="accent"
            size="sm"
            variant="soft"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : motionDuration.reveal, ease: easeOut }}
          >
            Chronicle
          </MotionChip>
          <MotionTypography
            type="h1"
            weight="bold"
            className="mt-5 text-5xl leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : motionDuration.reveal,
              delay: shouldReduceMotion ? 0 : 0.06,
              ease: easeOut,
            }}
          >
            Writing worth returning to.
          </MotionTypography>
          <MotionTypography
            color="muted"
            type="body"
            className="mt-5 w-full"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : motionDuration.reveal,
              delay: shouldReduceMotion ? 0 : 0.12,
              ease: easeOut,
            }}
          >
            Essays on software, design, markets, and the questions that remain useful over time.
          </MotionTypography>
          <MotionLink
            className="text-accent mt-5 inline-flex cursor-[var(--cursor-interactive)] items-center gap-2 text-sm font-medium no-underline"
            href="/columns"
            whileHover={shouldReduceMotion ? undefined : { x: 2 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            transition={{
              duration: shouldReduceMotion ? 0 : motionDuration.interaction,
              ease: easeOut,
            }}
          >
            Browse columns
            <ArrowRight aria-hidden="true" className="size-4" />
          </MotionLink>
        </header>

        <section
          aria-label="Browse the archive"
          className="bg-surface-secondary mt-10 flex flex-col gap-4 rounded-2xl p-3 sm:p-4"
        >
          <SearchField
            fullWidth
            name="article-search"
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full"
          >
            <Label className="sr-only">Search articles</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search the chronicle" />
              <SearchField.ClearButton aria-label="Clear search" />
            </SearchField.Group>
          </SearchField>

          <div className="min-w-0">
            {isFacetsLoading ? (
              <div aria-label="Loading topics" className="flex gap-2" role="status">
                {["w-20", "w-28", "w-24", "w-36"].map((width) => (
                  <Skeleton key={width} className={`h-8 ${width} rounded-full`} />
                ))}
              </div>
            ) : categories.length > 0 ? (
              <ScrollShadow hideScrollBar orientation="horizontal" className="-mx-1 px-1">
                <TagGroup
                  aria-label="Filter articles by topic"
                  selectedKeys={new Set([selectedCategoryId ? String(selectedCategoryId) : "all"])}
                  selectionMode="single"
                  size="sm"
                  variant="surface"
                  className="w-max min-w-full"
                  onSelectionChange={handleCategoryChange}
                >
                  <TagGroup.List className="flex-nowrap pr-8">
                    <Tag id="all" textValue="All topics">
                      All topics
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

        <div className="mt-14 grid gap-10 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] xl:items-start">
          <div className="min-w-0">
            <AnimatePresence initial={false} mode="wait">
              {!keyword && !selectedCategoryId && featuredPost ? (
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
                    Featured writing
                  </Typography>
                  <FeaturedPost post={featuredPost} />
                </motion.section>
              ) : null}
            </AnimatePresence>

            <section
              id="all-writing"
              aria-busy={isFetching}
              aria-labelledby="all-writing-title"
              className="scroll-mt-28 pt-16 sm:pt-20"
            >
              <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Typography id="all-writing-title" type="h2" weight="semibold">
                    {keyword ? "Search results" : selectedCategory?.name || "All writing"}
                  </Typography>
                  <Typography aria-live="polite" color="muted" type="body-sm" className="mt-1">
                    {data ? `${data.total.toLocaleString("en-US")} articles` : "Browse the archive"}
                  </Typography>
                </div>
                <AnimatePresence initial={false} mode="wait">
                  {isFetching && !isLoading ? (
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
                        ease: easeOut,
                      }}
                    >
                      <Typography aria-live="polite" color="muted" type="body-xs">
                        Updating results
                      </Typography>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false} mode="wait">
                {isLoading ? (
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
                          <BookOpen aria-hidden="true" />
                        </EmptyState.Media>
                        <EmptyState.Title>The chronicle is unavailable</EmptyState.Title>
                        <EmptyState.Description>
                          The archive could not be loaded. Please try again in a moment.
                        </EmptyState.Description>
                      </EmptyState.Header>
                      <EmptyState.Content>
                        <Button variant="outline" onPress={() => refetch()}>
                          <ArrowRotateLeft aria-hidden="true" />
                          Try again
                        </Button>
                      </EmptyState.Content>
                    </EmptyState>
                  </motion.div>
                ) : posts.length === 0 ? (
                  <motion.div
                    key={`empty-${keyword || "all"}-${selectedCategoryId ?? "all"}`}
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
                          <BookOpen aria-hidden="true" />
                        </EmptyState.Media>
                        <EmptyState.Title>
                          {keyword ? "No matching articles" : "No articles yet"}
                        </EmptyState.Title>
                        <EmptyState.Description>
                          {keyword
                            ? "Try a different title, topic, or phrase."
                            : "Published writing will appear here when it is ready."}
                        </EmptyState.Description>
                      </EmptyState.Header>
                      {keyword ? (
                        <EmptyState.Content>
                          <Button variant="outline" onPress={() => handleSearchChange("")}>
                            Clear search
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
                        <BlogPostCard key={post.id} index={index} post={post} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false} mode="wait">
                {!isLoading && !isError && totalPages > 1 ? (
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
                      ease: easeOut,
                    }}
                  >
                    <Pagination
                      className="mt-10 w-full flex-col items-start gap-4 sm:mt-12 sm:flex-row sm:items-center sm:justify-between"
                      size="sm"
                    >
                      <Pagination.Summary>
                        Showing {startItem}-{endItem} of {data?.total ?? 0}
                      </Pagination.Summary>
                      <Pagination.Content>
                        <Pagination.Item>
                          <Pagination.Previous
                            isDisabled={page === 0}
                            onPress={() => handlePageChange(page - 1)}
                          >
                            <Pagination.PreviousIcon />
                            <span>Previous</span>
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
                            <span>Next</span>
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
            aria-label="Archive overview"
            className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-24"
          >
            <motion.div
              layout={!shouldReduceMotion}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.16,
                duration: shouldReduceMotion ? 0 : motionDuration.reveal,
                ease: easeOut,
              }}
            >
              <ArchiveRail
                categories={categories}
                posts={posts}
                publishedTotal={facets?.totalPublishedCount ?? data?.total ?? 0}
              />
            </motion.div>
            <AnimatePresence initial={false} mode="wait">
              {!keyword && !selectedCategoryId && continueReading.length > 0 ? (
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
                    ease: easeOut,
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
