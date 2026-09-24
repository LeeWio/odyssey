"use client";

import { Icon } from "@iconify/react";
import { EmptyState } from "@heroui-pro/react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  Header,
  Label,
  Link,
  ListBox,
  Popover,
  ProgressBar,
  ScrollShadow,
  Skeleton,
  Surface,
  Typography,
} from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { selectIsAuthenticated } from "@/lib/features/auth";
import { useGetPublicColumnsQuery } from "@/lib/features/column";
import { type ReadingHistoryResponse, useGetLibraryOverviewQuery } from "@/lib/features/library";
import {
  useRetrieveDiscoveryQuery,
  useRetrieveFacetsQuery,
  useRetrievePublicSeriesQuery,
} from "@/lib/features/openapi";
import type { OpenApiComponents } from "@/lib/features/openapi/openapi.generated";
import { useGetFeaturedPostsQuery, useGetPublicPostsQuery } from "@/lib/features/post";
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";

type CategoryFacet = OpenApiComponents["schemas"]["CategoryFacet"];
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
  publishedAt?: string | null;
  createdAt?: string | null;
};

type Collection = {
  id?: number;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  postsCount?: number;
  href: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Recently published";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently published";

  return new Intl.DateTimeFormat("en-US", {
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

function AuthorPopover({ name, avatar }: { name: string; avatar?: string | null }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const photo = avatar?.trim() || "https://img.heroui.chat/image/avatar?w=400&h=400&u=1";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <Popover>
      <Popover.Trigger aria-label="User profile">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <Avatar.Image alt={name} src={photo} />
            <Avatar.Fallback>{initials || "SJ"}</Avatar.Fallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-muted text-xs">@sarahj</p>
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Content className="w-[320px]">
        <Popover.Dialog>
          <Popover.Heading>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar size="md">
                  <Avatar.Image alt={name} src={photo} />
                  <Avatar.Fallback>{initials || "SJ"}</Avatar.Fallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-muted text-sm">@sarahj</p>
                </div>
              </div>
              <Button
                className="rounded-full"
                size="sm"
                variant={isFollowing ? "tertiary" : "primary"}
                onPress={() => setIsFollowing(!isFollowing)}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </Popover.Heading>
          <p className="text-muted mt-3 text-sm">
            Product designer and creative director. Building beautiful experiences that matter.
          </p>
          <div className="mt-3 flex gap-4">
            <div>
              <span className="font-semibold">892</span>
              <span className="text-muted ms-1 text-sm">Following</span>
            </div>
            <div>
              <span className="font-semibold">12.5K</span>
              <span className="text-muted ms-1 text-sm">Followers</span>
            </div>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function storyMeta(post: Story) {
  return [post.category?.name, formatDate(storyDate(post))].filter(Boolean).join(" · ");
}

function MostReadLead({ post }: { post: Story }) {
  const cover = post.coverImage?.trim();

  return (
    <article className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)] lg:gap-12">
      <Link
        className="group/cover bg-surface-secondary block overflow-hidden rounded-3xl no-underline"
        href={storyHref(post)}
      >
        {cover ? (
          // Cover hosts are not in next/image remotePatterns.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/cover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/cover:scale-100"
            src={cover}
          />
        ) : (
          <div className="aspect-[4/3] w-full" />
        )}
      </Link>
      <div className="flex flex-col gap-5">
        <Typography className="tabular-nums" color="muted" type="body-sm">
          01
        </Typography>
        <Typography
          className="font-display text-[clamp(2rem,3.4vw,3.25rem)] leading-[1.02] tracking-[-0.035em]"
          type="h3"
        >
          <Link className="text-foreground no-underline" href={storyHref(post)}>
            {post.title || "Untitled story"}
          </Link>
        </Typography>
        {post.summary ? (
          <Typography className="line-clamp-3 max-w-[36ch]" color="muted">
            {post.summary}
          </Typography>
        ) : null}
        <div className="flex items-center justify-between gap-4 pt-2">
          <AuthorPopover
            avatar={post.authorAvatar}
            name={post.authorName?.trim() || "Sarah Johnson"}
          />
          <Typography className="shrink-0 tabular-nums" color="muted" type="body-xs">
            {(post.views ?? 0).toLocaleString("en-US")} views
          </Typography>
        </div>
      </div>
    </article>
  );
}

function MostReadEntry({ post, rank }: { post: Story; rank: number }) {
  return (
    <article className="border-separator grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 border-b py-6 last:border-b-0">
      <Typography className="pt-1 tabular-nums" color="muted" type="body-sm">
        {String(rank).padStart(2, "0")}
      </Typography>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Typography
            className="font-display text-[clamp(1.35rem,2vw,1.75rem)] leading-tight tracking-[-0.03em]"
            type="h3"
          >
            <Link className="text-foreground no-underline" href={storyHref(post)}>
              {post.title || "Untitled story"}
            </Link>
          </Typography>
          <Typography color="muted" type="body-sm">
            {storyMeta(post)}
          </Typography>
        </div>
        <div className="flex items-center justify-between gap-4">
          <AuthorPopover
            avatar={post.authorAvatar}
            name={post.authorName?.trim() || "Sarah Johnson"}
          />
          <Typography className="shrink-0 tabular-nums" color="muted" type="body-xs">
            {(post.views ?? 0).toLocaleString("en-US")} views
          </Typography>
        </div>
      </div>
    </article>
  );
}

function StoryCard({ post }: { post: Story }) {
  const cover = post.coverImage?.trim();

  return (
    <Card className="h-full" variant="secondary">
      {cover ? (
        // Cover hosts are not in next/image remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="aspect-[16/9] w-full object-cover" src={cover} />
      ) : null}
      <Card.Header>
        <div className="flex flex-wrap items-center gap-2">
          {post.category?.name ? (
            <Chip size="sm" variant="soft">
              {post.category.name}
            </Chip>
          ) : null}
          <Typography className="tabular-nums" color="muted" type="body-xs">
            {formatDate(storyDate(post))}
          </Typography>
        </div>
        <Card.Title className="line-clamp-2 text-xl leading-7">
          <Link className="text-foreground no-underline" href={storyHref(post)}>
            {post.title || "Untitled story"}
          </Link>
        </Card.Title>
        {post.summary ? (
          <Card.Description className="line-clamp-3">{post.summary}</Card.Description>
        ) : null}
      </Card.Header>
      <Card.Footer className="mt-auto items-center">
        <AuthorPopover
          avatar={post.authorAvatar}
          name={post.authorName?.trim() || "Sarah Johnson"}
        />
        <Typography className="ms-auto shrink-0 tabular-nums" color="muted" type="body-xs">
          {(post.views ?? 0).toLocaleString("en-US")} views
        </Typography>
      </Card.Footer>
    </Card>
  );
}

function JournalMasthead({
  categories,
  essayCount,
}: {
  categories: Array<CategoryFacet & { id: number; name: string }>;
  essayCount: number;
}) {
  const today = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(new Date());
  const leadTopics = categories.slice(0, 4);

  return (
    <header className="border-separator flex flex-col gap-6 border-y py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography className="tabular-nums" color="muted" type="body-sm">
          Vol. 01
        </Typography>
        <Typography color="muted" type="body-sm">
          {today}
        </Typography>
        <Typography className="tabular-nums" color="muted" type="body-sm">
          {essayCount.toLocaleString("en-US")} essays
        </Typography>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <Typography
            className="font-display text-[clamp(4.5rem,12vw,9rem)] leading-[0.82] tracking-[-0.045em]"
            type="h1"
          >
            Journal
          </Typography>
          <Typography
            className="font-display text-2xl leading-snug italic sm:text-3xl"
            color="muted"
          >
            Notes on software, design, and the systems behind the work.
          </Typography>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {leadTopics.map((category) => (
              <Chip key={category.id} size="sm" variant="soft">
                <Link className="no-underline" href={`/explore?category=${category.id}`}>
                  {category.name}
                </Link>
              </Chip>
            ))}
          </div>
          <Link className="font-medium no-underline" href="/archive">
            Browse by date
            <Link.Icon />
          </Link>
        </div>
      </div>
    </header>
  );
}

function ContinueReading({ entries }: { entries: ReadingHistoryResponse[] }) {
  const formatRelativeTime = useRelativeTime();
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="continue-reading-title" className="flex flex-col gap-8">
      <div className="flex items-end justify-between gap-4">
        <Typography id="continue-reading-title" type="h2" weight="semibold">
          Continue reading
        </Typography>
        <Link className="shrink-0 no-underline" href="/library">
          Library
          <Link.Icon />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.slice(0, 3).map(({ lastReadAt, post, positionAnchor, progressPercent }) => (
          <Card key={post.id} variant="secondary">
            <Card.Header>
              <Card.Title className="line-clamp-2 text-lg leading-7">
                <Link
                  className="text-foreground no-underline"
                  href={getReadingPositionHref(post.slug, positionAnchor)}
                >
                  {post.title}
                </Link>
              </Card.Title>
            </Card.Header>
            <Card.Content>
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
            </Card.Content>
            <Card.Footer>
              <Typography color="muted" type="body-xs">
                {progressPercent}% read {formatRelativeTime(lastReadAt)}
              </Typography>
            </Card.Footer>
          </Card>
        ))}
      </div>
    </section>
  );
}

function StorySkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading stories"
      className="grid gap-4 lg:grid-cols-2"
      role="status"
    >
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} variant="secondary">
          <Card.Content className="flex flex-col gap-3">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="h-7 w-4/5 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

export function JournalPage() {
  const router = useRouter();
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const topicsContentRef = useRef<HTMLDivElement>(null);
  const [topicsHeight, setTopicsHeight] = useState(0);
  const reduceMotion = useReducedMotion();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const discoveryQuery = useRetrieveDiscoveryQuery();
  const facetsQuery = useRetrieveFacetsQuery();
  const featuredQuery = useGetFeaturedPostsQuery({ page: 0, size: 4 });
  const latestQuery = useGetPublicPostsQuery({ page: 0, size: 8 });
  const columnsQuery = useGetPublicColumnsQuery();
  const seriesQuery = useRetrievePublicSeriesQuery();
  const libraryQuery = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });

  const discovery = discoveryQuery.data;
  const featuredPosts = featuredQuery.data?.list ?? [];
  const latestPosts = (latestQuery.data?.list ?? []).slice(0, 6);
  const categories = (facetsQuery.data?.categories ?? []).filter(
    (category): category is CategoryFacet & { id: number; name: string } =>
      category.id != null && Boolean(category.name) && (category.count ?? 0) > 0
  );
  const essayCount = facetsQuery.data?.totalPublishedCount ?? latestQuery.data?.total ?? 0;
  const topicsOverflow = categories.length > 5;
  const topicsCollapsedHeight = 320;

  useLayoutEffect(() => {
    const node = topicsContentRef.current;
    if (!node) return;

    const measure = () => setTopicsHeight(node.offsetHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => observer.disconnect();
  }, [categories.length]);

  const collections = useMemo(() => {
    const values = new Map<string, Collection>();

    for (const column of columnsQuery.data ?? []) {
      values.set(column.slug, {
        description: column.description,
        href: `/columns/${column.slug}`,
        id: column.id,
        name: column.name,
        postsCount: column.postsCount,
        slug: column.slug,
      });
    }

    const fallbackSeries = seriesQuery.data?.length ? seriesQuery.data : (discovery?.series ?? []);
    for (const series of fallbackSeries) {
      const slug = series.slug ?? String(series.id ?? "");
      if (!slug || values.has(slug)) continue;
      values.set(slug, {
        description: series.description,
        href: series.slug ? `/columns/${series.slug}` : "/columns",
        id: series.id,
        name: series.name,
        postsCount: series.postsCount,
        slug,
      });
    }

    return Array.from(values.values());
  }, [columnsQuery.data, discovery?.series, seriesQuery.data]);

  const popular = (discovery?.trending?.length ? discovery.trending : discovery?.mostRead) ?? [];

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:px-14 xl:px-20">
      <div className="flex w-full flex-col gap-24">
        <JournalMasthead categories={categories} essayCount={essayCount} />

        {discoveryQuery.isError && featuredQuery.isError ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Featured stories unavailable</Alert.Title>
              <Alert.Description>Latest writing below is still available.</Alert.Description>
            </Alert.Content>
            <Button variant="outline" onPress={() => void featuredQuery.refetch()}>
              Try again
            </Button>
          </Alert>
        ) : null}

        <ContinueReading entries={libraryQuery.data?.continueReading ?? []} />

        <div className="grid items-start gap-16 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-20">
            <section aria-labelledby="featured-title" className="flex flex-col gap-6">
              <Typography id="featured-title" type="h2" weight="semibold">
                Featured
              </Typography>
              {featuredQuery.isLoading ? (
                <StorySkeleton count={3} />
              ) : featuredPosts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {featuredPosts.slice(0, 3).map((post) => (
                    <StoryCard key={post.id} post={post} />
                  ))}
                </div>
              ) : null}
            </section>

            <section aria-labelledby="latest-title" className="flex flex-col gap-8">
              <Typography id="latest-title" type="h2" weight="semibold">
                Latest
              </Typography>
              {latestQuery.isLoading ? (
                <StorySkeleton />
              ) : latestQuery.isError ? (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Latest stories could not be loaded</Alert.Title>
                    <Alert.Description>Try the request again in a moment.</Alert.Description>
                  </Alert.Content>
                  <Button variant="outline" onPress={() => void latestQuery.refetch()}>
                    <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" />
                    Try again
                  </Button>
                </Alert>
              ) : latestPosts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {latestPosts.map((post) => (
                    <StoryCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Title>No published stories yet</EmptyState.Title>
                    <EmptyState.Description>
                      New essays will appear here once they are published.
                    </EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              )}
            </section>

            {popular.length > 0 ? (
              <section aria-labelledby="popular-title" className="flex flex-col gap-10">
                <Typography id="popular-title" type="h2" weight="semibold">
                  Most read
                </Typography>
                <MostReadLead post={popular[0]} />
                {popular.length > 1 ? (
                  <div className="border-separator border-t">
                    {popular.slice(1, 4).map((post, index) => (
                      <MostReadEntry key={post.id ?? post.slug} post={post} rank={index + 2} />
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="flex flex-col gap-14 xl:sticky xl:top-28">
            {categories.length > 0 ? (
              <Surface className="flex flex-col gap-3 rounded-3xl p-2" variant="secondary">
                <div className="flex items-baseline justify-between px-2">
                  <Header id="topics-title" className="text-base">
                    Topics
                  </Header>
                  <span className="text-muted text-sm tabular-nums">{categories.length}</span>
                </div>
                <motion.div
                  animate={{
                    height: topicsOverflow
                      ? topicsExpanded
                        ? topicsHeight || topicsCollapsedHeight
                        : Math.min(topicsHeight || topicsCollapsedHeight, topicsCollapsedHeight)
                      : "auto",
                  }}
                  className="overflow-hidden"
                  initial={false}
                  transition={
                    reduceMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
                  }
                >
                  <ScrollShadow className="h-full" orientation="vertical" size={48}>
                    <div ref={topicsContentRef}>
                      <ListBox
                        aria-labelledby="topics-title"
                        className="w-full"
                        selectionMode="none"
                        onAction={(key) => {
                          router.push(`/explore?category=${key}`);
                        }}
                      >
                        {categories.map((category) => {
                          const count = category.count ?? 0;

                          return (
                            <ListBox.Item
                              key={category.id}
                              id={category.id}
                              className="items-center px-3 py-2.5"
                              textValue={`${category.name}, ${count} essays`}
                            >
                              <Label className="min-w-0 flex-1 truncate text-sm">
                                {category.name}
                              </Label>
                              <Chip
                                className="ms-auto shrink-0 tabular-nums"
                                size="sm"
                                variant="soft"
                              >
                                {count}
                              </Chip>
                            </ListBox.Item>
                          );
                        })}
                      </ListBox>
                    </div>
                  </ScrollShadow>
                </motion.div>
                {topicsOverflow ? (
                  <Button
                    fullWidth
                    variant="tertiary"
                    onPress={() => setTopicsExpanded((open) => !open)}
                  >
                    {topicsExpanded ? "Show less" : "Show all"}
                  </Button>
                ) : null}
              </Surface>
            ) : null}

            {collections.length > 0 ? (
              <section aria-labelledby="columns-title" className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between gap-4">
                  <Typography id="columns-title" type="h3" weight="semibold">
                    Columns
                  </Typography>
                  <Link className="text-sm no-underline" href="/columns">
                    All
                    <Link.Icon />
                  </Link>
                </div>
                <div className="grid gap-3">
                  {collections.map((collection) => (
                    <Card key={collection.slug ?? collection.id} variant="secondary">
                      <Card.Header>
                        <Card.Title className="flex items-baseline justify-between gap-3 text-base">
                          <Link
                            className="text-foreground truncate no-underline"
                            href={collection.href}
                          >
                            {collection.name || "Untitled column"}
                          </Link>
                          <span className="text-muted shrink-0 text-sm tabular-nums">
                            {collection.postsCount ?? 0}
                          </span>
                        </Card.Title>
                        {collection.description ? (
                          <Card.Description className="line-clamp-2">
                            {collection.description}
                          </Card.Description>
                        ) : null}
                      </Card.Header>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
