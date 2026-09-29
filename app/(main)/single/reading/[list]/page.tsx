"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Link, Skeleton, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import { use } from "react";

import { useGetTrendingQuery, useRetrieveDiscoveryQuery } from "@/lib/features/openapi";
import type { OpenApiComponents } from "@/lib/features/openapi/openapi.generated";

import { EssayGrid } from "../../components/essay-grid";

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
        <EssayGrid posts={posts} />
      )}
    </div>
  );
}
