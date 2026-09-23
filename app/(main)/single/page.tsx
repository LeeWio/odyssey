"use client";

import { Icon } from "@iconify/react";

import { EmptyState, ListView } from "@heroui-pro/react";
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
  ProgressBar,
  SearchField,
  Select,
  Skeleton,
  Tag,
  TagGroup,
  Tabs,
  Typography,
} from "@heroui/react";
import type { Key } from "react";
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";

import { selectIsAuthenticated } from "@/lib/features/auth";
import { useGetFeaturedPostsQuery } from "@/lib/features/post";
import { useGetPublicColumnsQuery } from "@/lib/features/column";
import { type ReadingHistoryResponse, useGetLibraryOverviewQuery } from "@/lib/features/library";
import {
  useRetrieveDiscoveryQuery,
  useRetrieveFacetsQuery,
  useRetrievePublicSeriesQuery,
  useSearchPostDigestsQuery,
} from "@/lib/features/openapi";
import type { OpenApiComponents } from "@/lib/features/openapi/openapi.generated";
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";

const PAGE_SIZE = 6;

type CategoryFacet = OpenApiComponents["schemas"]["CategoryFacet"];
type TagFacet = OpenApiComponents["schemas"]["TagFacet"];
type PostDigest = {
  id?: number;
  title?: string | null;
  slug?: string | null;
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

function StoryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card aria-busy="true" aria-label="Loading stories" variant="secondary" role="status">
      {Array.from({ length: count }, (_, index) => (
        <Card.Content key={index} className="flex items-center gap-4 py-3">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-3 w-2/5 rounded-md" />
          </div>
        </Card.Content>
      ))}
    </Card>
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
            <div className="bg-surface-secondary text-muted flex size-14 shrink-0 items-center justify-center rounded-xl text-xs tabular-nums">
              {String(index + startAt).padStart(2, "0")}
            </div>
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
              <Icon icon="gravity-ui:eye" aria-hidden="true" className="size-3.5" />
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
    <Card variant="tertiary" className="h-full min-h-80">
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
  if (posts.length === 0) {
    return (
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Title>No stories in this view</EmptyState.Title>
          <EmptyState.Description>Published stories will appear here.</EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <LeadStoryCard post={posts[0]} />
      <StoryList label={`${label} supporting stories`} posts={posts.slice(1, 5)} startAt={2} />
    </div>
  );
}

function ContinueReadingSection({ entries }: { entries: ReadingHistoryResponse[] }) {
  const formatRelativeTime = useRelativeTime();
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="continue-reading-title" className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          description="Return to the exact place you stopped."
          id="continue-reading-title"
          title="Continue Reading"
        />
        <Link className="hidden shrink-0 no-underline sm:inline-flex" href="/library">
          Open library
          <Link.Icon />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {entries.slice(0, 3).map(({ lastReadAt, post, positionAnchor, progressPercent }) => (
          <Card key={post.id} variant="secondary" className="h-full gap-4">
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

function SpotlightSkeleton() {
  return (
    <Card aria-label="Loading featured story" variant="tertiary" className="overflow-hidden p-0">
      <Skeleton className="min-h-96 w-full rounded-none" />
    </Card>
  );
}

function SpotlightCard({ post }: { post: PostDigest }) {
  return (
    <Card variant="tertiary" className="h-full min-h-96">
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

function ContentIndex({
  categories,
  collections,
  isLoading,
  tags,
}: {
  categories: CategoryFacet[];
  collections: Collection[];
  isLoading: boolean;
  tags: TagFacet[];
}) {
  const visibleCategories = categories.slice(0, 6);
  const visibleTags = tags.slice(0, 8);

  return (
    <section
      aria-labelledby="content-index-title"
      className="border-separator flex flex-col gap-8 border-t pt-12 sm:pt-16"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          description="Browse subjects, recurring ideas, and sequential collections."
          id="content-index-title"
          title="Content Index"
        />
        <Link className="shrink-0 no-underline" href="/explore">
          Explore
          <Link.Icon />
        </Link>
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
        <div className="flex min-w-0 flex-col gap-7">
          {visibleCategories.length > 0 ? (
            <ListView aria-label="Categories" variant="secondary">
              {visibleCategories.map((category) => (
                <ListView.Item
                  key={category.id}
                  href={`/explore?category=${category.id}`}
                  id={`category-${category.id}`}
                  textValue={category.name || "Category"}
                >
                  <ListView.ItemContent>
                    <ListView.Title>{category.name}</ListView.Title>
                  </ListView.ItemContent>
                  <ListView.ItemAction>
                    <Typography className="tabular-nums" color="muted" type="body-xs">
                      {category.count ?? 0}
                    </Typography>
                  </ListView.ItemAction>
                </ListView.Item>
              ))}
            </ListView>
          ) : null}

          {visibleTags.length > 0 ? (
            <div className="min-w-0">
              <Typography className="mb-3" type="body-sm" weight="semibold">
                Tags
              </Typography>
              <TagGroup aria-label="Browse tags" selectionMode="none" size="sm" variant="surface">
                <TagGroup.List className="flex-wrap">
                  {visibleTags.map((tag) => (
                    <Tag
                      key={tag.id}
                      href={`/explore?tag=${tag.id}`}
                      id={`tag-${tag.id}`}
                      textValue={tag.name}
                    >
                      #{tag.name}
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Typography type="body-sm" weight="semibold">
              Columns &amp; Series
            </Typography>
            <Link className="no-underline" href="/columns">
              View all
              <Link.Icon />
            </Link>
          </div>
          {isLoading ? (
            <StoryListSkeleton count={3} />
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
                      {collection.postsCount ?? 0}
                    </Typography>
                  </ListView.ItemAction>
                </ListView.Item>
              ))}
            </ListView>
          ) : (
            <Card variant="secondary">
              <Card.Header className="gap-2">
                <Card.Title className="text-base">Browse long-form collections</Card.Title>
                <Card.Description>Follow columns and series in reading order.</Card.Description>
              </Card.Header>
              <Card.Footer>
                <Link className="no-underline" href="/columns">
                  Open collections
                  <Link.Icon />
                </Link>
              </Card.Footer>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

export default function SingleIndexPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [searchValue, setSearchValue] = useState("");
  const [keyword] = useDebounce(searchValue.trim(), 350);
  const [categoryKey, setCategoryKey] = useState("all");
  const [contentTypeKey, setContentTypeKey] = useState("all");
  const [page, setPage] = useState(0);

  const discoveryQuery = useRetrieveDiscoveryQuery();
  const facetsQuery = useRetrieveFacetsQuery();
  const featuredQuery = useGetFeaturedPostsQuery({ page: 0, size: 6 });
  const columnsQuery = useGetPublicColumnsQuery();
  const seriesQuery = useRetrievePublicSeriesQuery();
  const libraryQuery = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });

  const categoryId = categoryKey === "all" ? undefined : Number(categoryKey);
  const contentType =
    contentTypeKey === "JSON" || contentTypeKey === "MDX" ? contentTypeKey : undefined;

  const searchQuery = useSearchPostDigestsQuery({
    categoryId,
    contentType,
    keyword: keyword || undefined,
    pageable: { page, size: PAGE_SIZE, sort: ["publishedAt,desc"] },
  });
  const discovery = discoveryQuery.data;
  const spotlight = discovery?.spotlight ?? featuredQuery.data?.list[0];
  const categories = (facetsQuery.data?.categories ?? []).filter(
    (category) => category.id != null && category.name && (category.count ?? 0) > 0
  );
  const tags = (facetsQuery.data?.tags ?? []).filter(
    (tag) => tag.id != null && tag.name && (tag.count ?? 0) > 0
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 sm:gap-20">
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
                  <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" />
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

        <ContinueReadingSection entries={libraryQuery.data?.continueReading ?? []} />

        <section
          aria-labelledby="discover-title"
          className="border-separator flex flex-col gap-6 border-t pt-12 sm:pt-16"
        >
          <SectionHeading
            description="A focused selection from the editorial desk and the newest work in the archive."
            id="discover-title"
            title="Selected Reading"
          />

          {discoveryQuery.isLoading && featuredQuery.isLoading ? (
            <StoryListSkeleton />
          ) : (
            <Tabs defaultSelectedKey="curated">
              <Tabs.ListContainer>
                <Tabs.List aria-label="Discovery views">
                  {[
                    ["curated", "Curated"],
                    ["latest", "Latest"],
                    ["popular", "Popular"],
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
              <Tabs.Panel className="pt-6" id="latest">
                <EditorialFeed label="Latest" posts={discovery?.latest ?? []} />
              </Tabs.Panel>
              <Tabs.Panel className="pt-6" id="popular">
                <EditorialFeed
                  label="Popular"
                  posts={
                    (discovery?.trending ?? []).length
                      ? (discovery?.trending ?? [])
                      : (discovery?.mostRead ?? [])
                  }
                />
              </Tabs.Panel>
            </Tabs>
          )}
        </section>

        <ContentIndex
          categories={categories}
          collections={collections}
          isLoading={columnsQuery.isLoading || seriesQuery.isLoading}
          tags={tags}
        />

        <section
          aria-labelledby="archive-title"
          className="border-separator flex flex-col gap-7 border-t pt-12 sm:pt-16"
        >
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
              <StoryListSkeleton count={PAGE_SIZE} />
            ) : searchQuery.isError ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>The archive could not be loaded</Alert.Title>
                  <Alert.Description>Try the request again in a moment.</Alert.Description>
                </Alert.Content>
                <Button variant="outline" onPress={() => void searchQuery.refetch()}>
                  <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" />
                  Try again
                </Button>
              </Alert>
            ) : searchPosts.length > 0 ? (
              <StoryList
                label="Archive results"
                posts={searchPosts}
                startAt={page * PAGE_SIZE + 1}
              />
            ) : (
              <EmptyState size="lg">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <Icon icon="gravity-ui:book-open" aria-hidden="true" />
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
      </div>
    </div>
  );
}
