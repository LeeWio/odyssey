"use client";

import { NumberValue } from "@heroui-pro/react";
import { Avatar, Link } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { type PostResponse } from "@/lib/features/post";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getAuthorInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getEstimatedReadingMinutes(article: Pick<PostResponse, "content" | "summary">) {
  const source = `${article.content ?? ""} ${article.summary ?? ""}`.trim();
  if (!source) return 1;

  const wordCount = source.split(/\s+/).filter(Boolean).length;
  const approximateCount = wordCount > 20 ? wordCount : Math.ceil(source.length / 700);

  return Math.max(1, Math.ceil(approximateCount / 225));
}

export function ArticleHeader({ article }: { article: PostResponse }) {
  const locale = useLocale();
  const t = useTranslations("Article");
  const authorName = article.authorName?.trim() || "Odyssey";
  const publishedAt = getPostPublishedAt(article);
  const readingMinutes = getEstimatedReadingMinutes(article);
  const hasUpdated = Boolean(article.updatedAt && publishedAt && article.updatedAt !== publishedAt);

  return (
    <header className="mb-14 flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-5">
        <h1 className="text-foreground text-4xl leading-[1.1] font-semibold text-balance sm:text-5xl">
          {article.title}
        </h1>
        {article.summary ? (
          <p className="text-muted max-w-2xl text-lg leading-8 text-pretty sm:text-xl">
            {article.summary}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            {article.authorAvatar ? (
              <Avatar.Image alt={authorName} src={article.authorAvatar} />
            ) : null}
            <Avatar.Fallback>{getAuthorInitials(authorName)}</Avatar.Fallback>
          </Avatar>
          {article.authorName?.trim() ? (
            <Link
              className="text-foreground font-medium no-underline hover:underline"
              href={`/single/authors/${encodeURIComponent(article.authorName.trim())}`}
            >
              {authorName}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{authorName}</span>
          )}
        </div>

        <span aria-hidden="true" className="text-muted/60">
          ·
        </span>

        <time className="text-muted" dateTime={publishedAt ?? undefined}>
          {formatDate(publishedAt, locale, t("recentlyPublished"))}
        </time>

        <span aria-hidden="true" className="text-muted/60">
          ·
        </span>

        <span className="text-muted tabular-nums">{t("minRead", { count: readingMinutes })}</span>

        <span aria-hidden="true" className="text-muted/60">
          ·
        </span>

        <span className="text-muted tabular-nums">
          <NumberValue locale={locale} notation="compact" value={article.views}>
            {(formatted) => t("views", { count: formatted })}
          </NumberValue>
        </span>

        {hasUpdated ? (
          <span className="text-muted basis-full text-xs">
            {t("updated", { date: formatDate(article.updatedAt, locale, t("recentlyPublished")) })}
          </span>
        ) : null}
      </div>

      {article.tags?.length ? (
        <nav aria-label={t("tags")} className="flex flex-wrap gap-x-3 gap-y-1.5">
          {article.tags.map((tag) => (
            <Link
              key={tag.id}
              className="text-muted hover:text-foreground text-xs no-underline hover:underline"
              href={`/single/tags/${encodeURIComponent(tag.slug)}`}
            >
              #{tag.name}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
