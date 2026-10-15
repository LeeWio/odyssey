"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Skeleton } from "@heroui/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { ActionBar } from "@/features/blog/reader/article-actions";
import { ArticleHeader } from "@/features/blog/reader/article-header";
import { ArticleOutline } from "@/features/blog/reader/article-outline";
import { type PostResponse, useGetPublicPostBySlugQuery } from "@/lib/features/post";

const ArticleBodyReader = dynamic(
  () =>
    import("@/features/blog/reader/article-body-reader").then((mod) => ({
      default: mod.ArticleBodyReader,
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

  return (
    <div className="bg-background relative isolate min-h-[100dvh] overflow-x-clip">
      <PageContainer className="relative z-10 px-0 pb-24 md:px-0 xl:px-0">
        <article className="w-full min-w-0" data-reading-content>
          {isLoading || !article ? (
            <div
              aria-busy="true"
              aria-label={t("loading")}
              className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 md:px-6 xl:px-8"
            >
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-11/12 rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </div>
          ) : (
            <>
              <ArticleHeader article={article} />
              <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-4 md:px-6 xl:grid-cols-[minmax(0,48rem)_14rem] xl:justify-center xl:px-8">
                <div className="min-w-0">
                  <ArticleBodyReader
                    content={article.content}
                    contentKey={article.content}
                    contentType={article.contentType}
                    outlineLabel={t("onThisPage")}
                    outlineRail={<ArticleOutline label={t("onThisPage")} variant="rail" />}
                    showTableOfContents={false}
                  />
                </div>
                <aside
                  aria-label={t("onThisPage")}
                  className="sticky top-28 hidden min-h-px xl:block"
                  id="article-outline-rail"
                />
              </div>
            </>
          )}
          <div ref={articleEndRef} aria-hidden="true" data-article-end />
        </article>
        {article ? (
          <ActionBar article={article} articleEndRef={articleEndRef} isRefreshing={isFetching} />
        ) : null}
      </PageContainer>
    </div>
  );
}
