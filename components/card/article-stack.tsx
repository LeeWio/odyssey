"use client";

import { Eye, ThumbsUp } from "@gravity-ui/icons";
import { Avatar, Button, Card, Separator, Surface, Typography } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  type KeyboardEvent,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ShaderBackground,
  type ShaderBackgroundProps,
} from "@/components/background/shader-background";
import { MotionCard } from "@/components/ui";
import { stackTransition } from "@/lib/motion/article-stack";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type ArticleStackItem = {
  id: string;
  href?: string;
  author: string;
  avatarUrl?: string;
  title: string;
  date: string;
  dateTime?: string;
  readTime?: string;
  views: string;
  likes: string;
};

const STACK_PEEK = 18;

export { stackTransition };
const WARP_SHAPES = ["checks", "stripes", "edge"] as const;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function warpForItem(id: string): Extract<ShaderBackgroundProps, { variant: "warp" }> {
  const seed = Array.from(id).reduce(
    (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619),
    2166136261
  );
  const random = seededRandom(seed);
  const between = (min: number, max: number) => min + random() * (max - min);
  const color = () => {
    const hue = Math.floor(random() * 360);
    const saturation = Math.floor(between(38, 68));
    const lightness = Math.floor(between(38, 62));
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };
  const colorCount = 2 + Math.floor(random() * 2);
  return {
    variant: "warp",
    colors: Array.from({ length: colorCount }, color),
    proportion: between(0.3, 0.7),
    softness: between(0.35, 0.8),
    distortion: between(0.2, 0.55),
    swirl: between(0.35, 0.7),
    swirlIterations: Math.floor(between(5, 10)),
    shape: WARP_SHAPES[Math.floor(random() * WARP_SHAPES.length)],
    shapeScale: between(0.18, 0.5),
    scale: between(0.8, 1.3),
    rotation: Math.floor(random() * 360),
    speed: between(0.25, 0.65),
  };
}

function ArticleCover({ itemId, animated = true }: { itemId: string; animated?: boolean }) {
  const warp = useMemo(() => warpForItem(itemId), [itemId]);
  return (
    <ShaderBackground
      aria-hidden="true"
      className="absolute inset-0"
      {...warp}
      speed={animated ? warp.speed : 0}
    />
  );
}

function useControllableExpanded({
  expanded,
  defaultExpanded,
  onExpandedChange,
}: {
  expanded?: boolean;
  defaultExpanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = expanded !== undefined;
  const value = expanded ?? internalExpanded;

  const setValue = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalExpanded(next);
      onExpandedChange?.(next);
    },
    [isControlled, onExpandedChange]
  );

  return [value, setValue] as const;
}

function ArticleCardFace({
  item,
  children,
  showCover = true,
  animatedCover = true,
  ...props
}: {
  item: ArticleStackItem;
  children?: ReactNode;
  showCover?: boolean;
  animatedCover?: boolean;
} & Omit<ComponentProps<typeof MotionCard>, "children">) {
  return (
    <MotionCard {...props}>
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="size-7" size="sm">
              {item.avatarUrl ? <Avatar.Image alt="" src={item.avatarUrl} /> : null}
              <Avatar.Fallback className="text-[10px]">
                {item.author.slice(0, 1).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
            <Typography truncate type="body-sm" weight="medium">
              {item.author}
            </Typography>
          </div>
          <Card.Title className="line-clamp-2 text-[1.05rem] leading-snug text-balance">
            {item.title}
          </Card.Title>
        </div>
        <Surface
          variant="transparent"
          className="relative isolate h-18 w-24 shrink-0 overflow-hidden rounded-2xl shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] sm:h-20 sm:w-32"
        >
          {showCover ? <ArticleCover animated={animatedCover} itemId={item.id} /> : null}
        </Surface>
      </Card.Header>
      <Card.Footer className="flex items-center justify-between gap-3">
        <Typography className="flex min-w-0 items-center gap-1.5" color="muted" type="body-xs">
          {item.dateTime ? (
            <time dateTime={item.dateTime}>{item.date}</time>
          ) : (
            <span>{item.date}</span>
          )}
          {item.readTime ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{item.readTime}</span>
            </>
          ) : null}
        </Typography>
        <div className="text-muted flex shrink-0 items-center gap-2.5 text-xs tabular-nums">
          <Typography className="inline-flex items-center gap-1" color="muted" type="body-xs">
            <Eye aria-hidden="true" width={14} />
            {item.views}
          </Typography>
          <Separator className="h-3" orientation="vertical" />
          <Typography className="text-warning inline-flex items-center gap-1" type="body-xs">
            <ThumbsUp aria-hidden="true" width={14} />
            {item.likes}
          </Typography>
        </div>
      </Card.Footer>
      {children}
    </MotionCard>
  );
}

