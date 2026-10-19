"use client";

import { Link, Skeleton } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { articleHasContext, ArticleSidebar } from "./article-sidebar";
import { ArticleNeighbors } from "./neighbors";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";
import {
  type PostDigestResponse,
  type PostResponse,
  useGetFeaturedPostsQuery,
  useGetRelatedPostsQuery,
} from "@/lib/features/post";

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StoryLink({ post }: { post: PostDigestResponse }) {
  const locale = useLocale();
  const published = formatDate(getPostPublishedAt(post), locale);

  return (
    <Link
      className="flex min-w-0 flex-col gap-2 border-t border-current/10 py-4 no-underline"
      href={`/single/${encodeURIComponent(post.slug)}`}
    >
      <span className="text-muted text-xs">
        {[post.category?.name, published].filter(Boolean).join(" · ")}
      </span>
      <span className="text-foreground line-clamp-2 text-base leading-snug font-medium">
        {post.title}
      </span>
      {post.summary ? (
        <span className="text-muted line-clamp-2 text-sm leading-6">{post.summary}</span>
      ) : null}
    </Link>
  );
}

export function ArticleFooter({ article }: { article: PostResponse }) {
  const t = useTranslations("Article");
  const related = useGetRelatedPostsQuery(article.slug);
  const featured = useGetFeaturedPostsQuery({ page: 0, size: 4 });
  const relatedPosts = (related.data ?? [])
    .filter((post) => post.slug !== article.slug)
    .slice(0, 3);
  const explorePosts =
    relatedPosts.length > 0
      ? relatedPosts
      : (featured.data?.list ?? []).filter((post) => post.slug !== article.slug).slice(0, 3);
  const exploringArchive = relatedPosts.length === 0 && explorePosts.length > 0;

  return (
    <div className="mt-20 flex flex-col gap-16">
      {articleHasContext(article) ? (
        <section className="mx-auto w-full max-w-3xl border-t border-current/10 px-4 pt-6 md:px-6 xl:sr-only">
          <ArticleSidebar article={article} />
        </section>
      ) : null}
      <ArticleNeighbors article={article} />

      <section aria-labelledby="article-explore" className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mb-2 max-w-2xl">
          <h2 className="text-xl font-semibold" id="article-explore">
            {exploringArchive ? t("aroundTheArchive") : t("related")}
          </h2>
          <p className="text-muted mt-1 text-sm">
            {exploringArchive ? t("aroundTheArchiveHint") : t("relatedHint")}
          </p>
        </div>
        {related.isLoading || (relatedPosts.length === 0 && featured.isLoading) ? (
          <div
            aria-busy="true"
            aria-label={t("loadingRelated")}
            className="flex flex-col gap-3 py-4"
          >
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : explorePosts.length > 0 ? (
          <div className="grid gap-x-10 md:grid-cols-3">
            {explorePosts.map((post) => (
              <StoryLink key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-muted border-t border-current/10 py-6 text-sm">
            {t("nothingNearbyHint")} <Link href="/single">{t("backToJournal")}</Link>
          </p>
        )}
      </section>
    </div>
  );
}
