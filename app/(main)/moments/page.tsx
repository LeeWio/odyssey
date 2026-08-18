"use client";

import { useState, useMemo } from "react";
import { Button, Chip, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";

import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { MomentCard, MomentCardSkeleton, MomentPublisher, useMomentFeed } from "@/features/moment";

type FilterType = "all" | "text" | "photos";

export default function MomentsPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isPublisherOpen, setIsPublisherOpen] = useState(false);

  // Fetch paginated public moments
  const { moments, isLoading, isError, isFetchingMore, hasMore, loadMore, refetch } =
    useMomentFeed(15);

  // Client-side filtering of loaded moments
  const filteredMoments = useMemo(() => {
    return moments.filter((m) => {
      const hasImages = m.images && m.images.length > 0;
      if (filter === "text") return !hasImages;
      if (filter === "photos") return hasImages;
      return true;
    });
  }, [moments, filter]);

  return (
    <div className="bg-background min-h-screen px-4 pt-28 pb-24 sm:px-6 lg:pt-32">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        {/* 1. Header Area */}
        <header className="flex w-full flex-col gap-3.5 text-left">
          <div className="flex w-full flex-row items-center justify-between">
            <Typography type="h2" weight="bold" className="text-3xl tracking-tight">
              Moments
            </Typography>
            {isAuthenticated && (
              <Button
                size="sm"
                variant="outline"
                onPress={() => setIsPublisherOpen(true)}
                className="gap-1.5"
              >
                <Icon icon="gravity-ui:plus" className="size-4" />
                <span>Publish</span>
              </Button>
            )}
          </div>
          <Typography color="muted" type="body-sm" className="leading-relaxed">
            Captured design details, development notes, and fleeting fragments of everyday design.
          </Typography>
        </header>

        {/* 2. Filters & Metrics Selector Row */}
        <div className="border-separator/20 flex w-full flex-row items-center justify-between border-b py-1">
          <div className="flex flex-row gap-1.5">
            <Chip
              variant={filter === "all" ? "soft" : "tertiary"}
              color={filter === "all" ? "accent" : "default"}
              className="cursor-pointer text-xs"
              onClick={() => setFilter("all")}
            >
              All
            </Chip>
            <Chip
              variant={filter === "text" ? "soft" : "tertiary"}
              color={filter === "text" ? "accent" : "default"}
              className="cursor-pointer text-xs"
              onClick={() => setFilter("text")}
            >
              Field Notes
            </Chip>
            <Chip
              variant={filter === "photos" ? "soft" : "tertiary"}
              color={filter === "photos" ? "accent" : "default"}
              className="cursor-pointer text-xs"
              onClick={() => setFilter("photos")}
            >
              Captures
            </Chip>
          </div>

          <span className="text-muted font-mono text-xs font-medium">
            {filteredMoments.length} listed
          </span>
        </div>

        {/* 3. Core Feed Main Section */}
        <main className="flex w-full flex-col gap-5">
          {isLoading && moments.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <MomentCardSkeleton key={i} />)
          ) : isError ? (
            <div className="text-danger bg-surface-secondary/40 border-separator/20 flex w-full flex-col items-center gap-3 rounded-3xl border py-12 text-sm">
              <Icon icon="gravity-ui:triangle-exclamation" className="text-danger-500 size-8" />
              <span>Failed to load moments. Please try again.</span>
              <Button size="sm" variant="secondary" onPress={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filteredMoments.length > 0 ? (
            <>
              {filteredMoments.map((moment) => (
                <MomentCard key={moment.id} moment={moment} />
              ))}

              {hasMore && filter === "all" && (
                <div className="mt-4 flex w-full justify-center">
                  <Button isPending={isFetchingMore} variant="secondary" onPress={loadMore}>
                    Load more moments
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-muted bg-surface-secondary/30 border-separator/10 flex w-full flex-col items-center gap-2 rounded-3xl border py-16 text-center text-sm">
              <Icon icon="gravity-ui:feather" className="text-muted-foreground/40 size-8" />
              <span>No moments match this filter.</span>
            </div>
          )}
        </main>
      </div>

      {/* 4. Publisher Modal */}
      {isAuthenticated && (
        <MomentPublisher isOpen={isPublisherOpen} onOpenChange={setIsPublisherOpen} />
      )}
    </div>
  );
}
