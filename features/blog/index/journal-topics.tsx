"use client";

import { Card, Link, Separator, Skeleton, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { use } from "react";

import { useGetPublicPostDigestsQuery } from "@/lib/features/post";
import type { JournalReadingPick } from "@/lib/features/post/server";

import { JournalReadingCard } from "./journal-reading-card";

import { journalStoryHref, journalStoryKey } from "./journal-story";

export const JOURNAL_TOPIC_GRID = "grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3";
const READING_GRID =
  "grid min-w-0 gap-4 sm:grid-cols-[minmax(0,min(28rem,calc((100%_-_1rem)/2)))_minmax(0,1fr)] min-[72rem]:grid-cols-[minmax(0,min(28rem,32%))_repeat(3,minmax(0,1fr))]";

export type JournalTopic = {
  id: number;
  name: string;
  slug: string;
  count?: number;
};

export function journalTopicArtwork(slug?: string | null) {
  if (slug?.includes("product")) {
    return "/journal/topic-product.webp";
  }
  if (slug && /tech|engineer|devops|software|hardware/i.test(slug)) {
    return "/journal/topic-engineering.webp";
  }
  if (slug && /thought|note|life|personal|essay/i.test(slug)) {
    return "/journal/topic-notes.webp";
  }
  return "/journal/topic-design.webp";
}

function TopicCard({ topic, inReadingGrid }: { topic: JournalTopic; inReadingGrid: boolean }) {
  const t = useTranslations("Journal");
  const { currentData, isLoading } = useGetPublicPostDigestsQuery({
    categoryId: topic.id,
    size: 2,
  });
  const posts = currentData?.list.filter((post) => post.slug) ?? [];
  const href = `/single/categories/${encodeURIComponent(topic.slug)}`;
  const browse = (
    <Link href={href} aria-label={t("browseCategory", { name: topic.name })}>
      {t("browseTopic")}
      <Link.Icon />
    </Link>
  );

  return (
    <Card role="article" aria-label={topic.name} className="min-w-0">
      <Card.Header
        className={`grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-3 ${
          inReadingGrid
            ? "sm:grid-cols-[4rem_minmax(0,1fr)] min-[72rem]:grid-cols-[3rem_minmax(0,1fr)] xl:grid-cols-[4.5rem_minmax(0,1fr)]"
            : "sm:grid-cols-1 sm:items-start"
        }`}
      >
        <div
          className={
            inReadingGrid
              ? "relative aspect-[6/5] min-w-0"
              : "relative aspect-[6/5] min-w-0 sm:aspect-[2.5]"
          }
        >
          <Image
            src={journalTopicArtwork(topic.slug)}
            alt=""
            fill
            sizes={
              inReadingGrid
                ? "(min-width: 1280px) 72px, (min-width: 1152px) 48px, (min-width: 640px) 64px, 40vw"
                : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 40vw"
            }
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <Typography type="h3" className="wrap-anywhere">
            {topic.name}
          </Typography>
          {topic.count != null ? (
            <Typography type="body-sm">{t("indexArticleCount", { count: topic.count })}</Typography>
          ) : null}
          <div className="sm:hidden">{browse}</div>
        </div>
      </Card.Header>
      {posts.length > 0 || isLoading ? (
        <Card.Content className="min-w-0">
          <Separator />
          {isLoading ? (
            <div role="status" aria-label={t("loadingStories")} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ) : (
            <ul className="flex min-w-0 flex-col gap-1">
              {posts.map((post) => (
                <li
                  key={journalStoryKey(post)}
                  className="min-w-0 not-first:hidden sm:not-first:list-item"
                >
                  <Link href={journalStoryHref(post)} className="w-full justify-between gap-2">
                    <span className="min-w-0 wrap-anywhere">
                      {post.title || t("untitledStory")}
                    </span>
                    <Link.Icon />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card.Content>
      ) : null}
      <Card.Footer className="mt-auto hidden sm:flex">{browse}</Card.Footer>
    </Card>
  );
}

export function JournalTopics({
  topics,
  readingPicks,
  readingPicksPending = false,
  isLoading,
}: {
  topics: JournalTopic[];
  readingPicks?: Promise<JournalReadingPick[]> | null;
  readingPicksPending?: boolean;
  isLoading: boolean;
}) {
  const t = useTranslations("Journal");
  const picks = readingPicks ? use(readingPicks) : [];
  const showReadingPicks = readingPicksPending || picks.length > 0;
  if (!showReadingPicks && !isLoading && topics.length === 0) return null;

  const useReadingGrid = showReadingPicks && (topics.length === 3 || isLoading);

  return (
    <section aria-labelledby="journal-topics-title" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Typography id="journal-topics-title" type="h2">
          {t(showReadingPicks ? "discoverWriting" : "topicsHint")}
        </Typography>
        <Link href="/single/categories">{t("allCategories")}</Link>
      </div>
      <div
        className={useReadingGrid ? READING_GRID : JOURNAL_TOPIC_GRID}
        data-testid="journal-topics"
      >
        {readingPicksPending ? (
          <Skeleton aria-hidden="true" className="min-h-84 w-full max-w-md min-[375px]:min-h-64" />
        ) : picks.length > 0 ? (
          <JournalReadingCard picks={picks} />
        ) : null}
        {isLoading && !topics.length
          ? [0, 1, 2].map((index) => (
              <Skeleton
                key={index}
                className={useReadingGrid ? "h-48 sm:h-64" : "h-48 sm:h-74"}
                aria-hidden="true"
              />
            ))
          : topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} inReadingGrid={useReadingGrid} />
            ))}
      </div>
    </section>
  );
}
