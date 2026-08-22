"use client";

import React, { useMemo, useState } from "react";
import { useGetPublicMomentsQuery } from "@/lib/features/moment";
import { Spinner, Typography, ScrollShadow, Tabs, Card } from "@heroui/react";
import { useMounted } from "@mantine/hooks";
import { useNow } from "next-intl";
import { Icon } from "@iconify/react";
import { StockTrendCard } from "@/components/stock/stock-trend-card";
import Masonry from "@/components/ui/masonry";

export default function MomentsPage() {
  const mounted = useMounted();
  const [activeTab, setActiveTab] = useState<string>("all");
  const now = useNow(); // Pure React 19 idempotent date hook

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

  // Client-side date and time interval filter (Pure render-safe computations)
  const filteredMoments = useMemo(() => {
    if (activeTab === "all") return moments;

    const nowMs = now.getTime();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    return moments.filter((m) => {
      // Formulate timezone-safe date-string to prevent parsing deviations
      const dateStr =
        m.createdAt.includes("T") && !m.createdAt.endsWith("Z") && !m.createdAt.includes("+")
          ? `${m.createdAt}Z`
          : m.createdAt;

      const timestamp = new Date(dateStr).getTime();
      if (!Number.isFinite(timestamp)) return false;

      const diffMs = nowMs - timestamp;

      switch (activeTab) {
        case "today":
          return diffMs < MS_PER_DAY;
        case "yesterday":
          return diffMs >= MS_PER_DAY && diffMs < 2 * MS_PER_DAY;
        case "week":
          return diffMs < 7 * MS_PER_DAY;
        case "month":
          return diffMs < 30 * MS_PER_DAY;
        default:
          return true;
      }
    });
  }, [moments, activeTab, now]);

  // Client-side data aggregation for the sidebar widgets
  const { trendingTopics, trendingStocks } = useMemo(() => {
    const topicCounts: Record<string, number> = {};
    const stockCounts: Record<string, number> = {};

    moments.forEach((m) => {
      // Count topics
      if (m.topics) {
        m.topics.forEach((t) => {
          topicCounts[t.slug] = (topicCounts[t.slug] || 0) + 1;
        });
      }
      // Count stocks
      if (m.stockSymbol) {
        stockCounts[m.stockSymbol] = (stockCounts[m.stockSymbol] || 0) + 1;
      }
    });

    // Sort descending and slice top 5 topics
    const sortedTopics = Object.entries(topicCounts)
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sort descending and slice top 3 stocks
    const sortedStocks = Object.entries(stockCounts)
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      trendingTopics: sortedTopics,
      trendingStocks: sortedStocks,
    };
  }, [moments]);

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
      {/* Responsive two-column split grid (1 col on mobile, 12 cols with 75/25 split on desktop) */}
      <div className="mx-auto w-full max-w-[1440px] lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-12">
        {/* Left Column: Timeline Feed Area (Main 75%) */}
        <div className="flex min-w-0 flex-col lg:col-span-8 xl:col-span-9">
          {/* Cinematic Date-Based Navigation Bar (Auto handles horizontal scrolling natively!) */}
          <div className="mb-8 flex justify-center">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              variant="secondary"
              className="w-full max-w-4xl"
            >
              <Tabs.ListContainer className="border-default-100 border-b bg-transparent p-0">
                <Tabs.List aria-label="Moment Date Filters" className="gap-6 sm:gap-8">
                  <Tabs.Tab id="all" className="h-12 px-1 text-sm font-medium">
                    All
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="today" className="h-12 px-1 text-sm font-medium">
                    Today
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="yesterday" className="h-12 px-1 text-sm font-medium">
                    Yesterday
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="week" className="h-12 px-1 text-sm font-medium">
                    This Week
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="month" className="h-12 px-1 text-sm font-medium">
                    This Month
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex h-[400px] flex-col items-center justify-center gap-3">
              <Spinner size="lg" color="accent" />
              <span className="text-muted-foreground text-sm font-medium">
                Loading waterfall...
              </span>
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
                        No moments found in this timeframe.
                      </Typography>
                      <Typography color="muted" type="body-xs">
                        Try publishing a new moment or choosing a wider timeframe.
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

        {/* Right Column: Trending Topics & Market Movers Sidebar (Main 25%, Hidden on Mobile/Tablet) */}
        <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
          <div className="sticky top-32 flex flex-col gap-6">
            {/* Widget 1: Trending Topics List */}
            <Card variant="secondary" className="p-5">
              <Card.Header className="border-default-100/60 flex flex-row items-center gap-2 border-b p-0 pb-3">
                <Icon icon="gravity-ui:hashtag" className="text-accent size-4" />
                <Typography type="h3" className="text-sm font-semibold">
                  Trending Topics
                </Typography>
              </Card.Header>
              <div className="flex flex-col gap-3.5 pt-4">
                {trendingTopics.length === 0 ? (
                  <span className="text-muted-foreground text-xs italic">
                    No topics active today
                  </span>
                ) : (
                  trendingTopics.map(({ slug, count }) => (
                    <div
                      key={slug}
                      className="group flex cursor-pointer items-center justify-between"
                    >
                      <span className="text-muted-foreground group-hover:text-accent text-sm font-medium transition-colors">
                        #{slug}
                      </span>
                      <span className="text-muted bg-default-100 rounded-full px-2 py-0.5 font-mono text-xs">
                        {count} posts
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Widget 2: Market Movers (Directly renders miniature interactive stock cards!) */}
            <Card variant="secondary" className="p-5">
              <Card.Header className="border-default-100/60 flex flex-row items-center gap-2 border-b p-0 pb-3">
                <Icon icon="gravity-ui:chart-mixed" className="text-accent size-4" />
                <Typography type="h3" className="text-sm font-semibold">
                  Market Movers
                </Typography>
              </Card.Header>
              <div className="flex flex-col gap-4 pt-4">
                {trendingStocks.length === 0 ? (
                  <span className="text-muted-foreground text-xs italic">
                    No attached stock trends yet
                  </span>
                ) : (
                  trendingStocks.map(({ symbol }) => (
                    <div key={symbol} className="w-full">
                      <StockTrendCard
                        symbol={symbol}
                        variant="transparent"
                        className="border-none p-0 shadow-none"
                      />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
