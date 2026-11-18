"use client";

import { ItemCard, Widget } from "@heroui-pro/react";
import { Chip, ScrollShadow } from "@heroui/react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { useLocale, useTranslations } from "next-intl";

import { EASE_OUT } from "@/lib/motion/ease";

import { ArticleCover } from "@/components/card/article-cover";

import type { PostResponse } from "@/lib/features/post";

import { formatReadingDate } from "./recommendation-record";
import { continueReadingRail, sameSubjectPosts } from "./recommendations";
import { useArticleNeighbors } from "./neighbors/use-article-neighbors";
import { useGetRelatedPostsQuery } from "@/lib/features/post";

const REVEAL_EASE = EASE_OUT;
const REVEAL_DURATION = 0.7;
const REVEAL_STAGGER = 0.105;

function revealFrom(index: number) {
  return index % 2 === 0
    ? { opacity: 0, x: -12, y: 24, scale: 0.97 }
    : { opacity: 0, x: 12, y: 18, scale: 0.97 };
}

export function useContinueReading(article: PostResponse) {
  const neighbors = useArticleNeighbors(article);
  const related = useGetRelatedPostsQuery(article.slug);
  const sameSubject = sameSubjectPosts(article, related.data);
  return {
    isLoading: neighbors.isLoading || related.isLoading,
    next: neighbors.next,
    order: neighbors.order,
    previous: neighbors.previous,
    rail: continueReadingRail(neighbors.next, sameSubject),
    sameSubject,
  };
}

/** Sticky continuation beside the article. Calls back once it knows whether the rail exists. */
export function ArticleContinue({
  article,
  onAvailability,
}: {
  article: PostResponse;
  onAvailability?: (available: boolean) => void;
}) {
  const t = useTranslations("Article");
  const locale = useLocale();
  const { isLoading, sameSubject } = useContinueReading(article);
  const items = sameSubject;
  const [playReveal] = useState(
    () =>
      typeof window === "undefined" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [revealReady, setRevealReady] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !playReveal) return;
    let frame = 0;
    const start = () => {
      const box = panel.getBoundingClientRect();
      const placed = box.left > window.innerWidth * 0.55 && box.width > 160;
      if (!placed) {
        frame = window.requestAnimationFrame(start);
        return;
      }
      setRevealReady(true);
    };
    frame = window.requestAnimationFrame(start);
    return () => window.cancelAnimationFrame(frame);
  }, [playReveal]);

  useEffect(() => {
    if (isLoading) return;
    onAvailability?.(items.length > 0);
  }, [isLoading, items.length, onAvailability]);

  return (
    <div ref={panelRef}>
      {items.length === 0 ? null : (
        <Widget className="max-h-[calc(100dvh-8rem)] w-full">
          <Widget.Header>
            <Widget.Title>You May Also Like</Widget.Title>
            <Chip aria-label={t("alsoLikeCount", { count: items.length })} size="sm" variant="soft">
              <Chip.Label>{items.length}</Chip.Label>
            </Chip>
          </Widget.Header>
          <Widget.Content className="p-2">
            <ScrollShadow
              className="max-h-[min(28rem,calc(100dvh-14rem))]"
              hideScrollBar
              orientation="vertical"
              size={40}
            >
              <div className="flex flex-col gap-1">
                {items.map((item, index) => (
                  <ItemCard
                    key={item.slug}
                    variant="transparent"
                    render={(props) => (
                      <motion.a
                        {...(props as ComponentProps<typeof motion.a>)}
                        href={`/single/${encodeURIComponent(item.slug)}`}
                        initial={false}
                        animate={
                          playReveal && !revealReady
                            ? revealFrom(index)
                            : { opacity: 1, x: 0, y: 0, scale: 1 }
                        }
                        transition={
                          playReveal && revealReady
                            ? {
                                delay: index * REVEAL_STAGGER,
                                duration: REVEAL_DURATION,
                                ease: [...REVEAL_EASE],
                              }
                            : { duration: 0 }
                        }
                      />
                    )}
                  >
                    {item.shaderPreset || item.coverImage ? (
                      <ItemCard.Icon className="relative overflow-hidden bg-transparent [&_canvas]:absolute [&_canvas]:inset-0 [&_canvas]:size-full">
                        {item.coverImage ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url("${item.coverImage}")` }}
                          />
                        ) : (
                          <ArticleCover
                            presetId={item.shaderPreset}
                            scheduled={false}
                            seed={item.slug}
                          />
                        )}
                      </ItemCard.Icon>
                    ) : (
                      <ItemCard.Icon>{null}</ItemCard.Icon>
                    )}
                    <ItemCard.Content>
                      <ItemCard.Title className="w-full whitespace-normal">
                        {item.title}
                      </ItemCard.Title>
                      <ItemCard.Description>
                        {formatReadingDate(item.publishedAt, locale)}
                      </ItemCard.Description>
                    </ItemCard.Content>
                  </ItemCard>
                ))}
              </div>
            </ScrollShadow>
          </Widget.Content>
        </Widget>
      )}
    </div>
  );
}
