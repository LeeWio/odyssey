"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Link, Skeleton, Typography } from "@heroui/react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { MomentCard } from "@/features/moment/components/card";
import { useMomentBookmarkAccount } from "@/features/moment/hooks/use-moment-bookmarks";
import {
  useGetSavedMomentIdsQuery,
  useGetSavedMomentsQuery,
} from "@/lib/features/moment/moment-bookmark-api";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";
import { PageFrame } from "@/components/layout/page-frame";

export default function SavedMomentsPage() {
  const t = useTranslations("Moments");
  const dispatch = useAppDispatch();
  const username = useMomentBookmarkAccount();

  return (
    <PageFrame className="bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link className="text-sm no-underline" href="/moments">
            {t("backToMoments")}
          </Link>
          <Typography type="h1" weight="semibold">
            {t("savedTitle")}
          </Typography>
          <Typography color="muted">{t("savedDescription")}</Typography>
        </header>

        {!username ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>{t("savedSignInTitle")}</EmptyState.Title>
              <EmptyState.Description>{t("savedSignInDescription")}</EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => dispatch(setLoginOpen(true))}>{t("signIn")}</Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <SavedMoments key={username} username={username} />
        )}
      </div>
    </PageFrame>
  );
}

function SavedMoments({ username }: { username: string }) {
  const t = useTranslations("Moments");
  const [page, setPage] = useState(0);
  const ids = useGetSavedMomentIdsQuery(username, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: 60,
  });
  const bookmarks = useGetSavedMomentsQuery(ids.currentData ? { username, page } : skipToken, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const data = bookmarks.currentData;
  const lastPage = Math.max(0, (data?.totalPages ?? 1) - 1);
  const isAdjustingPage = !!data && !bookmarks.isFetching && !bookmarks.isError && page > lastPage;
  if (isAdjustingPage) setPage(lastPage);

  const hasError = ids.isError || bookmarks.isError;
  const isLoading = !hasError && (!data || isAdjustingPage);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Title>{t("unavailable")}</EmptyState.Title>
          <EmptyState.Description>{t("bookmarkSyncFailed")}</EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              if (ids.isError) void ids.refetch();
              if (bookmarks.isError) void bookmarks.refetch();
            }}
          >
            {t("tryAgain")}
          </Button>
        </EmptyState.Content>
      </EmptyState>
    );
  }

  if (!data?.list.length) {
    return (
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Title>{t("savedEmpty")}</EmptyState.Title>
          <EmptyState.Description>{t("savedEmptyHint")}</EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Link href="/moments">{t("backToMoments")}</Link>
        </EmptyState.Content>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-6" aria-busy={bookmarks.isFetching}>
      {data.list.map((moment) => (
        <MomentCard key={moment.id} moment={moment} />
      ))}
      {lastPage > 0 && (
        <nav aria-label={t("savedTitle")} className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="secondary"
            isDisabled={page === 0 || bookmarks.isFetching}
            onPress={() => setPage(page - 1)}
          >
            {t("previousPage")}
          </Button>
          <Typography color="muted" aria-live="polite">
            {t("pageLabel", { page: page + 1 })}
          </Typography>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={page >= lastPage || bookmarks.isFetching}
            onPress={() => setPage(page + 1)}
          >
            {t("nextPage")}
          </Button>
        </nav>
      )}
    </div>
  );
}
