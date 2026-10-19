"use client";

import { Avatar, Chip, Link, Tag, TagGroup } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useGetPublicColumnBySlugQuery } from "@/lib/features/column";
import { type PostResponse } from "@/lib/features/post";

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function articleHasContext(article: PostResponse) {
  return Boolean(
    article.authorName?.trim() ||
    article.series ||
    article.category ||
    (article.tags?.length ?? 0) > 0
  );
}

export function ArticleSidebar({ article }: { article: PostResponse }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Article");
  const series = article.series;
  const column = useGetPublicColumnBySlugQuery(series?.slug ?? "", { skip: !series?.slug });
  const authorName = article.authorName?.trim() || "";
  const tags = article.tags ?? [];
  const updated = article.updatedAt ? new Date(article.updatedAt) : null;
  const updatedLabel =
    updated && !Number.isNaN(updated.getTime())
      ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(
          updated
        )
      : null;

  if (!articleHasContext(article)) return null;

  return (
    <div className="flex flex-col gap-6 text-sm">
      <p className="text-muted text-xs tracking-wide uppercase">{t("aboutThisPiece")}</p>
      {authorName ? (
        <Link
          className="flex items-center gap-2 no-underline"
          href={`/single/authors/${encodeURIComponent(authorName)}`}
        >
          <Avatar size="sm">
            {article.authorAvatar ? (
              <Avatar.Image alt={authorName} src={article.authorAvatar} />
            ) : null}
            <Avatar.Fallback>{initials(authorName)}</Avatar.Fallback>
          </Avatar>
          <span className="text-foreground font-medium">{authorName}</span>
        </Link>
      ) : null}
      {series ? (
        <div className="flex flex-col gap-1">
          <Link
            className="font-medium no-underline"
            href={`/columns/${encodeURIComponent(series.slug)}`}
          >
            {t("partOfColumn", { name: series.name })}
          </Link>
          <span className="text-muted">
            {t("installment", {
              count: column.data?.postsCount ?? series.postsCount,
              order: article.seriesOrder ?? 1,
            })}
          </span>
        </div>
      ) : null}
      {article.category ? (
        <Chip size="sm" variant="soft">
          <Link href={`/single/categories/${encodeURIComponent(article.category.slug)}`}>
            {article.category.name}
          </Link>
        </Chip>
      ) : null}
      {tags.length > 0 ? (
        <TagGroup aria-label={t("tags")} size="sm" variant="surface">
          <TagGroup.List>
            {tags.map((tag) => (
              <Tag
                key={tag.id}
                id={tag.slug}
                textValue={tag.name}
                onAction={() => router.push(`/single/tags/${encodeURIComponent(tag.slug)}`)}
              >
                {tag.name}
              </Tag>
            ))}
          </TagGroup.List>
        </TagGroup>
      ) : null}
      <p className="text-muted flex flex-col gap-1 text-xs">
        {updatedLabel ? <span>{t("updated", { date: updatedLabel })}</span> : null}
        <span>{t("views", { count: article.views })}</span>
        <span>{t("likes", { count: article.likesCount })}</span>
      </p>
    </div>
  );
}
