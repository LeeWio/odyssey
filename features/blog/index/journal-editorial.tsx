"use client";

import { ArrowRight } from "@gravity-ui/icons";
import { Card, Chip, Link, Separator, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";

import { ArticleCardActions } from "@/components/card/article-card-actions";
import { RemoteMedia } from "@/components/ui/remote-media";
import { JOURNAL_PAGE_SIZE } from "@/lib/features/post/journal-query";
import { cn } from "@/lib/utils";

import {
  formatJournalDate,
  journalStoryDate,
  journalStoryHref,
  journalStoryKey,
  type JournalStory,
} from "./journal-story";

export function JournalMasthead() {
  const t = useTranslations("Journal");
  const browseLink = "text-foreground min-h-8 text-sm no-underline";

  return (
    <header className="flex min-w-0 flex-col gap-2 sm:gap-6 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <Typography
          type="h1"
          weight="bold"
          className="text-[clamp(2.375rem,5vw,4.5rem)] leading-[1.06] tracking-[-0.04em] text-balance"
        >
          {t("title")}
        </Typography>
        <Typography className="text-foreground/75 max-w-xl leading-relaxed text-pretty">
          {t("description")}
        </Typography>
      </div>
      <nav aria-label={t("browseArchive")} className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <Link className={browseLink} href="/single/categories">
          {t("topics")}
        </Link>
        <Link className={browseLink} href="/single/authors">
          {t("authors")}
        </Link>
        <Link className={browseLink} href="/archive">
          {t("archive")}
        </Link>
        <Link className={browseLink} href="/library">
          {t("library")}
        </Link>
      </nav>
    </header>
  );
}

function StoryDate({ post, className }: { post: JournalStory; className?: string }) {
  const locale = useLocale();
  const t = useTranslations("Journal");
  const value = journalStoryDate(post);

  return (
    <time
      className={cn("text-foreground/75 text-xs leading-5 tabular-nums", className)}
      dateTime={value || undefined}
    >
      {formatJournalDate(value, locale, t("recentlyPublished"))}
    </time>
  );
}

function HighlightStory({ post, lead = false }: { post: JournalStory; lead?: boolean }) {
  const t = useTranslations("Journal");
  const title = post.title || t("untitledStory");
  const titleId = useId();

  return (
    <Card
      variant={lead ? "secondary" : "transparent"}
      role="article"
      aria-labelledby={titleId}
      className={cn(
        "group grid min-w-0 gap-0 p-0",
        lead && "min-h-full",
        lead && post.coverImage && "sm:grid-cols-[minmax(0,1fr)_minmax(9rem,0.55fr)]"
      )}
      data-testid={lead ? "journal-lead" : "journal-companion"}
    >
      <Card.Content
        className={cn(
          "min-w-0",
          lead ? "justify-center gap-2 p-5 sm:gap-3 sm:p-7" : "gap-1 py-3 sm:gap-2"
        )}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {post.category?.name ? (
            <Typography type="body-xs" className={lead ? undefined : "text-foreground/75"}>
              {post.category.name}
            </Typography>
          ) : null}
          <StoryDate post={post} />
        </div>
        <Card.Title
          id={titleId}
          className={cn(
            "min-w-0 wrap-anywhere",
            lead
              ? "text-[clamp(1.625rem,3.1vw,2.5rem)]/[1.12] font-semibold tracking-[-0.035em] text-balance"
              : "text-base/6 font-semibold sm:text-lg/6"
          )}
        >
          <Link
            className="text-foreground group-hover:text-accent static inline [font-weight:inherit] wrap-anywhere no-underline after:absolute after:inset-0"
            href={journalStoryHref(post)}
          >
            {title}
          </Link>
        </Card.Title>
        {lead && post.summary ? (
          <Card.Description className="text-foreground/75 line-clamp-2 max-w-[62ch] leading-relaxed text-pretty sm:line-clamp-3">
            {post.summary}
          </Card.Description>
        ) : null}
        {lead ? (
          <Typography
            aria-hidden="true"
            type="body-sm"
            weight="medium"
            className="text-foreground mt-1 inline-flex items-center gap-2"
          >
            {t("readStory")}
            <ArrowRight className="size-4" />
          </Typography>
        ) : null}
      </Card.Content>
      {lead && post.coverImage ? (
        <div className="hidden min-w-0 items-center p-4 ps-0 sm:flex">
          <RemoteMedia
            alt=""
            src={post.coverImage}
            className="aspect-4/3 max-h-62 w-full rounded-xl object-cover"
          />
        </div>
      ) : null}
    </Card>
  );
}

export function JournalHighlights({
  lead,
  companions,
}: {
  lead: JournalStory;
  companions: JournalStory[];
}) {
  const t = useTranslations("Journal");

  return (
    <section aria-labelledby="journal-featured-title" className="flex min-w-0 flex-col gap-3">
      <Typography id="journal-featured-title" type="h2" weight="semibold" className="text-lg">
        {t("featuredStories")}
      </Typography>
      <div
        data-testid="journal-feature-layout"
        className={cn(
          "grid min-w-0 gap-2 sm:gap-3 lg:gap-8",
          companions.length > 0 && "lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]"
        )}
      >
        <HighlightStory lead post={lead} />
        {companions.length > 0 ? (
          <div className="flex min-w-0 flex-col justify-center px-1 lg:px-0">
            {companions.map((post, index) => (
              <div key={journalStoryKey(post)} className="min-w-0">
                {index > 0 ? <Separator /> : null}
                <HighlightStory post={post} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function JournalHighlightSkeleton() {
  const t = useTranslations("Journal");
  return (
    <div
      aria-label={t("loadingStories")}
      className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]"
      role="status"
    >
      <Skeleton className="h-48 w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

function JournalStoryRow({ post }: { post: JournalStory }) {
  const t = useTranslations("Journal");
  const title = post.title || t("untitledStory");
  const href = journalStoryHref(post);

  return (
    <Card aria-label={title} role="article" variant="transparent" className="min-w-0 gap-0 p-0">
      <Card.Content className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 py-4 sm:py-6 md:grid-cols-[8rem_minmax(0,1fr)_auto] md:gap-x-6">
        <StoryDate post={post} className="col-start-1 row-start-1 md:pt-1 md:text-sm" />
        <div className="col-start-1 row-start-2 flex min-w-0 flex-col gap-2 md:col-start-2 md:row-start-1">
          <Card.Title className="min-w-0 text-lg leading-snug font-semibold sm:text-xl">
            <Link
              href={href}
              className="text-foreground hover:text-accent inline max-w-full wrap-anywhere no-underline"
            >
              {title}
            </Link>
          </Card.Title>
          {post.summary ? (
            <Card.Description className="text-foreground/75 line-clamp-2 max-w-[66ch] leading-relaxed text-pretty">
              {post.summary}
            </Card.Description>
          ) : null}
          {post.category?.name || post.authorName ? (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              {post.category?.name ? (
                <Chip className="max-w-full truncate" size="sm" variant="soft">
                  {post.category.name}
                </Chip>
              ) : null}
              {post.authorName ? (
                <Link
                  href={"/single/authors/" + encodeURIComponent(post.authorName)}
                  className="text-foreground/75 min-w-0 text-xs wrap-anywhere no-underline"
                >
                  {post.authorName}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="col-start-2 row-span-2 row-start-1 flex items-start gap-3 md:col-start-3 md:row-span-1">
          {post.coverImage ? (
            <RemoteMedia
              alt=""
              className="hidden aspect-3/2 w-25 shrink-0 rounded-lg object-cover lg:block"
              src={post.coverImage}
            />
          ) : null}
          <ArticleCardActions compact href={href} post={post} />
        </div>
      </Card.Content>
    </Card>
  );
}

export function JournalStoryList({ posts }: { posts: JournalStory[] }) {
  return (
    <ol className="flex min-w-0 list-none flex-col" data-testid="journal-latest-list">
      {posts.map((post) => (
        <li key={journalStoryKey(post)} className="min-w-0">
          <Separator />
          <JournalStoryRow post={post} />
        </li>
      ))}
    </ol>
  );
}

export function JournalStoryListSkeleton() {
  const t = useTranslations("Journal");
  return (
    <div role="status" aria-label={t("loadingStories")}>
      {Array.from({ length: JOURNAL_PAGE_SIZE }, (_, index) => (
        <div key={index}>
          <Separator />
          <div className="grid min-w-0 gap-3 py-5 md:grid-cols-[8rem_minmax(0,1fr)] md:gap-x-6">
            <Skeleton className="h-3.5 w-20" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-4 w-full max-w-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
