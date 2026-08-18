"use client";

import { Button, Typography } from "@heroui/react";
import { MomentCard, MomentCardSkeleton } from "../components/card";
import { useMomentFeed } from "../hooks/use-moment-feed";

export const PublicFeedView = () => {
  const { moments, isLoading, isError, isFetchingMore, hasMore, loadMore, refetch } =
    useMomentFeed();

  return (
    <div className="bg-background min-h-screen px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8">
        <header className="flex w-full max-w-xl flex-col gap-3 text-center">
          <Typography type="h1" weight="bold">
            Moments
          </Typography>
          <Typography color="muted" type="body">
            Short field notes and captured fragments from everyday notices.
          </Typography>
        </header>

        <main className="flex w-full flex-col items-center gap-6">
          {isLoading && moments.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <MomentCardSkeleton key={i} />)
          ) : isError ? (
            <div className="text-danger flex flex-col items-center gap-3 py-12 text-sm">
              <span>Failed to load moments. Please try again.</span>
              <Button size="sm" variant="secondary" onPress={() => refetch()}>
                Retry
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
                    Load more moments
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-muted py-12 text-sm">No moments published yet.</div>
          )}
        </main>
      </div>
    </div>
  );
};
