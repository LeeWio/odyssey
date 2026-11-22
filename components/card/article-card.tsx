"use client";

import { Avatar, Card, Chip, Popover } from "@heroui/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { ArticleCover } from "@/components/card/article-cover";
import { ArticleCardActions } from "@/components/card/article-card-actions";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";

export interface ArticleCardPost {
  id?: number;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  coverImage?: string | null;
  shaderPreset?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  category?: { name?: string | null } | null;
  views?: number;
  likesCount?: number;
  commentsCount?: number;
  isInReadingList?: boolean | null;
  publishedAt?: string | null;
  createdAt?: string | null;
}

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ArticleAuthor({
  post,
  publishedAt,
}: {
  post: ArticleCardPost;
  publishedAt: string | null;
}) {
  const t = useTranslations("ArticleCard");
  const article = useTranslations("Article");
  const locale = useLocale();
  const name = post.authorName?.trim();
  const author = name || t("unknownAuthor");
  const initials = author.slice(0, 2).toUpperCase();
  const date = formatDate(publishedAt, locale, article("recentlyPublished"));
  const byline = (
    <div className="flex items-center gap-2">
      <Avatar size="sm">
        {post.authorAvatar ? <Avatar.Image alt={author} src={post.authorAvatar} /> : null}
        <Avatar.Fallback>{initials}</Avatar.Fallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="text-sm font-medium">{author}</p>
        <time className="text-muted text-xs" dateTime={publishedAt || undefined}>
          {date}
        </time>
      </div>
    </div>
  );

  if (!name) return byline;

  return (
    <Popover>
      <Popover.Trigger aria-label={t("authorProfile", { author })}>{byline}</Popover.Trigger>
      <Popover.Content className="w-80 max-w-[calc(100vw-2rem)]">
        <Popover.Dialog>
          <Popover.Heading>{author}</Popover.Heading>
          <Link
            className="text-accent mt-2 inline-block text-sm"
            href={`/single/authors/${encodeURIComponent(name)}`}
          >
            {t("authorArticles")}
          </Link>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export function ArticleCard({
  animatedCover = false,
  layout = "row",
  post,
}: {
  animatedCover?: boolean;
  layout?: "row" | "tile";
  post: ArticleCardPost;
}) {
  const t = useTranslations("Journal");
  const title = post.title || t("untitledStory");
  const slug = post.slug || "";
  const href = slug ? `/single/${encodeURIComponent(slug)}` : "/single";
  const seed = String(post.id ?? post.slug ?? title);
  const publishedAt = getPostPublishedAt(post);

  return (
    <Card
      aria-label={title}
      className={
        layout === "tile"
          ? "h-full w-full overflow-hidden p-0"
          : "w-full max-w-xl overflow-hidden md:flex-row md:items-stretch"
      }
      role="article"
    >
      <div
        className={
          layout === "tile"
            ? "relative isolate aspect-[16/10] w-full overflow-hidden"
            : "relative isolate min-h-56 w-full shrink-0 overflow-hidden rounded-2xl sm:min-h-64 md:min-h-0 md:w-48 lg:w-52"
        }
      >
        <ArticleCover
          animated={animatedCover}
          presetId={post.shaderPreset}
          seed={seed}
          src={post.coverImage}
        />
        {post.category?.name ? (
          <Chip className="absolute top-3 left-3" size="sm">
            {post.category.name}
          </Chip>
        ) : null}
      </div>

      <div
        className={
          layout === "tile" ? "flex flex-1 flex-col gap-3 p-5" : "flex flex-1 flex-col gap-3"
        }
      >
        <Card.Header className="gap-1">
          <Card.Title className="text-foreground max-w-xl pe-8 text-xl leading-tight font-bold text-pretty sm:text-2xl">
            <Link
              className="text-foreground hover:text-accent no-underline"
              href={href}
              prefetch={false}
            >
              {title}
            </Link>
          </Card.Title>
          {post.summary ? (
            <Card.Description className="text-muted line-clamp-2 max-w-xl text-sm leading-5">
              {post.summary}
            </Card.Description>
          ) : null}
        </Card.Header>

        <Card.Footer className="mt-auto w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ArticleAuthor post={post} publishedAt={publishedAt} />
          <ArticleCardActions post={post} href={href} />
        </Card.Footer>
      </div>
    </Card>
  );
}
