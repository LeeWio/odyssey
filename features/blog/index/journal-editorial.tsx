"use client";

import { Card, Link, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

import { ArticleCardActions } from "@/components/card/article-card-actions";
import { RemoteMedia } from "@/components/ui/remote-media";
import { JOURNAL_PAGE_SIZE } from "@/lib/features/post/journal-query";

import {
  formatJournalDate,
  journalStoryDate,
  journalStoryHref,
  journalStoryKey,
  type JournalStory,
} from "./journal-story";
import { JOURNAL_TOPIC_GRID, journalTopicArtwork } from "./journal-topics";

export function JournalMasthead({ children }: { children: ReactNode }) {
  const t = useTranslations("Journal");

  return (
    <header className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-col gap-2 sm:gap-3">
        <Typography type="h1">{t("title")}</Typography>
        <Typography className="max-w-xl">{t("description")}</Typography>
      </div>
      {children}
    </header>
  );
}

function JournalStoryCard({ post }: { post: JournalStory }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const title = post.title || t("untitledStory");
  const href = journalStoryHref(post);
  const date = journalStoryDate(post);

  return (
    <Card role="article" aria-label={title} className="h-full min-w-0">
      <Card.Content className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1 sm:grid-cols-[5.25rem_minmax(0,1fr)_auto] sm:gap-x-3">
        <div className="col-start-1 row-start-1 flex min-w-0 flex-col">
          {post.coverImage ? (
            <RemoteMedia alt="" className="aspect-3/2 w-full object-cover" src={post.coverImage} />
          ) : (
            <div className="relative aspect-square">
              <Image
                src={journalTopicArtwork(post.category?.slug)}
                alt=""
                fill
                sizes="84px"
                className="object-cover"
              />
            </div>
          )}
        </div>
        <div className="col-start-2 row-start-1 flex min-w-0 flex-col gap-2">
          {post.category?.name ? (
            <Typography type="body-xs" className="min-w-0 wrap-anywhere">
              {post.category.name}
            </Typography>
          ) : null}
          <Card.Title className="min-w-0">
            <Link href={href} className="max-w-full wrap-anywhere">
              {title}
            </Link>
          </Card.Title>
          <Typography
            type="body-xs"
            className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
          >
            <time dateTime={date || undefined}>
              {formatJournalDate(date, locale, t("recentlyPublished"))}
            </time>
            {post.authorName ? (
              <Link
                href={`/single/authors/${encodeURIComponent(post.authorName)}`}
                className="min-w-0 wrap-anywhere"
              >
                {post.authorName}
              </Link>
            ) : null}
          </Typography>
        </div>
        <div className="col-start-3 row-start-1">
          <ArticleCardActions compact href={href} post={post} />
        </div>
      </Card.Content>
    </Card>
  );
}

export function JournalStoryList({ posts }: { posts: JournalStory[] }) {
  return (
    <ol className={JOURNAL_TOPIC_GRID} data-testid="journal-latest-list">
      {posts.map((post) => (
        <li key={journalStoryKey(post)} className="min-w-0">
          <JournalStoryCard post={post} />
        </li>
      ))}
    </ol>
  );
}

export function JournalStoryListSkeleton() {
  const t = useTranslations("Journal");
  return (
    <div className={JOURNAL_TOPIC_GRID} role="status" aria-label={t("loadingStories")}>
      {Array.from({ length: JOURNAL_PAGE_SIZE }, (_, index) => (
        <Skeleton key={index} className="h-29" aria-hidden="true" />
      ))}
    </div>
  );
}
