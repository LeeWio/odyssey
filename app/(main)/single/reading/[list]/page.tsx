"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Button, Card, Link, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";

import { useGetTrendingQuery, useRetrieveDiscoveryQuery } from "@/lib/features/openapi";
import type { OpenApiComponents } from "@/lib/features/openapi/openapi.generated";

type Digest = OpenApiComponents["schemas"]["PostDigestResponse"];
type FullPost = OpenApiComponents["schemas"]["PostResponse"];
type ReadingPost = Digest | FullPost;

const LISTS = {
  most: {
    description: "readingMostDescription",
    title: "readingMost",
  },
  week: {
    description: "readingWeekDescription",
    title: "readingWeek",
  },
} as const;

function formatDate(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function EssayCard({ post }: { post: ReadingPost }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const title = post.title || t("untitledStory");
  const cover = post.coverImage?.trim();
  const slug = post.slug ?? "";
  const published = post.publishedAt ?? ("createdAt" in post ? post.createdAt : undefined);

  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex items-start gap-3">
          <Card.Title className="line-clamp-2 min-w-0 flex-1 text-base leading-6">
            <Link className="text-foreground no-underline" href={`/single/${slug}`}>
              {title}
            </Link>
          </Card.Title>
          {cover ? (
            <Link
              className="block size-12 shrink-0 overflow-hidden rounded-lg no-underline"
              href={`/single/${slug}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="size-12 object-cover" src={cover} />
            </Link>
          ) : null}
        </div>
        <Card.Description>
          {[
            post.authorName,
            post.category?.name,
            formatDate(published, locale, t("recentlyPublished")),
          ]
            .filter(Boolean)
            .join(" · ")}
        </Card.Description>
      </Card.Header>
      {post.summary ? (
        <Card.Content>
          <p className="text-muted line-clamp-2 text-sm leading-5">{post.summary}</p>
        </Card.Content>
      ) : null}
      <Card.Footer className="mt-auto">
        <span className="text-muted text-xs tabular-nums">
          <NumberValue locale={locale} notation="compact" value={post.views ?? 0}>
            {(formatted) => t("views", { count: formatted })}
          </NumberValue>
          {" · "}
          <NumberValue locale={locale} notation="compact" value={post.likesCount ?? 0}>
            {(formatted) => t("likes", { count: formatted })}
          </NumberValue>
        </span>
      </Card.Footer>
    </Card>
  );
}

export default function ReadingListPage({ params }: { params: Promise<{ list: string }> }) {
  const { list } = use(params);
  const kind = list === "week" || list === "most" ? list : null;
  const copy = kind ? LISTS[kind] : null;
  const t = useTranslations("Journal");
  const trending = useGetTrendingQuery({ limit: 18 }, { skip: kind !== "week" });
  const discovery = useRetrieveDiscoveryQuery(undefined, { skip: kind !== "most" });
  const query = kind === "week" ? trending : discovery;
  const posts: ReadingPost[] =
    kind === "week" ? (trending.data ?? []) : (discovery.data?.mostRead ?? []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex max-w-2xl flex-col gap-2">
        <Link className="text-sm no-underline" href="/single">
          {t("title")}
        </Link>
        <Typography type="h1" weight="semibold">
          {copy ? t(copy.title) : decodeURIComponent(list)}
        </Typography>
        {copy ? <Typography color="muted">{t(copy.description)}</Typography> : null}
      </header>

      {kind && query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : kind && query.isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("latestFailed")}</EmptyState.Title>
            <EmptyState.Description>{t("latestFailedHint")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button size="sm" variant="secondary" onPress={() => void query.refetch()}>
              {t("tryAgain")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : !kind || posts.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("readingEmpty")}</EmptyState.Title>
          </EmptyState.Header>
          <EmptyState.Content>
            <Link href="/single">{t("title")}</Link>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post.id ?? post.slug}>
              <EssayCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
