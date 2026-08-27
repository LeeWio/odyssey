"use client";

import { ArrowRotateLeft, BookOpen, Eye } from "@gravity-ui/icons";
import { EmptyState, ListView } from "@heroui-pro/react";
import { Carousel } from "@heroui-pro/react/carousel";
import { useMediaQuery } from "@mantine/hooks";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  Label,
  Link,
  ListBox,
  Pagination,
  SearchField,
  Select,
  Skeleton,
  Tabs,
  Typography,
} from "@heroui/react";
import type { Key } from "react";
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";

import { useGetFeaturedPostsQuery } from "@/features/blog/api/blog-api";
import { useGetPublicColumnsQuery } from "@/lib/features/column";
import {
  useRetrieveArchiveQuery,
  useRetrieveDiscoveryQuery,
  useRetrieveFacetsQuery,
  useRetrievePublicSeriesQuery,
  useSearchPostDigestsQuery,
} from "@/lib/features/openapi";
import type { OpenApiComponents } from "@/lib/features/openapi/openapi.generated";

import { ArchiveTimeline, ArchiveTimelineSkeleton } from "./archive-timeline";

const PAGE_SIZE = 6;

type DiscoveryGroup = OpenApiComponents["schemas"]["CategoryGroup"];
type PostDigest = {
  id?: number;
  title?: string | null;
  slug?: string | null;
  coverImage?: string | null;
  summary?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  category?: { id?: number; name?: string | null } | null;
  views?: number;
  likesCount?: number;
  publishedAt?: string | null;
};
type Collection = {
  id?: number;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  coverImage?: string | null;
  postsCount?: number;
  createdAt?: string;
  href: string;
  sourceLabel: "Column" | "Series";
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

function getDisplayAuthor(value?: string | null) {
  const author = value?.trim();
  if (!author || /^(anonymous|john doe|jane doe)$/i.test(author)) return "Odyssey";
  return author;
}

function getInitials(value?: string | null) {
  return getDisplayAuthor(value)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getPageNumbers(page: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const current = page + 1;
  const values: Array<number | "ellipsis-start" | "ellipsis-end"> = [1];

  if (current > 3) values.push("ellipsis-start");
  for (
    let value = Math.max(2, current - 1);
    value <= Math.min(totalPages - 1, current + 1);
    value += 1
  ) {
    values.push(value);
  }
  if (current < totalPages - 2) values.push("ellipsis-end");
  values.push(totalPages);

  return values;
}

function SectionHeading({
  description,
  id,
  title,
}: {
  description: string;
  id: string;
  title: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <Typography id={id} type="h2" weight="semibold">
        {title}
      </Typography>
      <Typography color="muted" type="body-sm">
        {description}
      </Typography>
    </div>
  );
}

function PostCard({ post }: { post: PostDigest }) {
  const title = post.title || "Untitled story";

  return (
    <Link
      className="group block h-full no-underline"
      href={post.slug ? `/single/${post.slug}` : "/single"}
    >
      <Card
        role="article"
        variant="secondary"
        className="group-hover:bg-surface-tertiary h-full overflow-hidden p-0"
      >
        {post.coverImage ? (
          <div className="bg-surface-tertiary relative aspect-[16/9] overflow-hidden">
            {/* The HeroUI Card media slot accepts regular responsive media. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              src={post.coverImage}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 border border-black/5 dark:border-white/10"
            />
          </div>
        ) : (
          <div className="bg-surface-tertiary text-muted flex aspect-[16/9] items-center justify-center">
            <BookOpen aria-hidden="true" className="size-7" />
          </div>
        )}

        <Card.Header className="gap-3">
          {post.category?.name ? (
            <Chip className="self-start" size="sm" variant="soft">
              {post.category.name}
            </Chip>
          ) : null}
          <Card.Title className="line-clamp-2 text-xl leading-snug">{title}</Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-3 leading-6">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>

        <Card.Footer className="mt-auto flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar size="sm" variant="soft">
              {post.authorAvatar ? (
                <Avatar.Image alt={getDisplayAuthor(post.authorName)} src={post.authorAvatar} />
              ) : null}
              <Avatar.Fallback>{getInitials(post.authorName)}</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0">
              <Typography truncate type="body-xs" weight="medium">
                {getDisplayAuthor(post.authorName)}
              </Typography>
              <Typography color="muted" type="body-xs">
                {formatDate(post.publishedAt)}
              </Typography>
            </div>
          </div>
          <Typography
            className="flex shrink-0 items-center gap-1.5 tabular-nums"
            color="muted"
            type="body-xs"
          >
            <Eye aria-hidden="true" className="size-3.5" />
            {(post.views ?? 0).toLocaleString("en-US")}
          </Typography>
        </Card.Footer>
      </Card>
    </Link>
  );
}

function PostGrid({ posts }: { posts: PostDigest[] }) {
  if (posts.length === 0) {
    return (
      <EmptyState size="lg">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <BookOpen aria-hidden="true" />
          </EmptyState.Media>
          <EmptyState.Title>No stories in this view</EmptyState.Title>
          <EmptyState.Description>
            Published stories will appear here as the collection grows.
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => (
        <PostCard key={post.id ?? `${post.slug}-${index}`} post={post} />
      ))}
    </div>
  );
}

function PostGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading stories"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
    >
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} variant="secondary" className="overflow-hidden p-0">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <Card.Header className="gap-3">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-6 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3 rounded-lg" />
          </Card.Header>
          <Card.Footer className="gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-lg" />
          </Card.Footer>
        </Card>
      ))}
    </div>
  );
}

function StoryList({
  label,
  posts,
  startAt = 1,
}: {
  label: string;
  posts: PostDigest[];
  startAt?: number;
}) {
  return (
    <ListView aria-label={label} variant="secondary">
      {posts.map((post, index) => (
        <ListView.Item
          key={post.id ?? `${post.slug}-${index}`}
          href={post.slug ? `/single/${post.slug}` : "/single"}
          id={post.id ?? `${post.slug}-${index}`}
          textValue={post.title || "Untitled story"}
        >
          <ListView.ItemContent className="items-center gap-3">
            {post.coverImage ? (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  src={post.coverImage}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 border border-black/5 dark:border-white/10"
                />
              </div>
            ) : (
              <div className="bg-surface-secondary text-muted flex size-14 shrink-0 items-center justify-center rounded-xl text-xs tabular-nums">
                {String(index + startAt).padStart(2, "0")}
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <ListView.Title className="line-clamp-2 text-sm leading-5 whitespace-normal">
                {post.title || "Untitled story"}
              </ListView.Title>
              <ListView.Description>
                {post.category?.name || "Journal"} · {formatDate(post.publishedAt)}
              </ListView.Description>
            </div>
          </ListView.ItemContent>
          <ListView.ItemAction>
            <Typography
              className="flex items-center gap-1 tabular-nums"
              color="muted"
              type="body-xs"
            >
              <Eye aria-hidden="true" className="size-3.5" />
              {(post.views ?? 0).toLocaleString("en-US")}
            </Typography>
          </ListView.ItemAction>
        </ListView.Item>
      ))}
    </ListView>
  );
}

function LeadStoryCard({ post }: { post: PostDigest }) {
  return (
    <Card variant="tertiary" className="h-full overflow-hidden p-0">
      {post.coverImage ? (
        <div className="relative aspect-[16/9] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="h-full w-full object-cover" loading="lazy" src={post.coverImage} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 border border-black/5 dark:border-white/10"
          />
        </div>
      ) : null}
      <Card.Header className="gap-3 p-6 sm:p-8">
        {post.category?.name ? (
          <Chip className="self-start" color="accent" size="sm" variant="soft">
            {post.category.name}
          </Chip>
        ) : null}
        <Card.Title className="text-2xl leading-tight sm:text-3xl">
          {post.title || "Untitled story"}
        </Card.Title>
        {post.summary ? (
          <Card.Description className="line-clamp-3 max-w-2xl leading-6">
            {post.summary}
          </Card.Description>
        ) : null}
      </Card.Header>
      <Card.Footer className="mt-auto flex items-center justify-between gap-4 px-6 pb-6 sm:px-8 sm:pb-8">
        <Typography color="muted" type="body-xs">
          {getDisplayAuthor(post.authorName)} · {formatDate(post.publishedAt)}
        </Typography>
        <Link
          className="shrink-0 no-underline"
          href={post.slug ? `/single/${post.slug}` : "/single"}
        >
          Read
          <Link.Icon />
        </Link>
      </Card.Footer>
    </Card>
  );
}

function EditorialFeed({ label, posts }: { label: string; posts: PostDigest[] }) {
  if (posts.length === 0) return <PostGrid posts={posts} />;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <LeadStoryCard post={posts[0]} />
      <StoryList label={`${label} supporting stories`} posts={posts.slice(1, 5)} startAt={2} />
    </div>
  );
}

function SpotlightSkeleton() {
  return (
    <Card aria-label="Loading featured story" variant="tertiary" className="overflow-hidden p-0">
      <Skeleton className="min-h-96 w-full rounded-none" />
    </Card>
  );
}

function SpotlightCard({ post }: { post: PostDigest }) {
  return (
    <Card variant="tertiary" className="h-full overflow-hidden p-0">
      {post.coverImage ? (
        <div className="bg-surface-secondary relative aspect-[16/9] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="h-full w-full object-cover" src={post.coverImage} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 border border-black/5 dark:border-white/10"
          />
        </div>
      ) : null}

      <Card.Header className="gap-4 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <Chip color="accent" size="sm" variant="soft">
            Editor&apos;s Selection
          </Chip>
          {post.category?.name ? (
            <Chip size="sm" variant="soft">
              {post.category.name}
            </Chip>
          ) : null}
        </div>
        <Card.Title className="text-2xl leading-tight sm:text-3xl">
          {post.title || "A story worth returning to"}
        </Card.Title>
        {post.summary ? (
          <Card.Description className="line-clamp-3 leading-6">{post.summary}</Card.Description>
        ) : null}
      </Card.Header>

      <Card.Footer className="mt-auto flex items-center justify-between gap-4 px-6 pb-6 sm:px-8 sm:pb-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar size="sm" variant="soft">
            {post.authorAvatar ? (
              <Avatar.Image alt={getDisplayAuthor(post.authorName)} src={post.authorAvatar} />
            ) : null}
            <Avatar.Fallback>{getInitials(post.authorName)}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <Typography truncate type="body-xs" weight="medium">
              {getDisplayAuthor(post.authorName)}
            </Typography>
            <Typography color="muted" type="body-xs">
              {formatDate(post.publishedAt)}
            </Typography>
          </div>
        </div>
        <Link
          className="shrink-0 font-medium no-underline"
          href={post.slug ? `/single/${post.slug}` : "/single"}
        >
          Read
          <Link.Icon />
        </Link>
      </Card.Footer>
    </Card>
  );
}

function TopicGroups({ groups }: { groups: DiscoveryGroup[] }) {
  const visibleGroups = groups.filter((group) => group.category?.name).slice(0, 3);
  if (visibleGroups.length === 0) return null;

  return (
    <section aria-labelledby="topic-paths-title" className="flex flex-col gap-6">
      <SectionHeading
        description="Editorial paths assembled from category depth, freshness, and reader interest."
        id="topic-paths-title"
        title="Topic Paths"
      />
      <div className="grid gap-5 md:grid-cols-3">
        {visibleGroups.map((group, index) => {
          const leadPost = group.heroPost ?? group.posts?.[0];

          return (
            <Card key={group.category?.id ?? index} variant="secondary" className="h-full">
              <Card.Header className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Chip size="sm" variant="soft">
                    {group.category?.name}
                  </Chip>
                  <Typography className="tabular-nums" color="muted" type="body-xs">
                    {group.totalPublishedCount ?? group.posts?.length ?? 0} stories
                  </Typography>
                </div>
                <Card.Title className="line-clamp-2 text-lg">
                  {leadPost?.title || `Explore ${group.category?.name}`}
                </Card.Title>
                {leadPost?.summary ? (
                  <Card.Description className="line-clamp-2">{leadPost.summary}</Card.Description>
                ) : null}
              </Card.Header>
              <Card.Footer className="mt-auto">
                <Link
                  className="no-underline"
                  href={leadPost?.slug ? `/single/${leadPost.slug}` : "/explore"}
                >
                  Open path
                  <Link.Icon />
                </Link>
              </Card.Footer>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link className="block h-full no-underline" href={collection.href}>
      <Card variant="secondary" className="h-full min-h-56">
        <Card.Header className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <Chip size="sm" variant="soft">
              {collection.sourceLabel}
            </Chip>
            <Typography className="tabular-nums" color="muted" type="body-xs">
              {collection.postsCount ?? 0} stories
            </Typography>
          </div>
          <Card.Title>{collection.name || "Untitled collection"}</Card.Title>
          {collection.description ? (
            <Card.Description className="line-clamp-3">{collection.description}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="mt-auto">
          <Typography color="muted" type="body-xs">
            Curated reading path
          </Typography>
        </Card.Footer>
      </Card>
    </Link>
  );
}

function CollectionsSection({
  collections,
  isLoading,
}: {
  collections: Collection[];
  isLoading: boolean;
}) {
  if (!isLoading && collections.length === 0) return null;

  return (
    <section aria-labelledby="collections-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          description="Follow a subject in sequence through editorial columns and long-form series."
          id="collections-title"
          title="Collections"
        />
        <Link className="shrink-0 no-underline" href="/columns">
          Browse all
          <Link.Icon />
        </Link>
      </div>

      {isLoading ? (
        <PostGridSkeleton />
      ) : collections.length > 0 ? (
        <Carousel opts={{ align: "start", loop: collections.length > 4 }} className="w-full">
          <Carousel.Content>
            {collections.map((collection, index) => (
              <Carousel.Item
                key={`${collection.sourceLabel}-${collection.id ?? collection.slug ?? index}`}
                className="basis-full p-1.5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <CollectionCard collection={collection} />
              </Carousel.Item>
            ))}
          </Carousel.Content>
          {collections.length > 4 ? <Carousel.Previous aria-label="Previous collections" /> : null}
          {collections.length > 4 ? <Carousel.Next aria-label="Next collections" /> : null}
          {collections.length > 4 ? <Carousel.Dots className="mt-5" /> : null}
        </Carousel>
      ) : (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <BookOpen aria-hidden="true" />
            </EmptyState.Media>
            <EmptyState.Title>No published collections yet</EmptyState.Title>
            <EmptyState.Description>
              Columns and series will appear here as soon as they are published.
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Link href="/columns">
              Visit collections
              <Link.Icon />
            </Link>
          </EmptyState.Content>
        </EmptyState>
      )}
    </section>
  );
}

export default function SingleIndexPage() {
  const [searchValue, setSearchValue] = useState("");
  const [keyword] = useDebounce(searchValue.trim(), 350);
  const [categoryKey, setCategoryKey] = useState("all");
  const [contentTypeKey, setContentTypeKey] = useState("all");
  const [page, setPage] = useState(0);
  const isArchiveTablet = useMediaQuery("(max-width: 1023px)");
  const isArchiveMobile = useMediaQuery("(max-width: 639px)");

  const discoveryQuery = useRetrieveDiscoveryQuery();
  const facetsQuery = useRetrieveFacetsQuery();
  const featuredQuery = useGetFeaturedPostsQuery({ page: 0, size: 6 });
  const columnsQuery = useGetPublicColumnsQuery();
  const seriesQuery = useRetrievePublicSeriesQuery();

  const categoryId = categoryKey === "all" ? undefined : Number(categoryKey);
  const contentType =
    contentTypeKey === "JSON" || contentTypeKey === "MDX" ? contentTypeKey : undefined;
  const archivePageSize = isArchiveMobile ? 4 : isArchiveTablet ? 6 : 8;

  const searchQuery = useSearchPostDigestsQuery({
    categoryId,
    contentType,
    keyword: keyword || undefined,
    pageable: { page, size: PAGE_SIZE, sort: ["publishedAt,desc"] },
  });
  const archiveQuery = useRetrieveArchiveQuery({
    pageable: { page: 0, size: archivePageSize, sort: ["publishedAt,desc"] },
  });

  const discovery = discoveryQuery.data;
  const spotlight = discovery?.spotlight ?? featuredQuery.data?.list[0];
  const featuredPosts = featuredQuery.data?.list ?? [];
  const categories = (facetsQuery.data?.categories ?? []).filter(
    (category) => category.id != null && category.name && (category.count ?? 0) > 0
  );
  const contentTypes = (facetsQuery.data?.contentTypes ?? []).filter(
    (item) => item.contentType && (item.count ?? 0) > 0
  );
  const searchPosts = searchQuery.data?.list ?? [];
  const totalPages = searchQuery.data?.totalPages ?? 0;
  const totalResults = searchQuery.data?.total ?? 0;
  const resultStart = totalResults > 0 ? page * PAGE_SIZE + 1 : 0;
  const resultEnd = Math.min((page + 1) * PAGE_SIZE, totalResults);

  const collections = useMemo(() => {
    const values = new Map<string, Collection>();

    for (const column of columnsQuery.data ?? []) {
      values.set(`column-${column.slug}`, {
        ...column,
        href: `/columns/${column.slug}`,
        sourceLabel: "Column",
      });
    }

    const fallbackSeries = seriesQuery.data?.length ? seriesQuery.data : (discovery?.series ?? []);
    for (const series of fallbackSeries) {
      if (!values.has(`column-${series.slug}`)) {
        values.set(`series-${series.slug ?? series.id}`, {
          ...series,
          href: "/columns",
          sourceLabel: "Series",
        });
      }
    }

    return Array.from(values.values());
  }, [columnsQuery.data, discovery?.series, seriesQuery.data]);

  const handleSelect = (value: Key | Key[] | null, setter: (key: string) => void) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setter(nextValue == null ? "all" : String(nextValue));
    setPage(0);
  };

  const retryDiscovery = () => {
    void discoveryQuery.refetch();
    void featuredQuery.refetch();
    void facetsQuery.refetch();
  };

  return (
    <div className="bg-background min-h-[100dvh] px-4 pt-24 pb-24 sm:px-6 sm:pt-28 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-20">
        <section
          aria-label="Journal introduction and featured story"
          className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12"
        >
          <header className="flex flex-col items-start gap-5 lg:col-span-5">
            <Chip color="accent" size="sm" variant="soft">
              Independent Journal
            </Chip>
            <Typography
              className="text-5xl leading-[0.98] sm:text-6xl lg:text-7xl"
              type="h1"
              weight="bold"
            >
              Ideas that stay useful.
            </Typography>
            <Typography className="max-w-xl text-base leading-7" color="muted">
              Essays on software, design, systems, and the questions that continue to matter after
              the feed moves on.
            </Typography>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Typography className="tabular-nums" color="muted" type="body-xs">
                {(facetsQuery.data?.totalPublishedCount ?? totalResults).toLocaleString("en-US")}{" "}
                essays · {categories.length} topics
              </Typography>
              <Link className="font-medium no-underline" href="#archive-title">
                Browse the index
                <Link.Icon />
              </Link>
            </div>
          </header>

          <div className="min-w-0 lg:col-span-7">
            {discoveryQuery.isError && featuredQuery.isError ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Discovery is temporarily unavailable</Alert.Title>
                  <Alert.Description>
                    Editorial recommendations could not be loaded. The searchable archive remains
                    available below.
                  </Alert.Description>
                </Alert.Content>
                <Button variant="outline" onPress={retryDiscovery}>
                  <ArrowRotateLeft aria-hidden="true" />
                  Try again
                </Button>
              </Alert>
            ) : discoveryQuery.isLoading && featuredQuery.isLoading ? (
              <SpotlightSkeleton />
            ) : spotlight ? (
              <SpotlightCard post={spotlight} />
            ) : (
              <EmptyState>
                <EmptyState.Header>
                  <EmptyState.Title>No featured story yet</EmptyState.Title>
                  <EmptyState.Description>
                    The next editorial selection will appear here.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            )}
          </div>
        </section>

        <section aria-labelledby="discover-title" className="flex flex-col gap-6">
          <SectionHeading
            description="Switch between editorial selection, current momentum, new work, and long-term reader interest."
            id="discover-title"
            title="Discover"
          />

          {discoveryQuery.isLoading && featuredQuery.isLoading ? (
            <PostGridSkeleton />
          ) : (
            <Tabs defaultSelectedKey="curated">
              <Tabs.ListContainer>
                <Tabs.List aria-label="Discovery views">
                  {[
                    ["curated", "Curated"],
                    ["trending", "Trending"],
                    ["latest", "Latest"],
                    ["most-read", "Most Read"],
                    ["featured", "Featured"],
                  ].map(([id, label]) => (
                    <Tabs.Tab key={id} id={id}>
                      {label}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.ListContainer>
              <Tabs.Panel className="pt-6" id="curated">
                <EditorialFeed label="Curated" posts={discovery?.curated ?? []} />
              </Tabs.Panel>
              <Tabs.Panel className="pt-6" id="trending">
                <EditorialFeed label="Trending" posts={discovery?.trending ?? []} />
              </Tabs.Panel>
              <Tabs.Panel className="pt-6" id="latest">
                <EditorialFeed label="Latest" posts={discovery?.latest ?? []} />
              </Tabs.Panel>
              <Tabs.Panel className="pt-6" id="most-read">
                <EditorialFeed label="Most read" posts={discovery?.mostRead ?? []} />
              </Tabs.Panel>
              <Tabs.Panel className="pt-6" id="featured">
                <EditorialFeed label="Featured" posts={featuredPosts} />
              </Tabs.Panel>
            </Tabs>
          )}
        </section>

        <TopicGroups groups={discovery?.categoryGroups ?? []} />

        <CollectionsSection
          collections={collections}
          isLoading={columnsQuery.isLoading || seriesQuery.isLoading}
        />

        <section aria-labelledby="archive-title" className="flex flex-col gap-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              description="Search compact article data and narrow it by topic or publishing format."
              id="archive-title"
              title="Browse the Archive"
            />
            <Typography className="tabular-nums" color="muted" type="body-sm">
              {(facetsQuery.data?.totalPublishedCount ?? totalResults).toLocaleString("en-US")}{" "}
              published
            </Typography>
          </div>

          <Card variant="secondary">
            <Card.Content className="grid gap-4 p-0 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
              <SearchField
                fullWidth
                aria-label="Search published stories"
                name="story-search"
                value={searchValue}
                variant="secondary"
                onChange={(value) => {
                  setSearchValue(value);
                  setPage(0);
                }}
              >
                <Label className="sr-only">Search published stories</Label>
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Search titles and summaries" />
                  <SearchField.ClearButton aria-label="Clear search" />
                </SearchField.Group>
              </SearchField>

              <Select
                fullWidth
                placeholder="All topics"
                value={categoryKey}
                variant="secondary"
                onChange={(value) => handleSelect(value, setCategoryKey)}
              >
                <Label className="sr-only">Filter by topic</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="All topics">
                      All topics
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {categories.map((category) => (
                      <ListBox.Item
                        key={category.id}
                        id={String(category.id)}
                        textValue={category.name || "Topic"}
                      >
                        {category.name}
                        <Typography className="ms-auto tabular-nums" color="muted" type="body-xs">
                          {category.count ?? 0}
                        </Typography>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                fullWidth
                placeholder="All formats"
                value={contentTypeKey}
                variant="secondary"
                onChange={(value) => handleSelect(value, setContentTypeKey)}
              >
                <Label className="sr-only">Filter by format</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="All formats">
                      All formats
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {contentTypes.map((item) => (
                      <ListBox.Item
                        key={item.contentType}
                        id={item.contentType}
                        textValue={item.contentType || "Format"}
                      >
                        {item.contentType}
                        <Typography className="ms-auto tabular-nums" color="muted" type="body-xs">
                          {item.count ?? 0}
                        </Typography>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </Card.Content>
          </Card>

          <div aria-live="polite">
            {searchQuery.isLoading ? (
              <PostGridSkeleton />
            ) : searchQuery.isError ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>The archive could not be loaded</Alert.Title>
                  <Alert.Description>Try the request again in a moment.</Alert.Description>
                </Alert.Content>
                <Button variant="outline" onPress={() => void searchQuery.refetch()}>
                  <ArrowRotateLeft aria-hidden="true" />
                  Try again
                </Button>
              </Alert>
            ) : searchPosts.length > 0 ? (
              <PostGrid posts={searchPosts} />
            ) : (
              <EmptyState size="lg">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <BookOpen aria-hidden="true" />
                  </EmptyState.Media>
                  <EmptyState.Title>No matching stories</EmptyState.Title>
                  <EmptyState.Description>
                    Try a broader phrase or return one of the filters to its default value.
                  </EmptyState.Description>
                </EmptyState.Header>
                <EmptyState.Content>
                  <Button
                    variant="outline"
                    onPress={() => {
                      setSearchValue("");
                      setCategoryKey("all");
                      setContentTypeKey("all");
                      setPage(0);
                    }}
                  >
                    Clear filters
                  </Button>
                </EmptyState.Content>
              </EmptyState>
            )}
          </div>

          {!searchQuery.isLoading && !searchQuery.isError && totalPages > 1 ? (
            <Pagination
              className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              size="sm"
            >
              <Pagination.Summary>
                Showing {resultStart}-{resultEnd} of {totalResults}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous isDisabled={page === 0} onPress={() => setPage(page - 1)}>
                    <Pagination.PreviousIcon />
                    <span>Previous</span>
                  </Pagination.Previous>
                </Pagination.Item>
                {getPageNumbers(page, totalPages).map((value) =>
                  typeof value === "number" ? (
                    <Pagination.Item key={value}>
                      <Pagination.Link
                        isActive={value === page + 1}
                        onPress={() => setPage(value - 1)}
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
                    onPress={() => setPage(page + 1)}
                  >
                    <span>Next</span>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          ) : null}
        </section>

        <section aria-labelledby="time-capsule-title" className="flex flex-col gap-10">
          <header className="flex max-w-2xl flex-col gap-5 py-2 sm:py-4">
            <div className="flex items-center gap-3">
              <div aria-hidden="true" className="bg-separator h-px w-8" />
              <Typography color="muted" type="body-xs" weight="medium">
                Archive
              </Typography>
            </div>
            <div className="flex flex-col gap-3">
              <Typography
                id="time-capsule-title"
                className="text-5xl leading-none tracking-tight sm:text-6xl"
                type="h2"
                weight="semibold"
              >
                <span className="text-muted">Then</span> &amp; Now
              </Typography>
              <Typography className="max-w-md text-base leading-7" color="muted">
                Scroll back through time, one story at a time.
              </Typography>
            </div>
          </header>

          <div className="min-w-0">
            {archiveQuery.isLoading ? (
              <ArchiveTimelineSkeleton count={archivePageSize} />
            ) : archiveQuery.isError ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>The time capsule is unavailable</Alert.Title>
                  <Alert.Description>Archived stories could not be loaded.</Alert.Description>
                </Alert.Content>
                <Button variant="outline" onPress={() => void archiveQuery.refetch()}>
                  <ArrowRotateLeft aria-hidden="true" />
                  Try again
                </Button>
              </Alert>
            ) : (archiveQuery.data?.list ?? []).length > 0 ? (
              <ArchiveTimeline posts={archiveQuery.data?.list ?? []} />
            ) : (
              <ArchiveTimeline posts={[]} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
