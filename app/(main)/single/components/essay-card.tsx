"use client";

import { NumberValue } from "@heroui-pro/react";
import { Card, Link } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { ArticleCover } from "@/components/card/article-cover";
import { ReadingListButton } from "@/features/library/reading-list-button";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";

export interface EssayCardPost {
  id?: number;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  coverImage?: string | null;
  authorName?: string | null;
  category?: { name?: string | null } | null;
  views?: number;
  likesCount?: number;
  commentsCount?: number;
  isInReadingList?: boolean | null;
  publishedAt?: string | null;
  createdAt?: string | null;
}

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

export function EssayCard({ post }: { post: EssayCardPost }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const title = post.title || t("untitledStory");
  const slug = post.slug ?? "";
  const date = getPostPublishedAt(post);
  const seed = String(post.id ?? post.slug ?? title);

  return (
    <Card className="h-full overflow-hidden">
      <div className="relative isolate aspect-[16/7] w-full overflow-hidden">
        <ArticleCover animated={false} seed={seed} />
      </div>
      <Card.Header>
        <Card.Title className="line-clamp-2 min-w-0 text-base leading-6">
          <Link
            className="text-foreground block max-w-full wrap-anywhere no-underline"
            href={`/single/${slug}`}
          >
            {title}
          </Link>
        </Card.Title>
        <Card.Description>
          {[post.authorName, post.category?.name, formatDate(date, locale, t("recentlyPublished"))]
            .filter(Boolean)
            .join(" · ")}
        </Card.Description>
      </Card.Header>
      {post.summary ? (
        <Card.Content>
          <p className="text-muted line-clamp-2 text-sm leading-5">{post.summary}</p>
        </Card.Content>
      ) : null}
      <Card.Footer className="mt-auto justify-between gap-3">
        <span className="text-muted text-xs tabular-nums">
          <NumberValue locale={locale} notation="compact" value={post.views ?? 0}>
            {(formatted) => t("views", { count: formatted })}
          </NumberValue>
          {" · "}
          <NumberValue locale={locale} notation="compact" value={post.likesCount ?? 0}>
            {(formatted) => t("likes", { count: formatted })}
          </NumberValue>
          {typeof post.commentsCount === "number" ? (
            <>
              {" · "}
              <NumberValue locale={locale} notation="compact" value={post.commentsCount}>
                {(formatted) => t("comments", { count: formatted })}
              </NumberValue>
            </>
          ) : null}
        </span>
        {post.id != null && typeof post.isInReadingList === "boolean" ? (
          <ReadingListButton postId={post.id} isSaved={post.isInReadingList} />
        ) : null}
      </Card.Footer>
    </Card>
  );
}
