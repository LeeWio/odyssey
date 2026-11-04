"use client";

import { Button, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MomentCard, MomentCardSkeleton } from "../components/card";
import { MomentsPagination } from "../components/moments-pagination";
import { useMomentFeed } from "../hooks/use-moment-feed";
import { PageFrame } from "@/components/layout/page-frame";
import { useGetLikedMomentIdsQuery } from "@/lib/features/moment";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { useAppSelector } from "@/lib/hooks";

export const PublicFeedView = () => {
  const t = useTranslations("Moments");
  const [page, setPage] = useState(1);
  const {
    moments,
    isLoading,
    isError,
    isRefreshError,
    isFetchingPage,
    displayedPage,
    totalPages,
    refetch,
  } = useMomentFeed(12, null, undefined, undefined, { retainPreviousData: true }, page);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const likedMomentIdsQuery = useGetLikedMomentIdsQuery(
    moments.map((moment) => moment.id),
    { skip: !isAuthenticated || moments.length === 0 }
  );
  const knownLikedMomentIds = isAuthenticated ? (likedMomentIdsQuery.data ?? []) : undefined;

  return (
    <PageFrame className="bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8">
        <header className="flex w-full max-w-xl flex-col gap-3 text-center">
          <Typography type="h1" weight="bold">
            {t("title")}
          </Typography>
          <Typography color="muted" type="body">
            {t("description")}
          </Typography>
        </header>

        <div className="flex w-full flex-col items-center gap-6">
          {isRefreshError ? (
            <div className="text-muted flex items-center gap-3 text-sm" role="status">
              <span>{t("loadFailed")}</span>
              <Button size="sm" variant="secondary" onPress={refetch}>
                {t("retry")}
              </Button>
            </div>
          ) : null}
          {isLoading && moments.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <MomentCardSkeleton key={i} />)
          ) : isError ? (
            <div className="text-danger flex flex-col items-center gap-3 py-12 text-sm">
              <span>{t("loadFailed")}</span>
              <Button size="sm" variant="secondary" onPress={() => refetch()}>
                {t("retry")}
              </Button>
            </div>
          ) : moments.length > 0 ? (
            <>
              {moments.map((moment) => (
                <MomentCard
                  key={moment.id}
                  moment={moment}
                  knownLikedMomentIds={knownLikedMomentIds}
                />
              ))}

              <MomentsPagination
                page={displayedPage}
                pages={totalPages}
                isDisabled={isFetchingPage}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="text-muted py-12 text-sm">{t("empty")}</div>
          )}
        </div>
      </div>
    </PageFrame>
  );
};
