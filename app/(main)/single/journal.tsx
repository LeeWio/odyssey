"use client";

import { Icon } from "@iconify/react";
import { EmptyState } from "@heroui-pro/react";
import {
  Alert,
  Avatar,
  Button,
  Link,
  Popover,
  ProgressBar,
  Skeleton,
  Typography,
} from "@heroui/react";
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

function AuthorPopover({ name, avatar }: { name: string; avatar?: string | null }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
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
      <Popover.Trigger aria-label={t("userProfile")}>
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
                {isFollowing ? t("following") : t("follow")}
              </Button>
            </div>
          </Popover.Heading>
          <p className="text-muted mt-3 text-sm">{t("authorBio")}</p>
          <div className="mt-3 flex gap-4">
            <div>
              <span className="font-semibold">{(892).toLocaleString(locale)}</span>
              <span className="text-muted ms-1 text-sm">{t("following")}</span>
            </div>
            <div>
              <span className="font-semibold">
                {(12500).toLocaleString(locale, { notation: "compact" })}
              </span>
              <span className="text-muted ms-1 text-sm">{t("followers")}</span>
            </div>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
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

function FeatureMosaic({ lead, companions }: { lead: Story; companions: Story[] }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const author = lead.authorName?.trim();

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <article className="bg-surface-secondary overflow-hidden rounded-3xl lg:col-span-3">
        <Link className="group block overflow-hidden no-underline" href={storyHref(lead)}>
          <Cover cover={lead.coverImage?.trim()} ratio="aspect-[16/10]" />
        </Link>
        <div className="flex flex-col gap-3 p-6 sm:p-8">
          <StoryMeta post={lead} />
          <Typography
            className="text-3xl leading-tight tracking-tight sm:text-4xl"
            type="h2"
            weight="semibold"
          >
            <Link className="text-foreground no-underline" href={storyHref(lead)}>
              {lead.title || t("untitledStory")}
            </Link>
          </Typography>
          {lead.summary ? (
            <Typography className="line-clamp-2 max-w-[52ch]" color="muted">
              {lead.summary}
            </Typography>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
            {author ? <AuthorPopover avatar={lead.authorAvatar} name={author} /> : null}
            <Typography className="tabular-nums" color="muted" type="body-sm">
              {t("views", { count: (lead.views ?? 0).toLocaleString(locale) })}
            </Typography>
          </div>
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
        {companions.map((post) => (
          <article
            key={post.id ?? post.slug}
            className="bg-surface-secondary overflow-hidden rounded-3xl"
          >
            <Link
              className="group grid no-underline sm:grid-cols-[8.5rem_minmax(0,1fr)] lg:grid-cols-1"
              href={storyHref(post)}
            >
              <span className="block overflow-hidden">
                <Cover
                  cover={post.coverImage?.trim()}
                  ratio="aspect-[16/10] sm:aspect-square lg:aspect-[16/9]"
                />
              </span>
              <span className="flex flex-col justify-center gap-2 p-5">
                <StoryMeta post={post} />
                <span className="text-foreground line-clamp-2 text-lg leading-6 font-semibold tracking-tight">
                  {post.title || t("untitledStory")}
                </span>
              </span>
            </Link>
          </article>
        ))}
      </div>
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

function MostReadRail({ posts }: { posts: Story[] }) {
  const t = useTranslations("Journal");
  const locale = useLocale();

  return (
    <section
      aria-labelledby="popular-title"
      className="bg-surface-secondary flex flex-col gap-1 rounded-3xl p-5"
    >
      <Typography id="popular-title" className="px-2 pt-1 pb-3" type="h3" weight="semibold">
        {t("mostRead")}
      </Typography>
      <ol>
        {posts.slice(0, 4).map((post, index) => (
          <li key={post.id ?? post.slug}>
            <Link
              className="hover:bg-default/60 grid grid-cols-[1.75rem_minmax(0,1fr)] items-baseline gap-3 rounded-2xl px-2 py-3 no-underline transition-colors duration-150"
              href={storyHref(post)}
            >
              <span className="text-muted text-sm tabular-nums">{index + 1}</span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-foreground line-clamp-2 text-sm leading-5 font-medium">
                  {post.title || t("untitledStory")}
                </span>
                <span className="text-muted text-xs tabular-nums">
                  {t("views", { count: (post.views ?? 0).toLocaleString(locale) })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
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

function JournalMasthead({
  categories,
  essayCount,
}: {
  categories: Array<CategoryFacet & { id: number; name: string }>;
  essayCount: number;
}) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const today = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(new Date());
  const leadTopics = categories.slice(0, 6);

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
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
      </div>
      <nav aria-label={t("topics")} className="flex gap-2 overflow-x-auto pb-1">
        {leadTopics.map((category) => (
          <Link
            key={category.id}
            className="bg-surface-secondary text-foreground shrink-0 rounded-full px-3 py-1.5 text-sm no-underline"
            href={`/explore?category=${category.id}`}
          >
            {category.name}
            <span className="text-muted ms-1.5 tabular-nums">
              {(category.count ?? 0).toLocaleString(locale)}
            </span>
          </Link>
        ))}
        <Link
          className="bg-surface-secondary text-foreground shrink-0 rounded-full px-3 py-1.5 text-sm no-underline"
          href="/archive"
        >
          {t("archive")}
        </Link>
      </nav>
    </header>
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
          {t("continueReading")}
        </Typography>
        <Link className="shrink-0 text-sm no-underline" href="/library">
          {t("library")}
          <Link.Icon />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {entries.slice(0, 3).map(({ lastReadAt, post, positionAnchor, progressPercent }) => (
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
      className="grid gap-4 lg:grid-cols-5"
      role="status"
    >
      <div className="bg-surface-secondary overflow-hidden rounded-3xl lg:col-span-3">
        <Skeleton className="aspect-[16/10] w-full rounded-none" />
        <div className="flex flex-col gap-3 p-6">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-10 w-4/5 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
        </div>
      </div>
      <div className="grid gap-4 lg:col-span-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-full min-h-40 rounded-3xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function JournalPage() {
  const t = useTranslations("Journal");
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

  const popular = (discovery?.trending?.length ? discovery.trending : discovery?.mostRead) ?? [];
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
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:px-14 xl:px-20">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-16">
        <JournalMasthead categories={categories} essayCount={essayCount} />

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

        <div className="grid items-start gap-16 xl:grid-cols-[minmax(0,1fr)_20rem]">
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
                <div className="grid gap-4 sm:grid-cols-2">
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

          {popular.length > 0 || collections.length > 0 ? (
            <aside className="flex flex-col gap-4 xl:sticky xl:top-28">
              {popular.length > 0 ? <MostReadRail posts={popular} /> : null}
              <ColumnRail collections={collections} />
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
