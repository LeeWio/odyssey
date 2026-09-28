"use client";

import { Link, ProgressBar, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { useGetPublicColumnBySlugQuery } from "@/lib/features/column";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { useGetLibraryOverviewQuery } from "@/lib/features/library";
import { useRetrieveDiscoveryQuery } from "@/lib/features/openapi";
import {
  type PostResponse,
  useGetFeaturedPostsQuery,
  useGetRelatedPostsQuery,
} from "@/lib/features/post";
import { useAppSelector } from "@/lib/hooks";

export interface ArticleSidebarProps {
  slug?: string;
}

function formatPostDate(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

type StoryRef = {
  category?: { name?: string | null } | null;
  id?: number;
  publishedAt?: string | null;
  slug?: string | null;
  title?: string | null;
};

function StoryLine({ meta, post, progress }: { meta?: string; post: StoryRef; progress?: number }) {
  return (
    <li className="flex flex-col gap-1 border-t py-3 first:border-t-0 first:pt-0">
      {meta ? <span className="text-muted text-xs">{meta}</span> : null}
      <Link
        className="text-foreground text-sm leading-5 no-underline"
        href={post.slug ? `/single/${post.slug}` : "/single"}
      >
        {post.title}
      </Link>
      {typeof progress === "number" ? (
        <ProgressBar aria-label={post.title ?? ""} color="accent" size="sm" value={progress}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      ) : null}
    </li>
  );
}

function StoryBand({
  id,
  loading,
  posts,
  title,
}: {
  id: string;
  loading?: boolean;
  posts: StoryRef[];
  title: string;
}) {
  const t = useTranslations("Article");
  const locale = useLocale();
  if (!loading && posts.length === 0) return null;

  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
      <Typography id={id} type="body-sm" weight="semibold">
        {title}
      </Typography>
      {loading ? (
        <div
          aria-busy="true"
          aria-label={t("loadingRelated")}
          className="flex flex-col gap-3"
          role="status"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <ol>
          {posts.map((post) => (
            <StoryLine
              key={post.id}
              meta={[
                post.category?.name,
                formatPostDate(post.publishedAt, locale, t("recentlyPublished")),
              ]
                .filter(Boolean)
                .join(" · ")}
              post={post}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function excludeCurrent(posts: StoryRef[], slug?: string) {
  return posts.filter((post) => post.slug && post.slug !== slug);
}

export function ArticleContext({
  article,
  readingMinutes,
  slug,
}: {
  article: PostResponse;
  readingMinutes: number;
  slug?: string;
}) {
  const t = useTranslations("Article");
  const locale = useLocale();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const discovery = useRetrieveDiscoveryQuery();
  const featured = useGetFeaturedPostsQuery({ page: 0, size: 6 });
  const related = useGetRelatedPostsQuery(slug || "", { skip: !slug });
  const library = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });
  const series = article.series;
  const column = useGetPublicColumnBySlugQuery(series?.slug ?? "", { skip: !series?.slug });
  const columnPosts = column.data?.posts ?? [];
  const category = article.category;
  const tags = article.tags ?? [];
  const reading = (library.data?.continueReading ?? [])
    .filter((entry) => entry.post.slug !== slug)
    .slice(0, 4);
  const trending = excludeCurrent(
    discovery.data?.trending ?? discovery.data?.mostRead ?? [],
    slug
  ).slice(0, 6);
  const featuredPosts = excludeCurrent(
    featured.data?.list ?? discovery.data?.curated ?? [],
    slug
  ).slice(0, 6);
  const mostRead = excludeCurrent(discovery.data?.mostRead ?? [], slug).slice(0, 6);
  const relatedPosts = excludeCurrent(related.data ?? [], slug).slice(0, 6);

  return (
    <>
      <aside className="order-2 flex flex-col gap-8 pb-24 lg:sticky lg:top-28 lg:pb-0 xl:order-none">
        <section aria-label={t("aboutThisPiece")} className="flex flex-col gap-3">
          <Typography type="body-sm" weight="semibold">
            {t("aboutThisPiece")}
          </Typography>
          <dl className="text-muted flex flex-col gap-2 text-sm">
            <div>
              <dt>{t("minRead", { count: readingMinutes })}</dt>
            </div>
            <div>
              <dt>{t("views", { count: article.views.toLocaleString(locale) })}</dt>
            </div>
            <div>
              <dt>{t("likes", { count: article.likesCount.toLocaleString(locale) })}</dt>
            </div>
            <div>
              <dt>{t("saves", { count: article.favoritesCount.toLocaleString(locale) })}</dt>
            </div>
          </dl>
        </section>

        {category?.name ? (
          <section aria-label={t("category")} className="flex flex-col gap-2">
            <Typography type="body-sm" weight="semibold">
              {t("category")}
            </Typography>
            <Link
              className="text-foreground text-sm no-underline"
              href={category.id ? `/explore?category=${category.id}` : "/explore"}
            >
              {category.name}
            </Link>
          </section>
        ) : null}

        {tags.length > 0 ? (
          <section aria-label={t("tags")} className="flex flex-col gap-2">
            <Typography type="body-sm" weight="semibold">
              {t("tags")}
            </Typography>
            <ul className="flex flex-col gap-1">
              {tags.map((tag) => (
                <li key={tag.id}>
                  <Link className="text-muted text-sm no-underline" href={`/explore?tag=${tag.id}`}>
                    {tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {series ? (
          <section aria-label={series.name} className="flex flex-col gap-2">
            <Link
              className="text-foreground text-sm font-medium no-underline"
              href={`/columns/${series.slug}`}
            >
              {t("partOfColumn", { name: series.name })}
            </Link>
            {series.description ? (
              <Typography className="line-clamp-4" color="muted" type="body-sm">
                {series.description}
              </Typography>
            ) : null}
            {article.seriesOrder ? (
              <Typography color="muted" type="body-xs">
                {t("installment", { count: series.postsCount, order: article.seriesOrder })}
              </Typography>
            ) : null}
          </section>
        ) : null}

        {isAuthenticated && reading.length > 0 ? (
          <section aria-labelledby="your-reading-title" className="flex flex-col gap-3">
            <Typography id="your-reading-title" type="body-sm" weight="semibold">
              {t("yourReading")}
            </Typography>
            <ol>
              {reading.map((entry) => (
                <StoryLine
                  key={entry.post.id}
                  meta={t("readProgress", { progress: entry.progressPercent })}
                  post={entry.post}
                  progress={entry.progressPercent}
                />
              ))}
            </ol>
          </section>
        ) : null}
      </aside>

      <section
        aria-label={t("aroundTheArchive")}
        className="order-3 col-span-full grid gap-10 border-t pt-10 md:grid-cols-2 xl:order-none xl:grid-cols-4"
      >
        {series && columnPosts.length > 0 ? (
          <section aria-labelledby="column-stories-title" className="flex min-w-0 flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <Typography id="column-stories-title" type="body-sm" weight="semibold">
                {t("inThisColumn")}
              </Typography>
              <Link className="text-xs no-underline" href={`/columns/${series.slug}`}>
                {series.name}
              </Link>
            </div>
            <ol>
              {columnPosts.map((post, index) => {
                const current = post.slug === slug;
                return (
                  <StoryLine
                    key={post.id}
                    meta={
                      current
                        ? t("youAreHere")
                        : t("installment", { count: columnPosts.length, order: index + 1 })
                    }
                    post={post}
                  />
                );
              })}
            </ol>
          </section>
        ) : null}
        <StoryBand
          id="related-stories-title"
          loading={related.isLoading}
          posts={relatedPosts}
          title={t("related")}
        />
        <StoryBand
          id="trending-stories-title"
          loading={discovery.isLoading}
          posts={trending}
          title={t("trending")}
        />
        <StoryBand
          id="featured-stories-title"
          loading={featured.isLoading && featuredPosts.length === 0}
          posts={featuredPosts}
          title={t("featured")}
        />
        <StoryBand
          id="most-read-stories-title"
          loading={discovery.isLoading}
          posts={mostRead}
          title={t("mostRead")}
        />
      </section>
    </>
  );
}
