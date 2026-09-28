"use client";

import { Button, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import { MomentCard, MomentCardSkeleton } from "../components/card";
import { useMomentFeed } from "../hooks/use-moment-feed";

export const PublicFeedView = () => {
  const t = useTranslations("Moments");
  const { moments, isLoading, isError, isFetchingMore, hasMore, loadMore, refetch } =
    useMomentFeed();

  return (
    <div className="bg-background min-h-screen px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
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
                <MomentCard key={moment.id} moment={moment} />
              ))}

              {hasMore && (
                <div className="mt-8 flex w-full justify-center">
                  <Button isPending={isFetchingMore} variant="secondary" onPress={loadMore}>
                    {t("loadMore")}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-muted py-12 text-sm">{t("empty")}</div>
          )}
        </div>
      </div>
    </div>
  );
};
