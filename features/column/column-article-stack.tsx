"use client";

import { Widget } from "@heroui-pro/react";
import { Chip, ScrollShadow } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";

import { ArticleStack, type ArticleStackItem } from "@/components/card/article-stack";
import { MotionSurface } from "@/components/ui";
import { stackTransition } from "@/lib/motion/article-stack";
import type { ColumnPost } from "@/lib/features/column";

function formatDate(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return { label: fallback, dateTime: undefined };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: fallback, dateTime: undefined };

  return {
    label: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date),
    dateTime: date.toISOString().slice(0, 10),
  };
}

export function ColumnArticleStack({ title, posts }: { title: string; posts: ColumnPost[] }) {
  const t = useTranslations("Columns");
  const locale = useLocale();
  const reduce = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const [shellHeight, setShellHeight] = useState<number | "auto">("auto");
  const shellTransition = stackTransition(reduce, expanded, 0, 1);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const measure = () => setShellHeight(shell.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);
  const items: ArticleStackItem[] = posts.map((post) => {
    const published = formatDate(post.publishedAt, locale, t("recently"));

    return {
      id: String(post.id),
      href: `/single/${post.slug}`,
      author: post.authorName || t("column"),
      title: post.title,
      date: published.label,
      dateTime: published.dateTime,
      views: post.views.toLocaleString(locale),
      likes: post.likesCount.toLocaleString(locale),
    };
  });

  return (
    <MotionSurface
      variant="transparent"
      animate={{ height: shellHeight }}
      className="relative w-full max-w-md bg-transparent p-0 shadow-none"
      initial={false}
      style={{ overflow: expanded ? "visible" : "hidden" }}
      transition={shellTransition}
    >
      <div ref={shellRef} className="absolute inset-x-0 top-0">
        <Widget className="w-full max-w-md">
          <Widget.Header>
            <Widget.Title>{title}</Widget.Title>
            <Chip
              size="sm"
              variant="soft"
              aria-label={t("articleCountLabel", { count: posts.length })}
              className="pointer-events-none h-6 min-w-6 justify-center px-1.5"
            >
              <Chip.Label>{posts.length.toLocaleString(locale)}</Chip.Label>
            </Chip>
          </Widget.Header>
          <Widget.Content className="relative overflow-hidden bg-transparent shadow-none">
            <ScrollShadow
              orientation="vertical"
              size={32}
              hideScrollBar
              className="max-h-[min(70vh,36rem)]"
            >
              <ArticleStack
                items={items}
                expanded={expanded}
                collapsedVisibleCount={3}
                onExpandedChange={setExpanded}
              />
            </ScrollShadow>
          </Widget.Content>
        </Widget>
      </div>
    </MotionSurface>
  );
}
