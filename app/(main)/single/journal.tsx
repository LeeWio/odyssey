"use client";

import { Icon } from "@iconify/react";
import { EmptyState, NumberValue, Segment } from "@heroui-pro/react";
import {
  Alert,
  Button,
  Card,
  Description,
  Label,
  Link,
  ListBox,
  ProgressBar,
  ScrollShadow,
  Skeleton,
  Typography,
} from "@heroui/react";
import type { Key } from "react-aria-components/Breadcrumbs";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

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

function StoryMeta({ post }: { post: Story }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const meta = [post.category?.name, formatDate(storyDate(post), locale, t("recentlyPublished"))]
    .filter(Boolean)
    .join(" · ");
  if (!meta) return null;
  return <span className="text-muted text-sm">{meta}</span>;
}

function FeatureCard({ post, featured = false }: { post: Story; featured?: boolean }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const meta = [post.category?.name, formatDate(storyDate(post), locale, t("recentlyPublished"))]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="bg-surface-secondary overflow-hidden rounded-2xl">
      <Link className="group relative block overflow-hidden no-underline" href={storyHref(post)}>
        <Cover cover={post.coverImage?.trim()} ratio="aspect-[16/9]" />
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pt-12 pb-3.5">
          {meta ? <span className="text-xs text-white/75">{meta}</span> : null}
          <span
            className={`line-clamp-2 font-semibold tracking-tight text-white ${featured ? "text-lg leading-6" : "text-base leading-5"}`}
          >
            {post.title || t("untitledStory")}
          </span>
        </span>
      </Link>
    </article>
  );
}

