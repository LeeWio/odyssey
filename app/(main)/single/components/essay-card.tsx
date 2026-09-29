"use client";

import { NumberValue } from "@heroui-pro/react";
import { Card, Link } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

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
  const cover = post.coverImage?.trim();
  const slug = post.slug ?? "";
  const date = getPostPublishedAt(post);

  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex items-start gap-3">
          <Card.Title className="line-clamp-2 min-w-0 flex-1 text-base leading-6">
            <Link className="text-foreground no-underline" href={`/single/${slug}`}>
              {title}
            </Link>
          </Card.Title>
          {cover ? (
            <Link
              className="block size-12 shrink-0 overflow-hidden rounded-lg no-underline"
              href={`/single/${slug}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="size-12 object-cover" src={cover} />
            </Link>
          ) : null}
        </div>
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
      <Card.Footer className="mt-auto">
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
      </Card.Footer>
    </Card>
  );
}
