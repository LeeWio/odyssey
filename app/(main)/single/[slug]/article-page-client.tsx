"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  ArticleActionBar,
  ArticleBody,
  ArticleContinue,
  ArticleFooter,
  ArticleHero,
  ArticleLayout,
  ArticleOutlineProvider,
  ArticleSidebar,
} from "@/features/blog/reader/article";
import { scrollReadingAnchorIntoView } from "@/features/blog/reader/article/reading-anchor";
import { useReadingProgress } from "@/features/blog/reader/article/use-reading-progress";
import { articleHasContext } from "@/features/blog/reader/article/article-sidebar";
import { type PostResponse, useGetPublicPostBySlugQuery } from "@/lib/features/post";

import { selectIsAuthenticated } from "@/lib/features/auth";
import { useAppSelector } from "@/lib/hooks";

const READING_SCROLL_KEY = "odyssey-reading-scroll";

function savedReadingScroll(path: string) {
  const navigation = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  if (navigation?.type !== "reload") return null;
  const raw = sessionStorage.getItem(READING_SCROLL_KEY);
  if (!raw) return null;
  const saved = JSON.parse(raw) as { path?: string; y?: number };
  if (saved.path !== path || typeof saved.y !== "number") return null;
  return saved.y;
}

interface SinglePageProps {
  initialArticle: PostResponse;
  readingHtml: string;
  slug: string;
}

export default function SinglePage({ initialArticle, readingHtml, slug }: SinglePageProps) {
  const t = useTranslations("Article");
  const router = useRouter();
  const articleEndRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    let frame = 0;
    const remember = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        sessionStorage.setItem(READING_SCROLL_KEY, JSON.stringify({ path, y: window.scrollY }));
      });
    };
    remember();
    window.addEventListener("scroll", remember, { passive: true });
    window.addEventListener("pagehide", remember);
    window.addEventListener("beforeunload", remember);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", remember);
      window.removeEventListener("pagehide", remember);
      window.removeEventListener("beforeunload", remember);
    };
  }, []);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const {
    currentData: fetchedArticle,
    isError,
    isFetching,
    refetch,
  } = useGetPublicPostBySlugQuery(slug, {
    // Anonymous visitors already have the public article. Signed-in visitors
    // need one credentialed request for like, favorite, and reading-list state.
    skip: !isAuthenticated,
  });
  const article = fetchedArticle ?? initialArticle;
  const [continueSlug, setContinueSlug] = useState(article?.slug);
  if (article?.slug !== continueSlug) {
    setContinueSlug(article?.slug);
    setShowContinue(false);
  }

  useLayoutEffect(() => {
    if (!article) return;
    const hash = window.location.hash.slice(1);
    if (hash) {
      const id = decodeURIComponent(hash);
      let attempts = 0;
      let frame = 0;
      const place = () => {
        attempts += 1;
        if (scrollReadingAnchorIntoView(id) || attempts > 20) return;
        frame = window.requestAnimationFrame(place);
      };
      place();
      return () => window.cancelAnimationFrame(frame);
    }
    const y = savedReadingScroll(window.location.pathname);
    if (y === null) return;
    const scroller = document.scrollingElement ?? document.documentElement;
    if (!(scroller instanceof HTMLElement)) return;
    if (scroller.scrollHeight - scroller.clientHeight + 1 < y) {
      scroller.style.minHeight = `${y + scroller.clientHeight}px`;
    }
    window.scrollTo(0, y);
    return () => {
      scroller.style.minHeight = "";
    };
  }, [article]);

  useReadingProgress({
    enabled: isAuthenticated && Boolean(article),
    postId: article?.id ?? 0,
    progress: readingProgress,
  });
  const isUnavailable = !article;

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

  if (!article) return null;

  return (
    <ArticleOutlineProvider>
      <ArticleLayout
        body={
          <ArticleBody
            content={article.content}
            contentKey={`${article.id}:${article.updatedAt}`}
            contentType={article.contentType}
            outlineLabel={t("onThisPage")}
            readingHtml={article.id === initialArticle.id ? readingHtml : undefined}
            showTableOfContents={false}
          />
        }
        continueAside={
          <ArticleContinue
            key={article.id}
            article={article}
            isRailAvailable={showContinue}
            onAvailability={setShowContinue}
          />
        }
        continueLabel={t("continueReading")}
        context={<ArticleSidebar article={article} />}
        showContext={articleHasContext(article)}
        showContinue={showContinue}
        endRef={articleEndRef}
        footer={<ArticleFooter article={article} />}
        hero={<ArticleHero article={article} />}
        label={t("onThisPage")}
      />
      <ArticleActionBar
        article={article}
        articleEndRef={articleEndRef}
        isRefreshing={isFetching}
        onProgress={setReadingProgress}
      />
    </ArticleOutlineProvider>
  );
}