export function ArticleStack({
  items,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onActivate,
  collapsedVisibleCount = 3,
  className,
}: {
  items: ArticleStackItem[];
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onActivate?: (item: ArticleStackItem) => void;
  collapsedVisibleCount?: number;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFocus = useRef(false);
  const pointerInside = useRef(false);
  const lastPointerType = useRef<string | null>(null);
  const expandedAtPointerDown = useRef(false);
  const [faceHeight, setFaceHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useControllableExpanded({
    expanded,
    defaultExpanded,
    onExpandedChange,
  });

  const primaryItem = items[0];
  const visibleItems = isExpanded ? items : items.slice(0, Math.max(1, collapsedVisibleCount));

  const collapse = useCallback(() => setIsExpanded(false), [setIsExpanded]);
  const clearHoverTimer = useCallback(() => {
    if (!hoverTimerRef.current) return;
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  }, []);
  const scheduleExpanded = useCallback(
    (next: boolean, delay: number) => {
      clearHoverTimer();
      hoverTimerRef.current = setTimeout(() => {
        setIsExpanded(next);
        hoverTimerRef.current = null;
      }, delay);
    },
    [clearHoverTimer, setIsExpanded]
  );

  useEffect(() => {
    return clearHoverTimer;
  }, [clearHoverTimer]);

  useEffect(() => {
    const face = faceRef.current;
    if (!face) return;

    const measure = () => setFaceHeight(face.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(face);
    return () => observer.disconnect();
  }, [primaryItem]);

  useEffect(() => {
    if (!isExpanded) return;

    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      clearHoverTimer();
      collapse();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isExpanded, clearHoverTimer, collapse]);

  const cardTransition = (index: number) =>
    stackTransition(reduce, isExpanded, index, visibleItems.length);

  if (!primaryItem) return null;

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full max-w-md", className)}
      onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "mouse") return;
        pointerInside.current = true;
        scheduleExpanded(true, 100);
      }}
      onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "mouse") return;
        pointerInside.current = false;
        if (!hasFocus.current) scheduleExpanded(false, 150);
      }}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        lastPointerType.current = event.pointerType;
        expandedAtPointerDown.current = isExpanded;
      }}
      onFocus={() => {
        clearHoverTimer();
        hasFocus.current = true;
        setIsExpanded(true);
      }}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        hasFocus.current = false;
        if (!pointerInside.current) scheduleExpanded(false, 150);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearHoverTimer();
        setIsExpanded(false);
      }}
    >
      <div aria-hidden="true" className="invisible" inert ref={faceRef}>
        <ArticleCardFace item={primaryItem} showCover={false} />
      </div>
      {isExpanded ? (
        items.slice(1).map((item) => (
          <div key={item.id} aria-hidden="true" className="invisible mt-2.5" inert>
            <ArticleCardFace item={item} showCover={false} />
          </div>
        ))
      ) : visibleItems.length > 1 && faceHeight > 0 ? (
        <div aria-hidden="true" style={{ height: (visibleItems.length - 1) * STACK_PEEK }} />
      ) : null}

      <span
        className="absolute inset-x-0 top-0 block overflow-hidden"
        style={{
          height:
            visibleItems.length < 2 || faceHeight === 0
              ? "100%"
              : isExpanded
                ? "100%"
                : faceHeight + (visibleItems.length - 1) * STACK_PEEK,
        }}
      >
        <span className="relative grid w-full">
          {visibleItems.map((item, index) => {
            return (
              <ArticleCardFace
                key={item.id}
                item={item}
                animatedCover={isExpanded ? index < 3 : index === 0}
                layout="position"
                initial={false}
                animate={{
                  y: isExpanded ? 0 : index * STACK_PEEK,
                  scale: isExpanded ? 1 : 1 - index * 0.035,
                }}
                transition={cardTransition(index)}
                className={cn(
                  "relative col-start-1 w-full origin-top overflow-hidden shadow-none",
                  !isExpanded && index > 0 && "opacity-80"
                )}
                style={{
                  zIndex: visibleItems.length - index,
                  gridRow: isExpanded ? index + 1 : 1,
                  marginTop: isExpanded && index > 0 ? 10 : 0,
                }}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    prefetch={false}
                    aria-label={item.title}
                    className={cn(
                      "focus-visible:ring-accent absolute inset-0 z-10 cursor-[var(--cursor-interactive)] rounded-[inherit] focus-visible:ring-2 focus-visible:ring-inset",
                      !isExpanded && index > 0 && "hidden"
                    )}
                    onClick={(event) => {
                      if (
                        event.detail > 0 &&
                        lastPointerType.current === "touch" &&
                        !expandedAtPointerDown.current
                      ) {
                        event.preventDefault();
                        setIsExpanded(true);
                      }
                      lastPointerType.current = null;
                    }}
                  />
                ) : onActivate ? (
                  <Button
                    fullWidth
                    variant="ghost"
                    aria-label={item.title}
                    className={cn(
                      "absolute inset-0 z-10 h-full min-h-0 rounded-[inherit] bg-transparent shadow-none",
                      !isExpanded && index > 0 && "hidden"
                    )}
                    onPress={() => {
                      if (lastPointerType.current === "touch" && !expandedAtPointerDown.current) {
                        setIsExpanded(true);
                      } else {
                        onActivate(item);
                      }
                      lastPointerType.current = null;
                    }}
                  />
                ) : null}
              </ArticleCardFace>
            );
          })}
        </span>
      </span>
    </div>
  );
}
