"use client";

import { Calendar, Clock } from "@gravity-ui/icons";
import { Avatar, Chip, Link, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { ArticleAmbientBackground } from "@/features/blog/reader/article-ambient-background";
import { type PostResponse } from "@/lib/features/post";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";
import { useArticleReadingMinutes } from "./article-outline";

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
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

export function ArticleHero({ article }: { article: PostResponse }) {
  const locale = useLocale();
  const t = useTranslations("Article");
  const authorName = article.authorName?.trim() || "Odyssey";
  const publishedAt = getPostPublishedAt(article);
  const minutes = useArticleReadingMinutes();
  const category = article.category;

  const publishedLabel = formatDate(publishedAt, locale, t("recentlyPublished"));

  return (
    <header className="relative mb-12 w-full max-w-none md:mb-16">
      <ArticleAmbientBackground presetId={article.shaderPreset} slug={article.slug} />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center pt-28 pb-8 text-center md:pt-32">
        {category ? (
          <Chip size="sm" variant="soft">
            <Link href={`/single/categories/${encodeURIComponent(category.slug)}`}>
              {category.name}
            </Link>
          </Chip>
        ) : null}

        <h1 className="mt-6 max-w-3xl text-4xl leading-[1.15] font-semibold text-balance wrap-break-word sm:text-5xl">
          {article.title}
        </h1>

        {article.summary ? (
          <div className="mt-5">
            <p className="text-muted max-w-3xl text-base leading-7 text-pretty sm:text-lg">
              {article.summary}
            </p>
          </div>
        ) : null}

        <div className="mt-8">
          <div className="flex flex-col items-center gap-3">
            {article.authorName?.trim() ? (
              <Link
                className="flex items-center gap-2 no-underline"
                href={`/single/authors/${encodeURIComponent(article.authorName.trim())}`}
              >
                <Avatar size="sm">
                  {article.authorAvatar ? (
                    <Avatar.Image alt={authorName} src={article.authorAvatar} />
                  ) : null}
                  <Avatar.Fallback>{getAuthorInitials(authorName)}</Avatar.Fallback>
                </Avatar>
                <span className="text-foreground text-sm font-medium">{authorName}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <Avatar.Fallback>{getAuthorInitials(authorName)}</Avatar.Fallback>
                </Avatar>
                <Typography className="font-medium" type="body-sm">
                  {authorName}
                </Typography>
              </div>
            )}
            <div className="text-muted flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <time dateTime={publishedAt ?? undefined}>{publishedLabel}</time>
              </span>
              {minutes == null ? null : (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Clock className="size-3.5" />
                    {t("minRead", { count: minutes })}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
