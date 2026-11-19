"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Link, Skeleton, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { MomentCard } from "@/features/moment/components/card";
import { useMomentBookmarkAccount } from "@/features/moment/hooks/use-moment-bookmarks";
import { useGetLikedMomentsQuery } from "@/lib/features/moment";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";
import { PageFrame } from "@/components/layout/page-frame";

export default function LikedMomentsPage() {
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
            {t("likedTitle")}
          </Typography>
          <Typography color="muted">{t("likedDescription")}</Typography>
        </header>

        {!username ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>{t("likedSignInTitle")}</EmptyState.Title>
              <EmptyState.Description>{t("likedSignInDescription")}</EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => dispatch(setLoginOpen(true))}>{t("signIn")}</Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <LikedMoments key={username} username={username} />
        )}
      </div>
    </PageFrame>
  );
}

function LikedMoments({ username }: { username: string }) {
  const t = useTranslations("Moments");
  const [page, setPage] = useState(0);
  const liked = useGetLikedMomentsQuery(
    { username, page },
    {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    }
  );
  const data = liked.currentData;
  const lastPage = Math.max(0, (data?.totalPages ?? 1) - 1);
  const isAdjustingPage = !!data && !liked.isFetching && !liked.isError && page > lastPage;
  if (isAdjustingPage) setPage(lastPage);

  const hasError = liked.isError;
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
          <EmptyState.Description>{t("unavailableHint")}</EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button size="sm" variant="secondary" onPress={() => void liked.refetch()}>
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
          <EmptyState.Title>{t("likedEmpty")}</EmptyState.Title>
          <EmptyState.Description>{t("likedEmptyHint")}</EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Link href="/moments">{t("backToMoments")}</Link>
        </EmptyState.Content>
      </EmptyState>
    );
  }

  const likedIds = data.list.map(({ id }) => id);
  return (
    <div className="flex flex-col gap-6" aria-busy={liked.isFetching}>
      {data.list.map((moment) => (
        <MomentCard key={moment.id} moment={moment} knownLikedMomentIds={likedIds} />
      ))}
      {lastPage > 0 && (
        <nav aria-label={t("likedTitle")} className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="secondary"
            isDisabled={page === 0 || liked.isFetching}
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
            isDisabled={page >= lastPage || liked.isFetching}
            onPress={() => setPage(page + 1)}
          >
            {t("nextPage")}
          </Button>
        </nav>
      )}
    </div>
  );
}