function FeatureMosaic({ lead, companions }: { lead: Story; companions: Story[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <FeatureCard featured post={lead} />
      {companions.map((post) => (
        <FeatureCard key={post.id ?? post.slug} post={post} />
      ))}
    </div>
  );
}

function StoryTile({ post }: { post: Story }) {
  const t = useTranslations("Journal");

  return (
    <article className="bg-surface-secondary flex h-full flex-col overflow-hidden rounded-3xl">
      <Link className="group block overflow-hidden no-underline" href={storyHref(post)}>
        <Cover cover={post.coverImage?.trim()} ratio="aspect-[16/10]" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <StoryMeta post={post} />
        <Typography type="h3" weight="semibold">
          <Link className="text-foreground line-clamp-2 no-underline" href={storyHref(post)}>
            {post.title || t("untitledStory")}
          </Link>
        </Typography>
        {post.summary ? (
          <Typography className="line-clamp-2" color="muted" type="body-sm">
            {post.summary}
          </Typography>
        ) : null}
      </div>
    </article>
  );
}

function ColumnRail({ collections }: { collections: Collection[] }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  if (collections.length === 0) return null;

  return (
    <section
      aria-labelledby="columns-title"
      className="bg-surface-secondary flex flex-col gap-1 rounded-3xl p-5"
    >
      <div className="flex items-center justify-between px-2 pt-1 pb-3">
        <Typography id="columns-title" type="h3" weight="semibold">
          {t("columns")}
        </Typography>
        <Link className="text-sm no-underline" href="/columns">
          {t("all")}
          <Link.Icon />
        </Link>
      </div>
      {collections.map((collection) => (
        <Link
          key={collection.slug ?? collection.id}
          className="hover:bg-default/60 flex flex-col gap-1 rounded-2xl px-2 py-3 no-underline transition-colors duration-150"
          href={collection.href}
        >
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-foreground truncate text-sm font-medium">
              {collection.name || t("untitledColumn")}
            </span>
            <span className="text-muted shrink-0 text-xs tabular-nums">
              {(collection.postsCount ?? 0).toLocaleString(locale)}
            </span>
          </span>
          {collection.description ? (
            <span className="text-muted line-clamp-2 text-xs leading-5">
              {collection.description}
            </span>
          ) : null}
        </Link>
      ))}
    </section>
  );
}

function JournalMasthead({ essayCount }: { essayCount: number }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const today = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <Typography className="text-3xl tracking-tight sm:text-4xl" type="h1" weight="semibold">
          {t("title")}
        </Typography>
        <Typography color="muted">{t("description")}</Typography>
      </div>
      <div className="text-muted flex items-center gap-3 text-sm">
        <span>{today}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">
          {t("essays", { count: essayCount.toLocaleString(locale) })}
        </span>
      </div>
    </header>
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
        <Card.Title className="text-sm">{t("topics")}</Card.Title>
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
                <Description className="ms-auto shrink-0 tabular-nums">
                  {(category.count ?? 0).toLocaleString(locale)}
                </Description>
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {entries.slice(0, 4).map(({ lastReadAt, post, positionAnchor, progressPercent }) => (
          <div key={post.id} className="bg-surface-secondary flex flex-col gap-3 rounded-3xl p-5">
            <div className="flex items-baseline justify-between gap-4">
              <Link
                className="text-foreground min-w-0 truncate text-lg no-underline"
                href={getReadingPositionHref(post.slug, positionAnchor)}
              >
                {post.title}
              </Link>
              <Typography className="shrink-0 tabular-nums" color="muted" type="body-xs">
                {progressPercent}% · {formatRelativeTime(lastReadAt)}
              </Typography>
            </div>
            <ProgressBar
              aria-label={t("readingProgress", { title: post.title })}
              className="mt-3"
              color="accent"
              size="sm"
              value={progressPercent}
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          </div>
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
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const discoveryQuery = useRetrieveDiscoveryQuery();
  const facetsQuery = useRetrieveFacetsQuery();
  const featuredQuery = useGetFeaturedPostsQuery({ page: 0, size: 8 });
  const latestQuery = useGetPublicPostsQuery({ page: 0, size: 8 });
  const columnsQuery = useGetPublicColumnsQuery();
  const seriesQuery = useRetrievePublicSeriesQuery();
  const libraryQuery = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });

  const discovery = discoveryQuery.data;
  const featuredPosts = featuredQuery.data?.list ?? [];
  const latestPool = latestQuery.data?.list ?? [];
  const categories = (facetsQuery.data?.categories ?? []).filter(
    (category): category is CategoryFacet & { id: number; name: string } =>
      category.id != null && Boolean(category.name) && (category.count ?? 0) > 0
  );
  const essayCount = facetsQuery.data?.totalPublishedCount ?? latestQuery.data?.total ?? 0;

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
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-8 xl:px-10 2xl:px-14">
      <div className="flex w-full flex-col gap-16">
        <JournalMasthead essayCount={essayCount} />

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

        <div className="grid items-start gap-x-10 gap-y-14 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex min-w-0 flex-col gap-14">
            {openingLoading ? <JournalSkeleton /> : null}

            {!openingLoading && lead ? (
              <section aria-label={t("featuredStories")}>
                <FeatureMosaic companions={companions} lead={lead} />
              </section>
            ) : null}

            <ContinueReading entries={libraryQuery.data?.continueReading ?? []} />

            <section aria-labelledby="latest-title" className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <Typography id="latest-title" type="h3" weight="semibold">
                  {t("latest")}
                </Typography>
              </div>
              {latestQuery.isLoading && !openingLoading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-12 w-full rounded-md" />
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
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {latestPosts.map((post) => (
                    <StoryTile key={post.id ?? post.slug} post={post} />
                  ))}
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

          <aside className="flex flex-col gap-4 xl:sticky xl:top-28 xl:self-start">
            <CategoryList categories={categories} />
            <AttentionCard mostRead={mostRead} trending={trending} />
            <ColumnRail collections={collections} />
          </aside>
        </div>

        {featuredPosts.length > 0 ? (
          <section aria-labelledby="featured-band-title" className="flex flex-col gap-4">
            <Typography id="featured-band-title" type="h2" weight="semibold">
              {t("featuredStories")}
            </Typography>
            <div className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-4">
              {featuredPosts.slice(0, 8).map((post) => (
                <IndexLine key={post.id ?? post.slug} post={post} />
              ))}
            </div>
          </section>
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

function IndexLine({ post }: { post: Story }) {
  const t = useTranslations("Journal");
  const locale = useLocale();

  return (
    <article className="flex flex-col gap-1 border-t py-4">
      <StoryMeta post={post} />
      <Link className="text-foreground text-sm leading-5 no-underline" href={storyHref(post)}>
        {post.title || t("untitledStory")}
      </Link>
      <span className="text-muted text-xs tabular-nums">
        {t("views", { count: (post.views ?? 0).toLocaleString(locale) })}
      </span>
    </article>
  );
}
