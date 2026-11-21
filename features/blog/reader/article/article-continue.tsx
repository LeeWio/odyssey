"use client";

import { FileText } from "@gravity-ui/icons";
import { useMediaQuery } from "@mantine/hooks";
import { Widget } from "@heroui-pro/react";
import { Chip, Description, Label, ListBox, ScrollShadow } from "@heroui/react";
import { motion } from "motion/react";
import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { EASE_OUT } from "@/lib/motion/ease";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { ArticleCover } from "@/components/card/article-cover";

import type { PostResponse } from "@/lib/features/post";

import { useSameSubject } from "./use-same-subject";

const REVEAL_EASE = EASE_OUT;
const REVEAL_DURATION = 0.7;
const REVEAL_STAGGER = 0.105;

function revealFrom(index: number) {
  return index % 2 === 0
    ? { opacity: 0, x: -12, y: 24, scale: 0.97 }
    : { opacity: 0, x: 12, y: 18, scale: 0.97 };
}

/** Sticky continuation beside the article. Calls back once it knows whether the rail exists. */
export function ArticleContinue({
  article,
  isRailAvailable,
  onAvailability,
}: {
  article: PostResponse;
  isRailAvailable: boolean;
  onAvailability?: (available: boolean) => void;
}) {
  const t = useTranslations("Article");
  const titleId = useId();
  const showsRail = useMediaQuery("(min-width: 96rem)", false);
  const { isLoading, items } = useSameSubject(article, showsRail);
  const playReveal = !useReducedMotionPreference();
  const [revealReady, setRevealReady] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !playReveal || !isRailAvailable || revealReady) return;

    const revealIfVisible = () => {
      if (getComputedStyle(panel).visibility === "visible") setRevealReady(true);
    };

    const frame = window.requestAnimationFrame(revealIfVisible);
    window.addEventListener("resize", revealIfVisible);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", revealIfVisible);
    };
  }, [isRailAvailable, playReveal, revealReady]);

  useEffect(() => {
    if (showsRail && isLoading) return;
    onAvailability?.(showsRail && items.length > 0);
  }, [isLoading, items.length, onAvailability, showsRail]);

  return (
    <div ref={panelRef}>
      {items.length === 0 ? null : (
        <Widget className="max-h-[calc(100dvh-8rem)] w-full">
          <Widget.Header>
            <Widget.Title id={titleId}>{t("alsoLikeTitle")}</Widget.Title>
            <Chip aria-label={t("alsoLikeCount", { count: items.length })} size="sm" variant="soft">
              <Chip.Label>{items.length}</Chip.Label>
            </Chip>
          </Widget.Header>
          <Widget.Content>
            <ScrollShadow className="max-h-[min(28rem,calc(100dvh-14rem))]" hideScrollBar>
              <ListBox aria-labelledby={titleId} selectionMode="none">
                {items.map((item, index) => {
                  const summary = item.summary;
                  const showSummary =
                    summary &&
                    /\p{L}/u.test(summary) &&
                    summary.toLowerCase() !== item.title.trim().toLowerCase();
                  return (
                    <ListBox.Item
                      key={item.slug}
                      id={item.slug}
                      aria-label={item.title}
                      href={`/single/${encodeURIComponent(item.slug)}`}
                      textValue={item.title}
                      render={(props) => (
                        <motion.a
                          {...(props as ComponentProps<typeof motion.a>)}
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
                      <div
                        aria-hidden="true"
                        className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg [&_canvas]:absolute [&_canvas]:inset-0 [&_canvas]:size-full"
                      >
                        {item.coverImage ? (
                          <span
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url("${item.coverImage}")` }}
                          />
                        ) : item.shaderPreset ? (
                          <ArticleCover presetId={item.shaderPreset} seed={item.slug} />
                        ) : (
                          <FileText className="text-muted size-4" />
                        )}
                      </div>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <Label className="line-clamp-2 wrap-anywhere" elementType="span">
                          {item.title}
                        </Label>
                        {showSummary && (
                          <Description className="line-clamp-1">{summary}</Description>
                        )}
                      </span>
                    </ListBox.Item>
                  );
                })}
              </ListBox>
            </ScrollShadow>
          </Widget.Content>
        </Widget>
      )}
    </div>
  );
}
