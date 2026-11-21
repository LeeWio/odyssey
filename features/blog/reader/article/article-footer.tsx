"use client";

import { Link, Skeleton } from "@heroui/react";
import { useTranslations } from "next-intl";

import type { PostResponse } from "@/lib/features/post";
import { useNearViewport } from "@/hooks/use-near-viewport";

import { articleHasContext, ArticleSidebar } from "./article-sidebar";
import { ArticleNeighbors } from "./neighbors";
import { RecommendationRecord } from "./recommendation-record";
import { SAME_SUBJECT_LIMIT } from "./recommendations";
import { useSameSubject } from "./use-same-subject";

export function ArticleFooter({ article }: { article: PostResponse }) {
  const t = useTranslations("Article");
  const { ref, isNear } = useNearViewport<HTMLDivElement>();
  const { items: sameSubject, isLoading } = useSameSubject(article, isNear);

  return (
    <div ref={ref} className="mt-20 flex flex-col gap-16">
      <ArticleNeighbors article={article} enabled={isNear} />

      <section
        aria-busy={isLoading}
        aria-labelledby="article-same-subject"
        className="mx-auto w-full max-w-3xl"
      >
        <div className="mb-2 max-w-2xl">
          <h2 className="text-xl font-semibold" id="article-same-subject">
            {t("sameSubject")}
          </h2>
          <p className="text-muted mt-1 text-sm">{t("sameSubjectHint")}</p>
        </div>
        {isLoading ? (
          <Skeleton aria-hidden className="h-20 w-full" />
        ) : sameSubject.length > 0 ? (
          <div className="flex flex-col">
            {sameSubject.slice(0, SAME_SUBJECT_LIMIT).map((post) => (
              <RecommendationRecord
                key={post.slug}
                date={post.publishedAt}
                href={`/single/${encodeURIComponent(post.slug)}`}
                relation={
                  "category" in post.relation
                    ? t("sharedCategory", { name: post.relation.category })
                    : t("sameSubject")
                }
                summary={post.summary}
                title={post.title}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted border-t border-current/10 py-6 text-sm">
            {t("nothingNearby")} <Link href="/single">{t("backToJournal")}</Link>
          </p>
        )}
      </section>

      {articleHasContext(article) ? (
        <section className="mx-auto w-full max-w-3xl border-t border-current/10 pt-6 xl:sr-only">
          <ArticleSidebar article={article} />
        </section>
      ) : null}
    </div>
  );
}
