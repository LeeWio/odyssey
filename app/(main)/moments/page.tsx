"use client";

import React, { useMemo, useState } from "react";
import { useGetPublicMomentsQuery } from "@/lib/features/moment";
import { Spinner, Typography, ScrollShadow, Tabs } from "@heroui/react";
import { useMounted } from "@mantine/hooks";
import Masonry from "@/components/ui/masonry";

export default function MomentsPage() {
  const mounted = useMounted();
  const [activeTab, setActiveTab] = useState<string>("discover");

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

  // Client-side topic and category filter (Runs instantly with gorgeous FLIP transitions!)
  const filteredMoments = useMemo(() => {
    if (activeTab === "discover") return moments;
    if (activeTab === "finance") {
      return moments.filter((m) => !!m.stockSymbol);
    }
    if (activeTab === "photography") {
      return moments.filter((m) => m.images && m.images.length > 0);
    }
    if (activeTab === "tech") {
      return moments.filter((m) =>
        m.topics?.some((t) =>
          ["tech", "technology", "architecture", "frontend", "backend", "web"].includes(
            t.slug.toLowerCase()
          )
        )
      );
    }
    if (activeTab === "life") {
      // General posts / Daily posts without a stock symbol
      return moments.filter((m) => !m.stockSymbol);
    }
    return moments;
  }, [moments, activeTab]);

  // Map backend moments directly to Masonry items
  const masonryItems = useMemo(() => {
    return filteredMoments.map((moment) => ({
      id: moment.id.toString(),
      moment,
    }));
  }, [filteredMoments]);

  if (!mounted) return null;

  return (
    <div className="bg-background min-h-screen px-4 pt-24 pb-16 md:px-6 md:pt-28 md:pb-24 lg:pt-32">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Cinematic Categorized Navigation Bar (Auto handles horizontal scrolling natively!) */}
        <div className="mb-8 flex justify-center">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            variant="secondary"
            className="w-full max-w-4xl"
          >
            <Tabs.ListContainer className="border-default-100 border-b bg-transparent p-0">
              <Tabs.List aria-label="Moment Categories" className="gap-6 sm:gap-8">
                <Tabs.Tab id="discover" className="h-12 px-1 text-sm font-medium">
                  Discover
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="tech" className="h-12 px-1 text-sm font-medium">
                  Tech Node
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="finance" className="h-12 px-1 text-sm font-medium">
                  Market Trend (Stock)
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="photography" className="h-12 px-1 text-sm font-medium">
                  Lens (Photos)
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="life" className="h-12 px-1 text-sm font-medium">
                  Daily Notes
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="flex h-[400px] flex-col items-center justify-center gap-3">
            <Spinner size="lg" color="accent" />
            <span className="text-muted-foreground text-sm font-medium">Loading waterfall...</span>
          </div>
        ) : isError ? (
          <div className="flex h-[400px] flex-col items-center justify-center gap-2">
            <Typography className="text-danger">Failed to load moments feed.</Typography>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <ScrollShadow
              hideScrollBar
              className="h-auto w-full pr-1 md:h-[calc(100vh-360px)] md:overflow-y-auto"
              size={100}
            >
              <div className="relative w-full">
                {masonryItems.length === 0 ? (
                  <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
                    <Typography color="muted" type="body-sm" className="font-medium">
                      No moments found in this category.
                    </Typography>
                    <Typography color="muted" type="body-xs">
                      Try publishing a new moment or switching tabs.
                    </Typography>
                  </div>
                ) : (
                  <Masonry items={masonryItems} />
                )}
              </div>
            </ScrollShadow>
          </div>
        )}
      </div>
    </div>
  );
}
