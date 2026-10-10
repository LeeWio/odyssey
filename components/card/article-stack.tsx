"use client";

import { Eye, ThumbsUp } from "@gravity-ui/icons";
import { Avatar, Button, Card, Separator, Surface, Typography } from "@heroui/react";
import { type Transition, useReducedMotion } from "motion/react";
import {
  type FocusEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ShaderBackground,
  type ShaderBackgroundProps,
} from "@/components/background/shader-background";
import { MotionCard } from "@/components/ui";
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

const STACK_PEEK = 11;
const STACK_INSET = 16;

const stackTransition = (
  reduce: boolean | null,
  expanded: boolean,
  index: number,
  count: number
): Transition =>
  reduce
    ? { duration: 0 }
    : {
        type: "spring",
        stiffness: 420,
        damping: 36,
        mass: 0.75,
        delay: expanded ? index * 0.035 : (count - 1 - index) * 0.02,
      };

export { stackTransition };
const WARP_SHAPES = ["checks", "stripes", "edge"] as const;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(randomBetween(38, 78));
  const lightness = Math.floor(randomBetween(28, 72));
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function randomWarp(): Extract<ShaderBackgroundProps, { variant: "warp" }> {
  const colorCount = 2 + Math.floor(Math.random() * 4);
  return {
    variant: "warp",
    colors: Array.from({ length: colorCount }, randomColor),
    proportion: randomBetween(0.15, 0.85),
    softness: randomBetween(0, 1),
    distortion: randomBetween(0.15, 0.85),
    swirl: randomBetween(0.35, 1),
    swirlIterations: Math.floor(randomBetween(4, 16)),
    shape: WARP_SHAPES[Math.floor(Math.random() * WARP_SHAPES.length)],
    shapeScale: randomBetween(0.08, 0.7),
    scale: randomBetween(0.6, 1.6),
    rotation: Math.floor(Math.random() * 360),
    speed: randomBetween(0.4, 1.6),
  };
}

function ArticleCover() {
  const [warp] = useState(randomWarp);

  return <ShaderBackground aria-hidden="true" className="absolute inset-0" {...warp} />;
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

function ArticleCardBody({ item }: { item: ArticleStackItem }) {
  return (
    <>
      <Card.Header className="flex-row items-start justify-between gap-4 p-0">
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
          className="relative isolate h-[4.5rem] w-[5.25rem] shrink-0 overflow-hidden rounded-xl p-0 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] sm:h-20 sm:w-24"
        >
          <ArticleCover />
        </Surface>
      </Card.Header>
      <Card.Footer className="flex items-center justify-between gap-3 p-0">
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
    </>
  );
}

export function ArticleStack({
  items,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onActivate,
  maxVisible = 3,
  expandLabel,
  collapseLabel,
  className,
}: {
  items: ArticleStackItem[];
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onActivate?: (item: ArticleStackItem) => void;
  maxVisible?: number;
  expandLabel: string;
  collapseLabel: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const hasFocus = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const pointerInside = useRef(false);
  const [faceHeight, setFaceHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useControllableExpanded({
    expanded,
    defaultExpanded,
    onExpandedChange,
  });

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, [setIsExpanded]);

  const visibleItems = items.slice(0, Math.max(1, maxVisible));
  const primaryItem = visibleItems[0];

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
      collapse();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isExpanded, collapse]);

  const cardTransition = (index: number) =>
    stackTransition(reduce, isExpanded, index, visibleItems.length);

  if (!primaryItem) return null;

  const open = () => setIsExpanded(true);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    hasFocus.current = false;
    if (!pointerInside.current) collapse();
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full max-w-md", className)}
      onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "mouse") return;
        pointerInside.current = true;
        open();
      }}
      onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "mouse") return;
        pointerInside.current = false;
        if (!hasFocus.current) collapse();
      }}
      onFocus={() => {
        hasFocus.current = true;
        open();
      }}
      onBlur={handleBlur}
    >
      <div aria-hidden="true" className="invisible" inert ref={faceRef}>
        <ArticleCardBody item={primaryItem} />
      </div>
      {isExpanded ? (
        visibleItems.slice(1).map((item) => (
          <div key={item.id} aria-hidden="true" className="invisible mt-2.5" inert>
            <ArticleCardBody item={item} />
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
            const isPrimary = index === 0;

            return (
              <MotionCard
                key={item.id}
                layout="position"
                initial={false}
                animate={{
                  y: isExpanded ? 0 : index * STACK_PEEK,
                  scale: isExpanded ? 1 : 1 - index * 0.012,
                  opacity: isExpanded ? 1 : 1 - index * 0.14,
                  clipPath: isExpanded
                    ? "inset(0px 0px round min(32px, var(--radius)))"
                    : `inset(0px ${index * STACK_INSET}px round min(32px, var(--radius)))`,
                }}
                transition={cardTransition(index)}
                className="border-separator bg-surface col-start-1 flex w-full origin-top flex-col gap-3.5 overflow-hidden rounded-[min(32px,var(--radius))] border px-4 py-3.5 shadow-[0_10px_24px_-18px_rgb(0_0_0/0.7)]"
                style={{
                  zIndex: visibleItems.length - index,
                  gridRow: isExpanded ? index + 1 : 1,
                  marginTop: isExpanded && index > 0 ? 10 : 0,
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Escape") return;
                  event.preventDefault();
                  collapse();
                }}
              >
                <ArticleCardBody item={item} />
                <Button
                  fullWidth
                  variant="ghost"
                  aria-expanded={isPrimary ? isExpanded : undefined}
                  aria-label={isPrimary ? (isExpanded ? collapseLabel : expandLabel) : item.title}
                  tabIndex={isPrimary || isExpanded ? 0 : -1}
                  className={cn(
                    "absolute inset-0 z-10 h-full min-h-0 rounded-[inherit] bg-transparent px-0 py-0 shadow-none data-[pressed=true]:scale-[0.985]",
                    !isPrimary && !isExpanded && "invisible"
                  )}
                  onPress={() => {
                    if (!isExpanded) {
                      open();
                      return;
                    }
                    onActivate?.(item);
                  }}
                />
              </MotionCard>
            );
          })}
        </span>
      </span>
    </div>
  );
}
