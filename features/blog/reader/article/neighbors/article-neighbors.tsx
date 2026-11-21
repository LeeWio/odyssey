"use client";

import { Typography } from "@heroui/react";
import { useTranslations } from "next-intl";

import type { PostResponse } from "@/lib/features/post";

import { NeighborCard } from "./neighbor-card";
import { useArticleNeighbors } from "./use-article-neighbors";

export function ArticleNeighbors({
  article,
  enabled = true,
}: {
  article: PostResponse;
  enabled?: boolean;
}) {
  const t = useTranslations("Article");
  const { next, order, previous, isLoading } = useArticleNeighbors(article, enabled);

  return (
    <section aria-label={t("keepReading")} className="mx-auto w-full max-w-3xl">
      <header className="mb-4">
        <Typography type="h3" weight="semibold">
          {t("keepReading")}
        </Typography>
        <Typography className="mt-1" color="muted" type="body-sm">
          {order === "column" ? t("keepReadingColumnHint") : t("keepReadingHint")}
        </Typography>
      </header>
      <div className="grid items-stretch gap-4 sm:grid-cols-2">
        <NeighborCard direction="previous" neighbor={previous} isLoading={isLoading} />
        <NeighborCard direction="next" neighbor={next} isLoading={isLoading} />
      </div>
    </section>
  );
}
