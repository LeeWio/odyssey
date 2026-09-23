"use client";

import { Icon } from "@iconify/react";
import { EmptyState, ListView } from "@heroui-pro/react";
import {
  Alert,
  Button,
  Card,
  Chip,
  Link,
  ProgressBar,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
} from "@heroui/react";
import { useMemo } from "react";

import { selectIsAuthenticated } from "@/lib/features/auth";
import { useGetPublicColumnsQuery } from "@/lib/features/column";
import { type ReadingHistoryResponse, useGetLibraryOverviewQuery } from "@/lib/features/library";
import {
  useRetrieveDiscoveryQuery,
  useRetrieveFacetsQuery,
  useRetrievePublicSeriesQuery,
} from "@/lib/features/openapi";
import type { OpenApiComponents } from "@/lib/features/openapi/openapi.generated";
import { useGetFeaturedPostsQuery } from "@/lib/features/post";
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";

type CategoryFacet = OpenApiComponents["schemas"]["CategoryFacet"];
type TagFacet = OpenApiComponents["schemas"]["TagFacet"];
type PostDigest = {
  id?: number;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  category?: { id?: number; name?: string | null } | null;
  views?: number;
  publishedAt?: string | null;
};
type Collection = {
  id?: number;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  postsCount?: number;
  href: string;
  sourceLabel: "Column" | "Series";
};

const displayFont = { fontFamily: "var(--font-display)" } as const;
const monoFont = { fontFamily: "var(--font-mono)" } as const;
const storyPlacements = [
  "xl:col-span-7 xl:translate-y-8 xl:rotate-[0.6deg]",
  "xl:col-span-5 xl:-rotate-[0.8deg]",
  "xl:col-span-6 xl:translate-x-6 xl:rotate-[0.5deg]",
  "xl:col-span-6 xl:translate-y-10 xl:-rotate-[0.6deg]",
  "xl:col-span-5 xl:translate-x-10 xl:rotate-[0.7deg]",
  "xl:col-span-7 xl:translate-y-5 xl:-rotate-[0.4deg]",
] as const;
const storySurfaces = [
  "bg-[#202a2e]",
  "bg-[#292b22]",
  "bg-[#30251f]",
  "bg-[#29242d]",
  "bg-[#20282b]",
  "bg-[#2b2925]",
] as const;
const categoryIcons = [
  "gravity-ui:compass",
  "gravity-ui:book-open",
  "gravity-ui:code",
  "gravity-ui:palette",
  "gravity-ui:globe",
  "gravity-ui:lightbulb",
] as const;

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

function postIdentity(post: PostDigest) {
  return post.id != null ? `id-${post.id}` : `slug-${post.slug ?? post.title}`;
}

function AtlasStoryCard({ index, post }: { index: number; post: PostDigest }) {
  const isLead = index === 0;
  return (
    <div className={`min-w-0 ${storyPlacements[index] ?? "xl:col-span-6"}`}>
      <Card
        className={`group h-full rounded-md transition-transform duration-200 active:scale-[0.99] ${storySurfaces[index] ?? "bg-surface-secondary"} ${isLead ? "min-h-80" : "min-h-64"}`}
        variant={index % 3 === 0 ? "tertiary" : "secondary"}
      >
        <Card.Header className="gap-5 p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <Chip color={isLead ? "accent" : "default"} size="sm" variant="soft">
              {post.category?.name || (isLead ? "Editor's Selection" : "Journal")}
            </Chip>
            <Typography className="shrink-0 tabular-nums" color="muted" type="body-xs">
              {(post.views ?? 0).toLocaleString("en-US")} reads
            </Typography>
          </div>
          <Card.Title
            className={isLead ? "text-3xl leading-[1.08] sm:text-4xl" : "text-2xl leading-tight"}
            style={displayFont}
          >
            {post.title || "Untitled story"}
          </Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-3 max-w-[54ch] text-sm leading-6">
              {post.summary}
            </Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="mt-auto flex items-end justify-between gap-5 px-6 pb-6 sm:px-7 sm:pb-7">
          <Typography className="tabular-nums" color="muted" type="body-xs">
            {formatDate(post.publishedAt)}
          </Typography>
          <Link
            className="shrink-0 font-medium no-underline"
            href={post.slug ? `/single/${post.slug}` : "/single"}
          >
            Read
            <Link.Icon />
          </Link>
        </Card.Footer>
      </Card>
    </div>
  );
}

function AtlasSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading the reading atlas"
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-12 xl:gap-7"
      role="status"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Card
          key={index}
          className={`min-h-64 rounded-md ${storyPlacements[index] ?? "xl:col-span-6"}`}
          variant={index % 2 === 0 ? "secondary" : "tertiary"}
        >
          <Card.Header className="gap-5 p-7">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-4/5 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </Card.Header>
        </Card>
      ))}
    </div>
  );
}

function TopicAtlas({ categories, tags }: { categories: CategoryFacet[]; tags: TagFacet[] }) {
  const visibleCategories = categories.slice(0, 6);
  const visibleTags = tags.slice(0, 10);
  return (
    <Card className="rounded-md bg-[#1c2428] lg:sticky lg:top-28" variant="secondary">
      <Card.Header className="items-center gap-3 px-6 pt-8 text-center sm:px-8">
        <div className="bg-surface-tertiary text-accent flex size-12 items-center justify-center rounded-full">
          <Icon aria-hidden="true" className="size-5" icon="gravity-ui:circles-4-shape" />
        </div>
        <Card.Title className="text-3xl" style={displayFont}>
          Topic Atlas
        </Card.Title>
        <Card.Description className="max-w-xs leading-6">
          Follow a broad subject, or drift through the ideas that connect them.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-8 px-6 py-8 sm:px-8">
        {visibleCategories.length > 0 ? (
          <TagGroup
            aria-label="Browse categories"
            className="w-full"
            selectionMode="none"
            size="lg"
            variant="surface"
          >
            <TagGroup.List className="flex flex-wrap justify-center gap-3">
              {visibleCategories.map((category) => (
                <Tag
                  key={category.id}
                  href={`/explore?category=${category.id}`}
                  id={`category-${category.id}`}
                  textValue={category.name || "Category"}
                >
                  {category.name}
                </Tag>
              ))}
            </TagGroup.List>
          </TagGroup>
        ) : null}
        <div
          aria-hidden="true"
          className="border-separator mx-auto size-28 rounded-full border p-5"
        >
          <div className="border-separator flex size-full items-center justify-center rounded-full border">
            <Icon className="text-muted size-7" icon="gravity-ui:route" />
          </div>
        </div>
        {visibleTags.length > 0 ? (
          <TagGroup
            aria-label="Browse tags"
            className="w-full"
            selectionMode="none"
            size="sm"
            variant="surface"
          >
            <TagGroup.List className="flex flex-wrap justify-center gap-2">
              {visibleTags.map((tag) => (
                <Tag
                  key={tag.id}
                  href={`/explore?tag=${tag.id}`}
                  id={`tag-${tag.id}`}
                  textValue={tag.name || "Tag"}
                >
                  #{tag.name}
                </Tag>
              ))}
            </TagGroup.List>
          </TagGroup>
        ) : null}
      </Card.Content>
      <Card.Footer className="justify-center px-6 pb-8 sm:px-8">
        <Link className="font-medium no-underline" href="/explore">
          Explore every topic
          <Link.Icon />
        </Link>
      </Card.Footer>
    </Card>
  );
}

