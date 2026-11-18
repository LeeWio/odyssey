"use client";

import { Link } from "@heroui/react";
import { useTranslations } from "next-intl";

import type { PostResponse } from "@/lib/features/post";

import { articleHasContext, ArticleSidebar } from "./article-sidebar";
import { ArticleNeighbors } from "./neighbors";
import { RecommendationRecord } from "./recommendation-record";
import { SAME_SUBJECT_LIMIT } from "./recommendations";
import { useContinueReading } from "./article-continue";

export function ArticleFooter({ article }: { article: PostResponse }) {
  const t = useTranslations("Article");
  const { sameSubject } = useContinueReading(article);

  return (
    <div className="mt-20 flex flex-col gap-16">
      <ArticleNeighbors article={article} />

      <section aria-labelledby="article-same-subject" className="mx-auto w-full max-w-3xl">
        <div className="mb-2 max-w-2xl">
          <h2 className="text-xl font-semibold" id="article-same-subject">
            {t("sameSubject")}
          </h2>
          <p className="text-muted mt-1 text-sm">{t("sameSubjectHint")}</p>
        </div>
        {sameSubject.length > 0 ? (
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
