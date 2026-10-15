"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Skeleton } from "@heroui/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import {
  ArticleActionBar,
  ArticleHero,
  ArticleLayout,
  ArticleToc,
} from "@/features/blog/reader/article";
import { type PostResponse, useGetPublicPostBySlugQuery } from "@/lib/features/post";

const ArticleBody = dynamic(
  () =>
    import("@/features/blog/reader/article/article-body").then((mod) => ({
      default: mod.ArticleBody,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-3 py-6" aria-hidden>
        <Skeleton className="h-4 w-11/12 rounded" />
        <Skeleton className="h-4 w-10/12 rounded" />
        <Skeleton className="h-4 w-9/12 rounded" />
        <Skeleton className="h-4 w-8/12 rounded" />
      </div>
    ),
  }
);

interface SinglePageProps {
  initialArticle: PostResponse | null;
  slug: string;
}

export default function SinglePage({ initialArticle, slug }: SinglePageProps) {
  const t = useTranslations("Article");
  const router = useRouter();
  const articleEndRef = useRef<HTMLDivElement>(null);
  const {
    currentData: fetchedArticle,
    isFetching,
    isUninitialized,
  } = useGetPublicPostBySlugQuery(slug);
  const article = fetchedArticle ?? initialArticle;

  const isLoading = (isFetching || isUninitialized) && !article;
  const isUnavailable = !isLoading && !article;

  if (isUnavailable) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center px-6">
        <EmptyState className="max-w-md">
          <EmptyState.Header>
            <EmptyState.Title>{t("notFoundTitle")}</EmptyState.Title>
            <EmptyState.Description>{t("notFoundDescription")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button size="sm" variant="secondary" onPress={() => router.push("/single")}>
              {t("backToJournal")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      </div>
    );
  }

  if (isLoading || !article) {
    return (
      <div
        aria-busy="true"
        aria-label={t("loading")}
        className="mx-auto flex min-h-[70dvh] w-full max-w-6xl flex-col gap-3 px-4 py-6 md:px-6 xl:px-8"
      >
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-11/12 rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
      </div>
    );
  }

  return (
    <>
      <ArticleLayout
        body={
          <ArticleBody
            content={article.content}
            contentKey={article.content}
            contentType={article.contentType}
            outlineLabel={t("onThisPage")}
            outlineRail={<ArticleToc label={t("onThisPage")} variant="rail" />}
            showTableOfContents={false}
          />
        }
        endRef={articleEndRef}
        hero={<ArticleHero article={article} />}
        label={t("onThisPage")}
      />
      <ArticleActionBar article={article} articleEndRef={articleEndRef} isRefreshing={isFetching} />
    </>
  );
}
