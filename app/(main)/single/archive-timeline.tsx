"use client";

import { Eye } from "@gravity-ui/icons";
import { useGSAP } from "@gsap/react";
import { EmptyState, Timeline } from "@heroui-pro/react";
import { Avatar, Link, Skeleton, Typography } from "@heroui/react";
import { useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ArchiveTimelinePost = {
  id?: number;
  title?: string | null;
  slug?: string | null;
  coverImage?: string | null;
  summary?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  views?: number;
  publishedAt?: string | null;
};

function getDisplayAuthor(value?: string | null) {
  const author = value?.trim();
  if (!author || /^(anonymous|john doe|jane doe)$/i.test(author)) return "Odyssey";
  return author;
}

function getInitials(value?: string | null) {
  return getDisplayAuthor(value)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getDate(value?: string | null) {
  if (!value) return { key: "recent", label: "Recently published" };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { key: "recent", label: "Recently published" };

  return {
    dateTime: date.toISOString(),
    key: date.toISOString().slice(0, 10),
    label: new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
  };
}

function getPostKey(post: ArchiveTimelinePost, index: number) {
  return `archive-${post.id ?? post.slug ?? "story"}-${index}`;
}

function MemoryStory({ post }: { post: ArchiveTimelinePost }) {
  const author = getDisplayAuthor(post.authorName);

  return (
    <article className="max-w-3xl py-2 sm:py-5">
      {post.coverImage ? (
        <figure
          data-memory-media
          className="bg-surface-secondary relative float-end ms-6 mb-5 aspect-[4/5] w-[38%] min-w-36 overflow-hidden rounded-2xl sm:ms-8 sm:mb-7 sm:min-w-44 lg:w-[32%]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            data-memory-image
            className="absolute start-0 -top-[10%] h-[120%] w-full max-w-none object-cover will-change-transform"
            loading="lazy"
            src={post.coverImage}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 border border-black/5 dark:border-white/10"
          />
        </figure>
      ) : null}
      <div data-memory-copy className="flex min-w-0 flex-col items-start gap-5">
        <Typography
          className="max-w-xl text-3xl leading-[1.08] sm:text-4xl"
          type="h3"
          weight="semibold"
        >
          {post.title || "Untitled story"}
        </Typography>

        {post.summary ? (
          <Typography className="max-w-xl text-base leading-7" color="muted">
            {post.summary}
          </Typography>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar size="sm" variant="soft">
              {post.authorAvatar ? <Avatar.Image alt={author} src={post.authorAvatar} /> : null}
              <Avatar.Fallback>{getInitials(post.authorName)}</Avatar.Fallback>
            </Avatar>
            <Typography truncate type="body-sm" weight="medium">
              {author}
            </Typography>
          </div>
          <Typography className="flex items-center gap-1 tabular-nums" color="muted" type="body-xs">
            <Eye aria-hidden="true" className="size-3.5" />
            {(post.views ?? 0).toLocaleString("en-US")}
          </Typography>
          <Link
            className="font-medium no-underline"
            href={post.slug ? `/single/${post.slug}` : "/single"}
          >
            Read Story
            <Link.Icon />
          </Link>
        </div>
      </div>
      <div className="clear-both" />
    </article>
  );
}

export function ArchiveTimeline({ posts }: { posts: ArchiveTimelinePost[] }) {
  const entries = useMemo(
    () => posts.map((post, index) => ({ key: getPostKey(post, index), post })),
    [posts]
  );
  const [activeKey, setActiveKey] = useState(entries[0]?.key ?? "");
  const archiveRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef(new Map<string, HTMLLIElement>());
  const activeIndex = entries.findIndex((entry) => entry.key === activeKey);

  useGSAP(
    () => {
      const memories = entries.flatMap((entry) => {
        const node = entryRefs.current.get(entry.key);
        return node ? [[entry.key, node] as const] : [];
      });
      if (!memories.length) return;

      const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!shouldReduceMotion) {
        for (const [, memory] of memories) {
          const copy = memory.querySelector<HTMLElement>("[data-memory-copy]");
          const media = memory.querySelector<HTMLElement>("[data-memory-media]");
          const image = memory.querySelector<HTMLElement>("[data-memory-image]");
          if (copy) gsap.set(copy, { autoAlpha: 0.18, y: 48 });
          if (media) gsap.set(media, { autoAlpha: 0.1, y: 72 });
          if (image) gsap.set(image, { yPercent: 8 });
        }
      }

      for (const [key, memory] of memories) {
        const activate = () =>
          setActiveKey((currentKey) => (currentKey === key ? currentKey : key));
        const copy = memory.querySelector<HTMLElement>("[data-memory-copy]");
        const media = memory.querySelector<HTMLElement>("[data-memory-media]");
        const image = memory.querySelector<HTMLElement>("[data-memory-image]");

        if (!shouldReduceMotion && copy) {
          const passage = gsap.timeline({
            scrollTrigger: {
              end: "bottom 8%",
              scrub: 0.55,
              start: "top 92%",
              trigger: memory,
            },
          });

          passage
            .to(copy, { autoAlpha: 1, duration: 0.42, ease: "none", y: 0 }, 0)
            .to(copy, { autoAlpha: 0.34, duration: 0.36, ease: "none", y: -28 }, 0.64);

          if (media) {
            passage
              .to(media, { autoAlpha: 0.92, duration: 0.5, ease: "none", y: 18 }, 0.04)
              .to(media, { autoAlpha: 0.2, duration: 0.34, ease: "none", y: -58 }, 0.62);
          }

          if (image) {
            gsap.to(image, {
              ease: "none",
              scrollTrigger: {
                end: "bottom top",
                scrub: 0.85,
                start: "top bottom",
                trigger: memory,
              },
              yPercent: -8,
            });
          }
        }

        ScrollTrigger.create({
          end: "bottom 42%",
          onEnter: activate,
          onEnterBack: activate,
          start: "top 58%",
          trigger: memory,
        });
      }
    },
    { dependencies: [entries], revertOnUpdate: true, scope: archiveRef }
  );

  useGSAP(
    () => {
      for (const [index, entry] of entries.entries()) {
        const memory = entryRefs.current.get(entry.key);
        if (!memory) continue;

        const marker = memory.querySelector<HTMLElement>("[data-slot='timeline-marker']");
        const connector = memory.querySelector<HTMLElement>("[data-slot='timeline-connector']");
        const isPast = index < activeIndex;
        const isCurrent = index === activeIndex;

        if (marker) {
          gsap.to(marker, {
            duration: 0.45,
            ease: "power2.out",
            opacity: isCurrent ? 1 : isPast ? 0.72 : 0.34,
            overwrite: "auto",
            scale: isCurrent ? 1.18 : 0.82,
          });
        }
        if (connector) {
          gsap.to(connector, {
            duration: 0.55,
            ease: "power1.out",
            opacity: isPast ? 0.9 : 0.24,
            overwrite: "auto",
          });
        }
      }
    },
    { dependencies: [activeIndex, entries], scope: archiveRef }
  );

  if (entries.length === 0) {
    return (
      <EmptyState size="lg">
        <EmptyState.Header>
          <EmptyState.Title>No stories in this period</EmptyState.Title>
          <EmptyState.Description>
            Choose another month or return to all dates to continue exploring.
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    );
  }

  return (
    <div ref={archiveRef} className="mx-auto w-full max-w-4xl">
      <Timeline aria-label="Archived stories" density="comfortable" itemAlign="start" size="sm">
        {entries.map((entry, index) => {
          const date = getDate(entry.post.publishedAt);
          const previousDate = index > 0 ? getDate(entries[index - 1].post.publishedAt) : null;
          const beginsDate = !previousDate || date.key !== previousDate.key;
          const isCurrent = entry.key === activeKey;

          return (
            <Timeline.Item
              key={entry.key}
              ref={(node) => {
                if (node) entryRefs.current.set(entry.key, node);
                else entryRefs.current.delete(entry.key);
              }}
              align="start"
              data-memory-entry={entry.key}
              status={isCurrent ? "current" : index < activeIndex ? "success" : "muted"}
            >
              <Timeline.Marker aria-hidden="true" />
              <Timeline.Content className="min-w-0 gap-4 pb-10 sm:gap-5 sm:pb-14">
                {beginsDate ? (
                  <time
                    className="text-muted text-xs font-medium tracking-wide tabular-nums"
                    dateTime={date.dateTime}
                  >
                    {date.label}
                  </time>
                ) : null}
                <MemoryStory post={entry.post} />
              </Timeline.Content>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </div>
  );
}

export function ArchiveTimelineSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading archived stories"
      className="mx-auto max-w-4xl"
      role="status"
    >
      <div className="border-separator space-y-14 border-s ps-8 sm:space-y-18">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="space-y-5">
            {index === 0 ? <Skeleton className="h-4 w-32 rounded-lg" /> : null}
            <Skeleton className="h-10 w-4/5 max-w-xl rounded-lg" />
            <Skeleton className="h-5 w-full max-w-xl rounded-lg" />
            <Skeleton className="h-5 w-2/3 max-w-xl rounded-lg" />
            <Skeleton className="h-8 w-48 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
