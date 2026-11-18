"use client";

import { Link, Tag, TagGroup } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useGetPublicColumnBySlugQuery } from "@/lib/features/column";
import { type PostResponse } from "@/lib/features/post";

/** Context the title does not already show: column, tags, and update time. */
export function articleHasContext(article: PostResponse) {
  return Boolean(article.series || (article.tags?.length ?? 0) > 0 || article.updatedAt);
}

export function ArticleSidebar({ article }: { article: PostResponse }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Article");
  const series = article.series;
  const column = useGetPublicColumnBySlugQuery(series?.slug ?? "", { skip: !series?.slug });
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
      {tags.length > 0 ? (
        <TagGroup
          aria-label={t("tags")}
          selectionMode="single"
          size="sm"
          variant="surface"
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const slug = [...keys][0];
            if (slug == null) return;
            router.push(`/single/tags/${encodeURIComponent(String(slug))}`);
          }}
        >
          <TagGroup.List>
            {tags.map((tag) => (
              <Tag key={tag.id} id={tag.slug} textValue={tag.name}>
                {tag.name}
              </Tag>
            ))}
          </TagGroup.List>
        </TagGroup>
      ) : null}
      <p className="text-muted flex flex-col gap-1 text-xs">
        {updatedLabel ? <span>{t("updated", { date: updatedLabel })}</span> : null}
        <span>{t("views", { count: article.views })}</span>
      </p>
    </div>
  );
}
