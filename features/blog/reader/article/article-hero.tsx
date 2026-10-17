"use client";

import { Calendar, Clock } from "@gravity-ui/icons";
import { Avatar, Chip, Link, Tag, TagGroup, Typography } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArticleAmbientBackground } from "@/features/blog/reader/article-ambient-background";
import { type PostResponse } from "@/lib/features/post";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";

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

function getEstimatedReadingMinutes(article: Pick<PostResponse, "content" | "summary">) {
  const source = `${article.content ?? ""} ${article.summary ?? ""}`.trim();
  if (!source) return 1;

  const wordCount = source.split(/\s+/).filter(Boolean).length;
  const approximateCount = wordCount > 20 ? wordCount : Math.ceil(source.length / 700);

  return Math.max(1, Math.ceil(approximateCount / 225));
}

export function ArticleHero({ article }: { article: PostResponse }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Article");
  const authorName = article.authorName?.trim() || "Odyssey";
  const publishedAt = getPostPublishedAt(article);
  const readingMinutes = getEstimatedReadingMinutes(article);
  const category = article.category;
  const tags = article.tags ?? [];

  const publishedLabel = formatDate(publishedAt, locale, t("recentlyPublished"));

  return (
    <header className="relative isolate mb-16 h-[calc(100lvh+1px)] w-full max-w-none lg:h-[100lvh]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 lg:fixed">
        <ArticleAmbientBackground presetId={article.shaderPreset} slug={article.slug} />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col items-center justify-center py-24 ps-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))] text-center">
        {category ? (
          <Chip size="sm" variant="soft">
            <Link href={`/single/categories/${encodeURIComponent(category.slug)}`}>
              {category.name}
            </Link>
          </Chip>
        ) : null}

        <h1 className="mt-6 max-w-2xl text-4xl leading-[1.15] font-semibold text-balance sm:text-5xl">
          {article.title}
        </h1>

        {article.summary ? (
          <p className="text-muted mt-5 max-w-xl text-base leading-7 text-pretty sm:text-lg">
            {article.summary}
          </p>
        ) : null}

        <div className="mt-4">
          {article.authorName?.trim() ? (
            <Link
              className="flex flex-col items-center gap-1.5 no-underline"
              href={`/single/authors/${encodeURIComponent(article.authorName.trim())}`}
            >
              <Avatar size="md">
                {article.authorAvatar ? (
                  <Avatar.Image alt={authorName} src={article.authorAvatar} />
                ) : null}
                <Avatar.Fallback>{getAuthorInitials(authorName)}</Avatar.Fallback>
              </Avatar>
              <span className="text-foreground text-base font-medium">{authorName}</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Avatar size="md">
                <Avatar.Fallback>{getAuthorInitials(authorName)}</Avatar.Fallback>
              </Avatar>
              <Typography className="font-medium" type="body">
                {authorName}
              </Typography>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="text-muted flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <time dateTime={publishedAt ?? undefined}>{publishedLabel}</time>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock className="size-3.5" />
              {t("minRead", { count: readingMinutes })}
            </span>
          </div>
          {tags.length > 0 ? (
            <TagGroup aria-label={t("tags")} size="sm" variant="surface">
              <TagGroup.List className="justify-center">
                {tags.map((tag) => (
                  <Tag
                    key={tag.id}
                    id={tag.slug}
                    textValue={tag.name}
                    onAction={() => {
                      router.push(`/single/tags/${encodeURIComponent(tag.slug)}`);
                    }}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </TagGroup.List>
            </TagGroup>
          ) : null}
        </div>
      </div>
    </header>
  );
}
