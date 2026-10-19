"use client";

import { Typography } from "@heroui/react";
import { useTranslations } from "next-intl";

import type { PostResponse } from "@/lib/features/post";

import { NeighborCard } from "./neighbor-card";
import { useArticleNeighbors } from "./use-article-neighbors";

export function ArticleNeighbors({ article }: { article: PostResponse }) {
  const t = useTranslations("Article");
  const { isLoading, next, order, previous } = useArticleNeighbors(article);

  return (
    <section aria-label={t("keepReading")} className="mx-auto w-full max-w-3xl px-4 md:px-6">
      <header className="mb-4">
        <Typography type="h3" weight="semibold">
          {t("keepReading")}
        </Typography>
        <Typography className="mt-1" color="muted" type="body-sm">
          {order === "column" ? t("keepReadingColumnHint") : t("keepReadingHint")}
        </Typography>
      </header>
      <div className="grid items-stretch gap-4 sm:grid-cols-2">
        <NeighborCard direction="previous" isLoading={isLoading && !previous} neighbor={previous} />
        <NeighborCard direction="next" isLoading={isLoading && !next} neighbor={next} />
      </div>
    </section>
  );
}
