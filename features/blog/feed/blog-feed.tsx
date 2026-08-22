"use client";

import Link from "next/link";
import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
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
import { useDeferredValue, useState } from "react";
import { useReducedMotion } from "motion/react";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { type ReadingHistoryResponse, useGetLibraryOverviewQuery } from "@/lib/features/library";
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";

const PAGE_SIZE = 8;
const easeOut = [0.22, 1, 0.36, 1] as const;
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

function PostVisual({ post }: { post: PostResponse }) {
  return (
    <SmartColorSurface
      seed={post.slug}
      tone={getSmartColorTone({ categoryName: post.category?.name, title: post.title })}
    >
      <div aria-hidden="true" className="aspect-[16/9] w-full" />
    </SmartColorSurface>
  );
}

function BlogPostCard({ post, index }: { post: PostResponse; index: number }) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <Link className="block h-full no-underline" href={`/single/${post.slug}`} prefetch={false}>
      <MotionCard
        variant="secondary"
        className="h-full overflow-hidden p-0"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          delay: shouldReduceMotion ? 0 : Math.min(index, 3) * 0.04,
          duration: shouldReduceMotion ? 0 : 0.55,
          ease: easeOut,
        }}
      >
        <PostVisual post={post} />
        <Card.Header>
          {post.category?.name || post.series ? (
            <div className="flex flex-wrap gap-2">
              {post.category?.name ? (
                <Chip size="sm" variant="soft">
                  {post.category.name}
                </Chip>
              ) : null}
              {post.series ? (
                <Chip size="sm" variant="secondary">
                  <BookOpen aria-hidden="true" className="size-3.5" />
                  {post.series.name}
                </Chip>
              ) : null}
            </div>
          ) : null}
          <Card.Title>{post.title}</Card.Title>
          {post.summary ? <Card.Description>{post.summary}</Card.Description> : null}
        </Card.Header>
        <Card.Footer className="mt-auto justify-between">
          <Typography color="muted" type="body-xs">
            {formatDate(post.createdAt)}
          </Typography>
          <Typography
            color="muted"
            type="body-xs"
            className="flex items-center gap-1.5 tabular-nums"
          >
            <Eye aria-hidden="true" className="size-3.5" />
            {post.views.toLocaleString("en-US")}
          </Typography>
        </Card.Footer>
      </MotionCard>
    </Link>
  );
}

function FeaturedPost({ post }: { post: PostDigestResponse }) {
  return (
    <Link className="block no-underline" href={`/single/${post.slug}`} prefetch={false}>
      <Card variant="tertiary" className="overflow-hidden p-0 md:flex-row md:items-stretch">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden md:aspect-auto md:w-[46%]">
          <SmartColorSurface
            className="h-full"
            seed={`featured-${post.slug}`}
            tone={getSmartColorTone({ categoryName: post.category?.name, title: post.title })}
          >
            <div aria-hidden="true" className="aspect-[16/10] w-full md:aspect-auto md:h-full" />
          </SmartColorSurface>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10">
          <Chip color="accent" size="sm" variant="soft">
            Featured
          </Chip>
          <Card.Header className="p-0">
            <Card.Title className="text-[clamp(1.75rem,3vw,3rem)] leading-[1.02] tracking-[-0.035em]">
              {post.title}
            </Card.Title>
            {post.summary ? <Card.Description>{post.summary}</Card.Description> : null}
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
      </Card>
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
      className="grid gap-5 md:grid-cols-2"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} variant="secondary" className="overflow-hidden p-0">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <Card.Header>
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-7 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </Card.Header>
        </Card>
      ))}
    </div>
  );
}

