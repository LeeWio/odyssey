"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { ARTICLE_OUTLINE_TOP_OFFSET, readingScrollOffset } from "@/lib/reading-scroll";

export interface ArticleHeading {
  id: string;
  level: number;
  textContent: string;
  dom?: HTMLElement;
}

export interface ArticleOutline {
  items: readonly ArticleHeading[];
  label: string;
}

const ArticleOutlineContext = createContext<ArticleOutline | null>(null);
const SetArticleOutlineContext = createContext<(outline: ArticleOutline | null) => void>(() => {});
const ArticleReadingMinutesContext = createContext<number | null>(null);
const SetArticleReadingMinutesContext = createContext<(minutes: number | null) => void>(() => {});

export function ArticleOutlineProvider({
  children,
  initialOutline = null,
  initialMinutes = null,
}: {
  children: ReactNode;
  initialOutline?: ArticleOutline | null;
  initialMinutes?: number | null;
}) {
  const [outline, setOutline] = useState<ArticleOutline | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);

  return (
    <SetArticleReadingMinutesContext value={setMinutes}>
      <ArticleReadingMinutesContext value={initialMinutes ?? minutes}>
        <SetArticleOutlineContext value={setOutline}>
          <ArticleOutlineContext value={initialOutline ?? outline}>
            {children}
          </ArticleOutlineContext>
        </SetArticleOutlineContext>
      </ArticleReadingMinutesContext>
    </SetArticleReadingMinutesContext>
  );
}

export function useArticleReadingMinutes() {
  return use(ArticleReadingMinutesContext);
}

export function useArticleOutline() {
  return use(ArticleOutlineContext);
}

export function useArticleReadingMinutesPublisher() {
  return use(SetArticleReadingMinutesContext);
}

export function useArticleOutlinePublisher() {
  return use(SetArticleOutlineContext);
}

export function currentHeadingId(items: readonly ArticleHeading[]) {
  const position = readingScrollOffset() + ARTICLE_OUTLINE_TOP_OFFSET;
  let activeId = items[0]?.id ?? "";

  for (const item of items) {
    const heading = document.getElementById(item.id) ?? item.dom;
    if (!heading) continue;
    const top = heading.getBoundingClientRect().top + readingScrollOffset();
    if (position >= top) activeId = item.id;
  }

  return activeId;
}

export function headingElement(item: ArticleHeading) {
  const heading = document.getElementById(item.id) ?? item.dom;
  if (!heading) return null;
  heading.setAttribute("tabindex", "-1");
  return heading;
}

export function writeHeadingHash(item: ArticleHeading) {
  if (window.history.pushState) {
    window.history.pushState(null, "", `#${encodeURIComponent(item.id)}`);
  }
}
