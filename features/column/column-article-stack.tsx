"use client";

import { Widget } from "@heroui-pro/react";
import { Chip, Separator, Surface } from "@heroui/react";
import { ChevronDown, Eye, ThumbsUp } from "@gravity-ui/icons";
import { useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useLayoutEffect, useRef, useState } from "react";

import {
  ArticleStack,
  stackTransition,
  type ArticleStackItem,
} from "@/components/card/article-stack";
import { MotionButton, MotionSurface } from "@/components/ui";
import type { ColumnPost } from "@/lib/features/column";
import { cn } from "@/lib/utils";

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
  const panelId = useId();
  const router = useRouter();
  const reduce = useReducedMotion();
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
  const items: ArticleStackItem[] = posts.slice(0, 3).map((post) => {
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

  const views = posts.reduce((sum, post) => sum + post.views, 0);
  const likes = posts.reduce((sum, post) => sum + post.likesCount, 0);

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
            <span className="flex h-6 shrink-0 items-center gap-1">
              <Chip
                size="sm"
                variant="soft"
                aria-label={t("articleCountLabel", { count: posts.length })}
                className="pointer-events-none h-6 min-w-6 justify-center px-1.5"
              >
                <Chip.Label>{posts.length.toLocaleString(locale)}</Chip.Label>
              </Chip>
              <MotionButton
                isIconOnly
                size="sm"
                variant="ghost"
                aria-expanded={expanded}
                aria-controls={panelId}
                aria-label={
                  expanded ? t("collapseArticles") : t("expandArticles", { count: posts.length })
                }
                className="size-6 min-h-6 min-w-6 rounded-full"
                animate={{ rotate: expanded ? 180 : 0 }}
                initial={false}
                transition={shellTransition}
                onPress={() => setExpanded((open) => !open)}
              >
                <ChevronDown aria-hidden="true" className="size-3.5" width={14} />
              </MotionButton>
            </span>
          </Widget.Header>
          <Widget.Content
            id={panelId}
            className="relative overflow-hidden bg-transparent shadow-none"
          >
            <ArticleStack
              items={items}
              expanded={expanded}
              expandLabel={t("expandArticles", { count: posts.length })}
              collapseLabel={t("collapseArticles")}
              onExpandedChange={setExpanded}
              onActivate={(item) => {
                if (item.href) router.push(item.href);
              }}
            />
            <Surface
              aria-hidden="true"
              variant="transparent"
              className={cn(
                "from-surface-secondary pointer-events-none absolute inset-x-0 bottom-0 z-20 h-3 bg-gradient-to-t p-0 shadow-none transition-opacity duration-200",
                expanded ? "opacity-0" : "opacity-100"
              )}
            />
          </Widget.Content>
          <Widget.Footer>
            <Chip color="accent" size="sm" variant="soft">
              <Eye width={12} />
              <Chip.Label>{t("viewsTotal", { count: views })}</Chip.Label>
            </Chip>
            <Separator className="h-3" orientation="vertical" />
            <Chip color="warning" size="sm" variant="soft">
              <ThumbsUp width={12} />
              <Chip.Label>{t("likesTotal", { count: likes })}</Chip.Label>
            </Chip>
          </Widget.Footer>
        </Widget>
      </div>
    </MotionSurface>
  );
}
