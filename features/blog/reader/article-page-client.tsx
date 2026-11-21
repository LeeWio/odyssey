"use client";

import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import {
  ArticleActionBar,
  ArticleContinue,
  ArticleFooter,
  ArticleHero,
  ArticleLayout,
  ArticleOutlineProvider,
  ArticleSidebar,
} from "@/features/blog/reader/article";
import type { ArticleOutline } from "@/features/blog/reader/article/article-outline";
import { scrollReadingAnchorIntoView } from "@/features/blog/reader/article/reading-anchor";
import { useReadingProgress } from "@/features/blog/reader/article/use-reading-progress";
import { articleHasContext } from "@/features/blog/reader/article/article-sidebar";
import { type PostResponse, useGetPublicPostBySlugQuery } from "@/lib/features/post";

import { selectIsAuthenticated } from "@/lib/features/auth";
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionId } from "@/lib/reading-position";

const READING_SCROLL_KEY = "odyssey-reading-scroll";

function savedReadingScroll(path: string) {
  const navigation = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  if (navigation?.type !== "reload") return null;
  try {
    const raw = sessionStorage.getItem(READING_SCROLL_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { path?: string; y?: number };
    return saved.path === path && Number.isFinite(saved.y) ? (saved.y ?? null) : null;
  } catch {
    return null;
  }
}

interface SinglePageProps {
  initialArticle: PostResponse;
  body: ReactNode;
  outline: ArticleOutline | null;
  readingMinutes: number | null;
  slug: string;
}

function ReadingProgressTracker({
  enabled,
  postId,
  progress,
}: {
  enabled: boolean;
  postId: number;
  progress: number;
}) {
  useReadingProgress({ enabled, postId, progress });
  return null;
}

export function ArticlePageClient({
  initialArticle,
  body,
  outline,
  readingMinutes,
  slug,
}: SinglePageProps) {
  const t = useTranslations("Article");
  const articleEndRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      clearTimeout(timer);
      timer = undefined;
      try {
        sessionStorage.setItem(READING_SCROLL_KEY, JSON.stringify({ path, y: window.scrollY }));
      } catch {}
    };
    const remember = () => {
      timer ??= setTimeout(save, 250);
    };
    remember();
    window.addEventListener("scroll", remember, { passive: true });
    window.addEventListener("pagehide", save);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", remember);
      window.removeEventListener("pagehide", save);
    };
  }, [slug]);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { currentData: fetchedArticle, isFetching } = useGetPublicPostBySlugQuery(slug, {
    // Anonymous visitors already have the public article. Signed-in visitors
    // need one credentialed request for like, favorite, and reading-list state.
    skip: !isAuthenticated,
  });
  const viewer = isAuthenticated ? fetchedArticle : undefined;
  const article = viewer
    ? {
        ...initialArticle,
        isLiked: viewer.isLiked,
        isFavorited: viewer.isFavorited,
        isInReadingList: viewer.isInReadingList,
        likesCount: viewer.likesCount,
        favoritesCount: viewer.favoritesCount,
      }
    : initialArticle;
  const [continueSlug, setContinueSlug] = useState(slug);
  if (slug !== continueSlug) {
    setContinueSlug(slug);
    setShowContinue(false);
  }

  useLayoutEffect(() => {
    const id = getReadingPositionId(window.location.hash);
    if (id) {
      scrollReadingAnchorIntoView(id);
      return;
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
  }, [slug]);

  return (
    <ArticleOutlineProvider initialOutline={outline} initialMinutes={readingMinutes}>
      <ReadingProgressTracker
        enabled={isAuthenticated}
        postId={article.id}
        progress={readingProgress}
      />
      <ArticleLayout
        body={body}
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
        footer={<ArticleFooter key={article.id} article={article} />}
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