function ContinueReadingSection({ entries }: { entries: ReadingHistoryResponse[] }) {
  const formatRelativeTime = useRelativeTime();
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby="continue-reading-title" className="grid gap-6 lg:grid-cols-12">
      <header className="flex flex-col items-start gap-3 lg:col-span-3">
        <Typography id="continue-reading-title" className="text-3xl" style={displayFont} type="h2">
          Continue Reading
        </Typography>
        <Typography color="muted" type="body-sm">
          Return to the exact place you stopped.
        </Typography>
        <Link className="mt-1 no-underline" href="/library">
          Open library
          <Link.Icon />
        </Link>
      </header>
      <div className="grid gap-4 md:grid-cols-3 lg:col-span-9">
        {entries.slice(0, 3).map(({ lastReadAt, post, positionAnchor, progressPercent }) => (
          <Card key={post.id} className="h-full rounded-md" variant="secondary">
            <Card.Header className="gap-3">
              <div className="flex items-center justify-between gap-3">
                <Chip size="sm" variant="soft">
                  {post.category?.name || "Journal"}
                </Chip>
                <Typography className="tabular-nums" color="muted" type="body-xs">
                  {progressPercent}%
                </Typography>
              </div>
              <Card.Title className="line-clamp-2 text-base leading-6">{post.title}</Card.Title>
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
            <Card.Footer className="mt-auto justify-between gap-3">
              <Typography className="line-clamp-1" color="muted" type="body-xs">
                Read {formatRelativeTime(lastReadAt)}
              </Typography>
              <Link
                aria-label={`Continue reading ${post.title}`}
                className="shrink-0 no-underline"
                href={getReadingPositionHref(post.slug, positionAnchor)}
              >
                Continue
                <Link.Icon />
              </Link>
            </Card.Footer>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CategoryMap({ categories }: { categories: CategoryFacet[] }) {
  return (
    <section aria-labelledby="category-map-title" className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <Typography
            id="category-map-title"
            className="text-3xl sm:text-4xl"
            style={displayFont}
            type="h2"
          >
            Choose a Direction
          </Typography>
          <Typography color="muted" type="body-sm">
            Enter through one of the journal&apos;s most active subjects.
          </Typography>
        </div>
        <Link className="shrink-0 no-underline" href="/explore">
          All categories
          <Link.Icon />
        </Link>
      </div>
      <Card className="rounded-md bg-[#191f22]" variant="secondary">
        <Card.Content className="grid gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {categories.slice(0, 6).map((category, index) => (
            <Link
              key={category.id}
              className="hover:bg-surface-tertiary flex min-h-32 flex-col items-start justify-between gap-5 rounded-sm p-5 no-underline"
              href={`/explore?category=${category.id}`}
            >
              <Icon
                aria-hidden="true"
                className="text-accent size-5"
                icon={categoryIcons[index] ?? "gravity-ui:compass"}
              />
              <span className="flex w-full items-end justify-between gap-3">
                <span className="line-clamp-2 font-medium">{category.name}</span>
                <span className="text-muted shrink-0 text-xs tabular-nums">
                  {category.count ?? 0}
                </span>
              </span>
            </Link>
          ))}
        </Card.Content>
      </Card>
    </section>
  );
}

function CollectionsAndRoutes({
  collections,
  isLoading,
}: {
  collections: Collection[];
  isLoading: boolean;
}) {
  return (
    <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Typography className="text-3xl" style={displayFont} type="h2">
              Columns and Series
            </Typography>
            <Typography color="muted" type="body-sm">
              Longer arguments, assembled in reading order.
            </Typography>
          </div>
          <Link className="hidden shrink-0 no-underline sm:inline-flex" href="/columns">
            View all
            <Link.Icon />
          </Link>
        </div>
        {isLoading ? (
          <Card aria-busy="true" aria-label="Loading collections" variant="secondary">
            {Array.from({ length: 4 }, (_, index) => (
              <Card.Content key={index} className="flex items-center gap-4 py-3">
                <Skeleton className="size-10 rounded-md" />
                <Skeleton className="h-4 flex-1 rounded-md" />
              </Card.Content>
            ))}
          </Card>
        ) : collections.length > 0 ? (
          <ListView aria-label="Columns and series" variant="secondary">
            {collections.slice(0, 5).map((collection, index) => (
              <ListView.Item
                key={`${collection.sourceLabel}-${collection.id ?? collection.slug ?? index}`}
                href={collection.href}
                id={`${collection.sourceLabel}-${collection.id ?? collection.slug ?? index}`}
                textValue={collection.name || "Untitled collection"}
              >
                <ListView.ItemContent>
                  <ListView.Title>{collection.name || "Untitled collection"}</ListView.Title>
                  <ListView.Description>{collection.sourceLabel}</ListView.Description>
                </ListView.ItemContent>
                <ListView.ItemAction>
                  <Typography className="tabular-nums" color="muted" type="body-xs">
                    {collection.postsCount ?? 0} stories
                  </Typography>
                </ListView.ItemAction>
              </ListView.Item>
            ))}
          </ListView>
        ) : (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>No published collections yet</EmptyState.Title>
              <EmptyState.Description>
                New columns and series will appear here.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        )}
      </div>
      <Card className="rounded-md bg-[#29242d]" variant="tertiary">
        <Card.Header className="gap-3 p-6 sm:p-7">
          <Card.Title className="text-2xl" style={displayFont}>
            Keep Exploring
          </Card.Title>
          <Card.Description>Three ways to move beyond this map.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-2 px-3 pb-3">
          {[
            ["gravity-ui:compass", "Explore", "/explore"],
            ["gravity-ui:layers-3", "Columns", "/columns"],
            ["gravity-ui:archive", "Archive", "/archive"],
          ].map(([icon, label, href]) => (
            <Link
              key={href}
              className="hover:bg-surface-secondary flex min-h-14 items-center gap-3 rounded-sm px-4 no-underline"
              href={href}
            >
              <Icon aria-hidden="true" className="text-muted size-4" icon={icon} />
              <span className="font-medium">{label}</span>
              <Link.Icon className="ms-auto" />
            </Link>
          ))}
        </Card.Content>
      </Card>
    </section>
  );
}

export default function SingleIndexPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const discoveryQuery = useRetrieveDiscoveryQuery();
  const facetsQuery = useRetrieveFacetsQuery();
  const featuredQuery = useGetFeaturedPostsQuery({ page: 0, size: 6 });
  const columnsQuery = useGetPublicColumnsQuery();
  const seriesQuery = useRetrievePublicSeriesQuery();
  const libraryQuery = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });
  const discovery = discoveryQuery.data;
  const categories = (facetsQuery.data?.categories ?? []).filter(
    (category) => category.id != null && category.name && (category.count ?? 0) > 0
  );
  const tags = (facetsQuery.data?.tags ?? []).filter(
    (tag) => tag.id != null && tag.name && (tag.count ?? 0) > 0
  );
  const atlasPosts = useMemo(() => {
    const candidates: Array<PostDigest | undefined> = [
      discovery?.spotlight,
      ...(discovery?.curated ?? []),
      ...(discovery?.latest ?? []),
      ...(discovery?.trending ?? []),
      ...(discovery?.mostRead ?? []),
      ...(featuredQuery.data?.list ?? []),
    ];
    const posts = candidates.filter((post): post is PostDigest => Boolean(post?.title));
    const uniquePosts = new Map<string, PostDigest>();
    for (const post of posts) {
      const key = postIdentity(post);
      if (!uniquePosts.has(key)) uniquePosts.set(key, post);
    }
    return Array.from(uniquePosts.values()).slice(0, 6);
  }, [discovery, featuredQuery.data?.list]);
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
  const retryDiscovery = () => {
    void discoveryQuery.refetch();
    void featuredQuery.refetch();
    void facetsQuery.refetch();
  };

  return (
    <div data-theme="mouve-dark" className="bg-background text-foreground min-h-[100dvh]">
      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-4 pt-24 pb-24 sm:px-6 sm:pt-28 lg:px-8 xl:gap-24">
        <section
          aria-labelledby="reading-atlas-title"
          className="grid gap-10 lg:grid-cols-12 xl:gap-12"
        >
          <div className="flex min-w-0 flex-col gap-8 lg:col-span-8 xl:gap-10">
            <header className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.55fr)]">
              <div className="flex max-w-3xl flex-col items-start gap-5">
                <Chip color="accent" size="sm" variant="soft">
                  Independent Journal
                </Chip>
                <Typography
                  id="reading-atlas-title"
                  className="text-5xl leading-[0.98] sm:text-6xl lg:text-7xl"
                  style={displayFont}
                  type="h1"
                >
                  Ideas move in more than one direction.
                </Typography>
              </div>
              <div className="flex flex-col items-start gap-4 pb-1">
                <Typography className="max-w-sm text-sm leading-6" color="muted">
                  Essays on software, design, systems, and the questions that stay useful after the
                  feed moves on.
                </Typography>
                <Typography className="tabular-nums" color="muted" style={monoFont} type="body-xs">
                  {(facetsQuery.data?.totalPublishedCount ?? 0).toLocaleString("en-US")} essays ·{" "}
                  {categories.length} topics
                </Typography>
              </div>
            </header>
            {discoveryQuery.isError && featuredQuery.isError ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Discovery is temporarily unavailable</Alert.Title>
                  <Alert.Description>
                    Editorial recommendations could not be loaded. Topic and collection navigation
                    remain available below.
                  </Alert.Description>
                </Alert.Content>
                <Button variant="outline" onPress={retryDiscovery}>
                  <Icon aria-hidden="true" icon="gravity-ui:arrow-rotate-left" />
                  Try again
                </Button>
              </Alert>
            ) : discoveryQuery.isLoading && featuredQuery.isLoading ? (
              <AtlasSkeleton />
            ) : atlasPosts.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12 xl:gap-x-7 xl:gap-y-12 xl:pb-10">
                {atlasPosts.map((post, index) => (
                  <AtlasStoryCard key={postIdentity(post)} index={index} post={post} />
                ))}
              </div>
            ) : (
              <EmptyState>
                <EmptyState.Header>
                  <EmptyState.Title>No stories on the map yet</EmptyState.Title>
                  <EmptyState.Description>
                    Published writing will appear here.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            )}
          </div>
          <aside className="min-w-0 lg:col-span-4">
            <TopicAtlas categories={categories} tags={tags} />
          </aside>
        </section>
        <ContinueReadingSection entries={libraryQuery.data?.continueReading ?? []} />
        {categories.length > 0 ? <CategoryMap categories={categories} /> : null}
        <CollectionsAndRoutes
          collections={collections}
          isLoading={columnsQuery.isLoading || seriesQuery.isLoading}
        />
      </main>
    </div>
  );
}