function ContinueReading({ entries }: { entries: ReadingHistoryResponse[] }) {
  const formatRelativeTime = useRelativeTime();
  return (
    <section aria-labelledby="continue-reading-title" className="mt-12">
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
      <div className="grid gap-3 md:grid-cols-3">
        {entries.map(({ lastReadAt, post, positionAnchor, progressPercent }) => (
          <Card key={post.id} variant="secondary" className="gap-4 p-5">
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
              <Link
                className="text-accent inline-flex items-center gap-1.5 text-sm font-medium no-underline"
                href={getReadingPositionHref(post.slug, positionAnchor)}
              >
                Continue
                <Play aria-hidden="true" className="size-3.5" />
              </Link>
            </Card.Footer>
          </Card>
        ))}
      </div>
    </section>
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
    document.getElementById("all-writing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex max-w-3xl flex-col items-start">
          <MotionChip
            color="accent"
            size="sm"
            variant="soft"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: easeOut }}
          >
            Chronicle
          </MotionChip>
          <MotionTypography
            type="h1"
            weight="bold"
            className="mt-5 text-[clamp(2.75rem,6vw,5.75rem)] leading-[0.95] tracking-[-0.06em]"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.65, delay: 0.06, ease: easeOut }}
          >
            Writing worth returning to.
          </MotionTypography>
          <MotionTypography
            color="muted"
            type="body"
            className="mt-5 max-w-xl"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: 0.12, ease: easeOut }}
          >
            Essays on software, design, markets, and the questions that remain useful over time.
          </MotionTypography>
          <Link
            className="text-accent mt-5 inline-flex items-center gap-2 text-sm font-medium no-underline"
            href="/columns"
          >
            Browse columns
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </header>

        <SearchField
          fullWidth
          name="article-search"
          value={searchValue}
          onChange={handleSearchChange}
          className="mt-10 max-w-xl"
        >
          <Label className="sr-only">Search articles</Label>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search the chronicle" />
            <SearchField.ClearButton aria-label="Clear search" />
          </SearchField.Group>
        </SearchField>

        <div className="mt-6 min-w-0">
          {isFacetsLoading ? (
            <div aria-label="Loading topics" className="flex gap-2" role="status">
              {["w-20", "w-28", "w-24", "w-36"].map((width) => (
                <Skeleton key={width} className={`h-8 ${width} rounded-full`} />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <ScrollShadow hideScrollBar orientation="horizontal">
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
                      <span className="text-muted text-xs tabular-nums">{category.count ?? 0}</span>
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            </ScrollShadow>
          ) : null}
        </div>

        {!keyword && !selectedCategoryId && featuredPost ? (
          <section aria-labelledby="featured-writing-title" className="mt-16">
            <Typography id="featured-writing-title" type="h2" weight="semibold" className="mb-6">
              Featured writing
            </Typography>
            <FeaturedPost post={featuredPost} />
          </section>
        ) : null}

        {!keyword && !selectedCategoryId && continueReading.length > 0 ? (
          <ContinueReading entries={continueReading} />
        ) : null}

        <section
          id="all-writing"
          aria-busy={isFetching}
          aria-labelledby="all-writing-title"
          className="scroll-mt-28 pt-20"
        >
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Typography id="all-writing-title" type="h2" weight="semibold">
                {keyword ? "Search results" : selectedCategory?.name || "All writing"}
              </Typography>
              <Typography aria-live="polite" color="muted" type="body-sm" className="mt-1">
                {data ? `${data.total.toLocaleString("en-US")} articles` : "Browse the archive"}
              </Typography>
            </div>
            {isFetching && !isLoading ? (
              <Typography aria-live="polite" color="muted" type="body-xs">
                Updating results
              </Typography>
            ) : null}
          </div>

          {isLoading ? <FeedSkeleton /> : null}

          {!isLoading && isError ? (
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
          ) : null}

          {!isLoading && !isError && posts.length === 0 ? (
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
          ) : null}

          {!isLoading && !isError && posts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {posts.map((post, index) => (
                <BlogPostCard key={post.id} index={index} post={post} />
              ))}
            </div>
          ) : null}

          {!isLoading && !isError && totalPages > 1 ? (
            <Pagination className="mt-12 w-full" size="sm">
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
          ) : null}
        </section>
      </div>
    </div>
  );
}
