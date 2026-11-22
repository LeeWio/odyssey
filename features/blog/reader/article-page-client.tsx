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
import { articleHasContext } from "@/features/blog/reader/article/article-sidebar";
import { type PostResponse, useGetPublicPostBySlugQuery } from "@/lib/features/post";

import { selectIsAuthenticated } from "@/lib/features/auth";
import { useAppSelector } from "@/lib/hooks";
import { getReadingPositionId } from "@/lib/reading-position";
import { READING_SCROLL_KEY, readingScrollOffset } from "@/lib/reading-scroll";

interface SinglePageProps {
  initialArticle: PostResponse;
  body: ReactNode;
  outline: ArticleOutline | null;
  readingMinutes: number | null;
  slug: string;
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
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      clearTimeout(timer);
      timer = undefined;
      try {
        sessionStorage.setItem(
          READING_SCROLL_KEY,
          JSON.stringify({ path, y: Math.max(0, readingScrollOffset()) })
        );
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
    if (id) scrollReadingAnchorIntoView(id);
  }, [slug]);

  return (
    <ArticleOutlineProvider initialOutline={outline} initialMinutes={readingMinutes}>
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
        context={<ArticleSidebar key={article.id} article={article} placement="rail" />}
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
        trackProgress={isAuthenticated}
      />
    </ArticleOutlineProvider>
  );
}
