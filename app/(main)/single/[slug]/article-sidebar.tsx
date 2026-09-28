"use client";

import { Card, Link, ProgressBar, Skeleton, Tag, TagGroup, Typography } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useGetPublicColumnBySlugQuery } from "@/lib/features/column";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { useGetLibraryOverviewQuery } from "@/lib/features/library";
import { useRetrieveDiscoveryQuery } from "@/lib/features/openapi";
import {
  type PostResponse,
  useGetFeaturedPostsQuery,
  useGetPublicPostsQuery,
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
  createdAt?: string | null;
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
    <Card variant="secondary">
      <Card.Header>
        <Card.Title className="text-sm" id={id}>
          {title}
        </Card.Title>
      </Card.Header>
      <Card.Content className="flex min-w-0 flex-col gap-3">
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
      </Card.Content>
    </Card>
  );
}

export function columnOrder(posts: StoryRef[], slug?: string) {
  const index = posts.findIndex((post) => post.slug === slug);
  return index >= 0 ? index + 1 : null;
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
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const discovery = useRetrieveDiscoveryQuery();
  const featured = useGetFeaturedPostsQuery({ page: 0, size: 6 });
  const related = useGetRelatedPostsQuery(slug || "", { skip: !slug });
  const library = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });
  const series = article.series;
  const column = useGetPublicColumnBySlugQuery(series?.slug ?? "", { skip: !series?.slug });
  const columnPosts = column.data?.posts ?? [];
  const category = article.category;
  const authorName = article.authorName?.trim();
  const authorDirectory = useGetPublicPostsQuery({ page: 0, size: 40 }, { skip: !authorName });
  const sameCategory = useGetPublicPostsQuery(
    { categoryId: category?.id, page: 0, size: 5 },
    { skip: !category?.id }
  );
  const tags = article.tags ?? [];
  const reading = (library.data?.continueReading ?? [])
    .filter((entry) => entry.post.slug !== slug)
    .slice(0, 4);
  const trending = excludeCurrent(
    discovery.data?.trending ?? discovery.data?.mostRead ?? [],
    slug
  ).slice(0, 4);
  const featuredPosts = excludeCurrent(
    featured.data?.list ?? discovery.data?.curated ?? [],
    slug
  ).slice(0, 4);
  const relatedPosts = excludeCurrent(related.data ?? [], slug).slice(0, 4);
  const authorPosts = excludeCurrent(
    (authorDirectory.data?.list ?? []).filter((post) => post.authorName?.trim() === authorName),
    slug
  )
    .slice(0, 4)
    .map((post) => ({
      ...post,
      publishedAt: "publishedAt" in post && post.publishedAt ? post.publishedAt : post.createdAt,
    }));
  const categoryPosts = excludeCurrent(sameCategory.data?.list ?? [], slug)
    .slice(0, 4)
    .map((post) => ({
      ...post,
      publishedAt: "publishedAt" in post && post.publishedAt ? post.publishedAt : post.createdAt,
    }));

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
          <Card variant="secondary">
            <Card.Header>
              <Card.Title className="text-sm">{t("category")}</Card.Title>
            </Card.Header>
            <Card.Content>
              <Link
                className="text-foreground text-sm no-underline"
                href={category.id ? `/explore?category=${category.id}` : "/explore"}
              >
                {category.name}
                <Link.Icon />
              </Link>
            </Card.Content>
          </Card>
        ) : null}

        {tags.length > 0 ? (
          <Card variant="secondary">
            <Card.Header>
              <Card.Title className="text-sm">{t("tags")}</Card.Title>
            </Card.Header>
            <Card.Content>
              <TagGroup
                aria-label={t("tags")}
                selectionMode="single"
                size="sm"
                onSelectionChange={(keys) => {
                  if (keys === "all") return;
                  const key = [...keys][0];
                  if (key != null) router.push(`/explore?tag=${key}`);
                }}
              >
                <TagGroup.List className="flex-wrap">
                  {tags.map((tag) => (
                    <Tag key={tag.id} id={String(tag.id)} textValue={tag.name}>
                      {tag.name}
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            </Card.Content>
          </Card>
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
        aria-labelledby="keep-reading-title"
        className="order-3 col-span-full flex flex-col gap-4 border-t pt-10 xl:order-none"
      >
        <Typography id="keep-reading-title" type="h3" weight="semibold">
          {t("keepReading")}
        </Typography>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {series && columnPosts.length > 0 ? (
            <Card variant="secondary">
              <Card.Header>
                <Card.Title className="text-sm">{t("inThisColumn")}</Card.Title>
                <Card.Description>
                  <Link className="no-underline" href={`/columns/${series.slug}`}>
                    {series.name}
                    <Link.Icon />
                  </Link>
                </Card.Description>
              </Card.Header>
              <Card.Content>
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
              </Card.Content>
            </Card>
          ) : null}
          {authorName && authorPosts.length > 0 ? (
            <Card variant="secondary">
              <Card.Header>
                <Card.Title className="text-sm" id="author-stories-title">
                  {t("moreFromAuthor", { name: authorName })}
                </Card.Title>
                <Card.Description>
                  <Link
                    className="no-underline"
                    href={`/single/authors/${encodeURIComponent(authorName)}`}
                  >
                    {authorName}
                    <Link.Icon />
                  </Link>
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <ol>
                  {authorPosts.map((post) => (
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
              </Card.Content>
            </Card>
          ) : null}
          {category?.id && category.name ? (
            <StoryBand
              id="category-stories-title"
              loading={sameCategory.isLoading}
              posts={categoryPosts}
              title={t("moreInCategory", { name: category.name })}
            />
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
        </div>
      </section>
    </>
  );
}
