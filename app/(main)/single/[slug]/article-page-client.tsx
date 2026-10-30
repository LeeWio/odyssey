"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Skeleton } from "@heroui/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import {
  ArticleActionBar,
  ArticleFooter,
  ArticleHero,
  ArticleLayout,
  ArticleOutlineScope,
  ArticleSidebar,
} from "@/features/blog/reader/article";
import { articleHasContext } from "@/features/blog/reader/article/article-sidebar";
import { type PostResponse, useGetPublicPostBySlugQuery } from "@/lib/features/post";
import { recordPublicVisit } from "@/lib/features/post/record-public-visit";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { useAppSelector } from "@/lib/hooks";

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
  initialArticle: PostResponse;
  slug: string;
}

export default function SinglePage({ initialArticle, slug }: SinglePageProps) {
  const t = useTranslations("Article");
  const router = useRouter();
  const articleEndRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const {
    currentData: fetchedArticle,
    isError,
    isFetching,
    isUninitialized,
    refetch,
  } = useGetPublicPostBySlugQuery(slug, {
    // Anonymous visitors already have the public article. Signed-in visitors
    // need one credentialed request for like, favorite, and reading-list state.
    skip: !isAuthenticated,
  });
  const article = fetchedArticle ?? initialArticle;

  useEffect(() => {
    if (isAuthenticated) return;
    recordPublicVisit(`/api/v1/public/blog/posts/${encodeURIComponent(slug)}`);
  }, [isAuthenticated, slug]);

  const isLoading = isAuthenticated && (isFetching || isUninitialized) && !article;
  const isUnavailable = !isLoading && !article;

  if (isError && !fetchedArticle) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center px-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold">{t("loadFailedTitle")}</h1>
          <p className="text-muted text-sm">{t("loadFailedDescription")}</p>
          <Button size="sm" variant="secondary" onPress={() => refetch()}>
            {t("tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

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
    <ArticleOutlineScope>
      <ArticleLayout
        body={
          <ArticleBody
            content={article.content}
            contentKey={`${article.id}:${article.updatedAt}`}
            contentType={article.contentType}
            outlineLabel={t("onThisPage")}
            showTableOfContents={false}
          />
        }
        context={<ArticleSidebar article={article} />}
        showContext={articleHasContext(article)}
        endRef={articleEndRef}
        footer={<ArticleFooter article={article} />}
        hero={<ArticleHero article={article} />}
        label={t("onThisPage")}
      />
      <ArticleActionBar article={article} articleEndRef={articleEndRef} isRefreshing={isFetching} />
    </ArticleOutlineScope>
  );
}
