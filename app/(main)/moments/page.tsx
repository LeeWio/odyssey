"use client";

import React, { useMemo } from "react";
import { useGetPublicMomentsQuery } from "@/lib/features/moment";
import { Spinner, Typography, ScrollShadow } from "@heroui/react";
import { useMounted } from "@mantine/hooks";
import Masonry from "@/components/ui/masonry";

export default function MomentsPage() {
  const mounted = useMounted();

  // Fetch public moments from backend
  const {
    data: publicData,
    isLoading,
    isError,
  } = useGetPublicMomentsQuery({
    page: 0,
    size: 24,
  });

  const moments = useMemo(() => publicData?.list || [], [publicData?.list]);

  // Map backend moments directly to Masonry items
  const masonryItems = useMemo(() => {
    return moments.map((moment) => ({
      id: moment.id.toString(),
      moment,
    }));
  }, [moments]);

  if (!mounted) return null;

  return (
    <div className="bg-background min-h-screen px-4 pt-28 pb-24 sm:px-6 lg:pt-32">
      <div className="mx-auto w-full max-w-[1440px]">
        {isLoading ? (
          <div className="flex h-[500px] flex-col items-center justify-center gap-3">
            <Spinner size="lg" color="accent" />
            <span className="text-muted-foreground text-sm font-medium">Loading waterfall...</span>
          </div>
        ) : isError ? (
          <div className="flex h-[500px] flex-col items-center justify-center gap-2">
            <Typography className="text-danger">Failed to load moments feed.</Typography>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <ScrollShadow hideScrollBar className="h-[calc(100vh-280px)] w-full pr-1" size={100}>
              <div className="relative w-full">
                <Masonry items={masonryItems} />
              </div>
            </ScrollShadow>
          </div>
        )}
      </div>
    </div>
  );
}
