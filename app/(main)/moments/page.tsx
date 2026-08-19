"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Avatar, Button, Card, Chip, Tag, TagGroup, Typography, Pagination } from "@heroui/react";
import { Segment, EmptyState } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useMounted, useScrollIntoView } from "@mantine/hooks";
import { AnimatePresence, motion } from "motion/react";

import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { useGetCurrentUserQuery } from "@/lib/features/user/user-api";
import { useGetPublicTagsQuery } from "@/lib/features/tag/tag-api";
import { useGetPublicMomentsQuery } from "@/lib/features/moment";
import { MomentCard, MomentCardSkeleton, MomentPublisher } from "@/features/moment";

type FilterType = "all" | "text" | "photos";
type ViewMode = "list" | "grid";

const springConfig = {
  type: "spring" as const,
  stiffness: 380,
  damping: 38,
  mass: 1,
};

export default function MomentsPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isPublisherOpen, setIsPublisherOpen] = useState(false);

  // Controlled Pagination State (1-based index)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Use Mantine's purpose-built scroll hook to safely anchor the feed
  const { scrollIntoView, targetRef: feedRef } = useScrollIntoView<HTMLElement>({
    offset: 120, // 120px offset to accommodate the sticky navbar and layout padding
    axis: "y",
    cancelable: true,
  });

  // Prevent scrolling on initial page load, only scroll when user explicitly changes pages
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollIntoView({ alignment: "start" });
  }, [currentPage, scrollIntoView]);

  // Client hydration mounting check using unified project hook
  const mounted = useMounted();

  // Fetch paginated public moments from backend
  const {
    data: publicData,
    isLoading,
    isError,
    refetch,
  } = useGetPublicMomentsQuery({
    page: currentPage - 1, // backend expects 0-based page index
    size: pageSize,
  });

  const moments = useMemo(() => publicData?.list || [], [publicData?.list]);
  const totalItems = publicData?.total || 0;
  const totalPages = publicData?.totalPages || 1;

  // Fetch optional currentUser profile details for the personal aside card
  const { data: currentUser } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Fetch tags cloud suggestions
  const { data: publicTags = [] } = useGetPublicTagsQuery();

  // Client-side filtering of loaded moments
  const filteredMoments = useMemo(() => {
    return moments.filter((m) => {
      // 1. Media filter
      const hasImages = m.images && m.images.length > 0;
      if (filter === "text" && hasImages) return false;
      if (filter === "photos" && !hasImages) return false;

      // 2. Topic tag filter
      if (selectedTopic) {
        const hasTopic = m.topics?.some(
          (t) => t.slug.toLowerCase() === selectedTopic.toLowerCase()
        );
        if (!hasTopic) return false;
      }

      return true;
    });
  }, [moments, filter, selectedTopic]);

  // Profile data for sidebar widget
  const ownerName = currentUser?.nickname || currentUser?.username || "wei.li";
  const ownerAvatar = currentUser?.avatar || "https://img.heroui.chat/image/avatar?w=400&h=400&u=3";

  // Compute pagination range with ellipsis for display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  // Compute dynamic footprints density map based on current moments feed
  const footprintsMap = useMemo(() => {
    // Array of 28 cells, default to 0
    const densities = Array(28).fill(0);

    moments.forEach((m) => {
      if (!m.createdAt) return;
      // Convert createdAt to a deterministic index between 0 and 27
      const dateStr = m.createdAt.substring(0, 10); // "YYYY-MM-DD"
      // Simple hash to map date string deterministically into one of the 28 cells
      let hash = 0;
      for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i);
        hash = hash & hash;
      }
      const index = Math.abs(hash) % 28;
      densities[index] = Math.min(4, densities[index] + 1); // Max density is 4
    });

    // If there are no moments or very few, sprinkle some deterministic fake data based on page number
    // to keep the widget looking lively, scaled down significantly
    if (moments.length < 5) {
      const offset = (currentPage * 7) % 28;
      densities[offset] = 2;
      densities[(offset + 3) % 28] = 1;
      densities[(offset + 8) % 28] = 3;
    }

    return densities;
  }, [moments, currentPage]);

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="bg-background min-h-screen px-4 pt-28 pb-24 sm:px-6 lg:pt-32">
      {/* Dual Column Layout Grid */}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-[1fr_280px]">
        {/* Left Column: Principal moments feed */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 35, delay: 0.05 }}
          className="flex flex-col gap-6"
        >
          {/* 1. Header Area */}
          <header className="flex w-full flex-col gap-3.5 text-left">
            <div className="flex w-full flex-row items-center justify-between">
              <Typography type="h2" weight="bold" className="text-3xl tracking-tight">
                Moments
              </Typography>
              {mounted && isAuthenticated && (
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => setIsPublisherOpen(true)}
                  className="gap-1.5 transition-transform active:scale-95"
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

          {/* 2. Advanced Segment Filter & Metrics selector row */}
          <div className="border-default-100 flex w-full flex-row items-center justify-between border-b pb-3.5">
            <div className="flex items-center gap-3">
              <Segment
                size="sm"
                selectedKey={filter}
                onSelectionChange={(key) => {
                  setFilter(key as FilterType);
                }}
              >
                <Segment.Item id="all">All</Segment.Item>
                <Segment.Item id="text">Notes</Segment.Item>
                <Segment.Item id="photos">Photos</Segment.Item>
              </Segment>

              <div className="bg-surface-secondary border-default-100 hidden items-center gap-1 rounded-lg border p-0.5 sm:flex">
                <button
                  aria-label="List View"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === "list"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon icon="gravity-ui:list" className="size-3.5" />
                </button>
                <button
                  aria-label="Grid View"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === "grid"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon icon="gravity-ui:layout-cells-large" className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedTopic && (
                <Chip
                  size="sm"
                  color="accent"
                  variant="soft"
                  className="animate-fade-in flex h-6 items-center gap-1 pr-1.5 pl-2.5"
                >
                  <span className="flex items-center gap-1">
                    <span>#{selectedTopic}</span>
                    <button
                      aria-label="Remove topic filter"
                      onClick={() => setSelectedTopic(null)}
                      className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"
                    >
                      <Icon icon="gravity-ui:xmark" className="size-3" />
                    </button>
                  </span>
                </Chip>
              )}
              <span className="text-muted-foreground font-mono text-xs font-medium tabular-nums">
                {filteredMoments.length} listed
              </span>
            </div>
          </div>

          {/* 3. Core Feed Main Section */}
          <main ref={feedRef} className="flex w-full flex-col gap-5">
            <AnimatePresence mode="popLayout" initial={false}>
              {isLoading && moments.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={springConfig}
                    className="w-full"
                  >
                    <MomentCardSkeleton />
                  </motion.div>
                ))
              ) : isError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={springConfig}
                  className="text-danger bg-surface-secondary/40 border-separator/20 flex w-full flex-col items-center gap-3 rounded-3xl border py-12 text-sm"
                >
                  <Icon icon="gravity-ui:triangle-exclamation" className="text-danger-500 size-8" />
                  <span>Failed to load moments. Please try again.</span>
                  <Button size="sm" variant="secondary" onPress={() => refetch()}>
                    Retry
                  </Button>
                </motion.div>
              ) : filteredMoments.length > 0 ? (
                <motion.div key="feed" className="w-full">
                  <div
                    className={`w-full transition-all duration-500 ${
                      viewMode === "grid"
                        ? "block columns-1 gap-5 space-y-5 sm:columns-2"
                        : "flex flex-col gap-5"
                    }`}
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      {filteredMoments.map((moment, index) => (
                        <motion.div
                          key={moment.id}
                          layout
                          initial={{ opacity: 0, y: 15, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -15, scale: 0.95 }}
                          transition={{
                            ...springConfig,
                            delay: index * 0.03, // 30ms staggered cascading delay
                          }}
                          className={`w-full ${viewMode === "grid" ? "inline-block break-inside-avoid" : ""}`}
                        >
                          <MomentCard moment={moment} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Standard HeroUI Pagination footer bar */}
                  {!isLoading && totalPages > 1 && (
                    <div className="border-default-100 mt-4 w-full border-t pt-6">
                      <Pagination className="w-full flex-row flex-wrap items-center justify-between gap-4">
                        <Pagination.Summary className="text-muted-foreground font-mono text-xs font-medium">
                          Showing {startItem} - {endItem} of {totalItems} moments
                        </Pagination.Summary>

                        <Pagination.Content>
                          <Pagination.Item>
                            <Pagination.Previous
                              isDisabled={currentPage === 1}
                              onPress={() => setCurrentPage((p) => p - 1)}
                            >
                              <Pagination.PreviousIcon />
                              <span>Previous</span>
                            </Pagination.Previous>
                          </Pagination.Item>

                          {getPageNumbers().map((p, i) =>
                            p === "ellipsis" ? (
                              <Pagination.Item key={`ellipsis-${i}`}>
                                <Pagination.Ellipsis />
                              </Pagination.Item>
                            ) : (
                              <Pagination.Item key={p}>
                                <Pagination.Link
                                  isActive={p === currentPage}
                                  onPress={() => setCurrentPage(p)}
                                >
                                  {p}
                                </Pagination.Link>
                              </Pagination.Item>
                            )
                          )}

                          <Pagination.Item>
                            <Pagination.Next
                              isDisabled={currentPage === totalPages}
                              onPress={() => setCurrentPage((p) => p + 1)}
                            >
                              <span>Next</span>
                              <Pagination.NextIcon />
                            </Pagination.Next>
                          </Pagination.Item>
                        </Pagination.Content>
                      </Pagination>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={springConfig}
                  className="w-full"
                >
                  {/* Standard, beautiful HeroUI EmptyState */}
                  <EmptyState className="border-border rounded-2xl border border-dashed">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <Icon icon="gravity-ui:brush" className="size-5" />
                      </EmptyState.Media>
                      <EmptyState.Title>No moments found</EmptyState.Title>
                      <EmptyState.Description>
                        No updates match your current filter settings.
                      </EmptyState.Description>
                    </EmptyState.Header>
                    {selectedTopic && (
                      <EmptyState.Content>
                        <Button size="sm" variant="outline" onPress={() => setSelectedTopic(null)}>
                          Clear Topic Filter
                        </Button>
                      </EmptyState.Content>
                    )}
                  </EmptyState>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </motion.div>

        {/* Right Column: Aesthetic Widgets (Visible only on md viewports and wider) */}
        <aside className="hidden h-fit flex-col gap-6 md:sticky md:top-32 md:flex">
          {/* Widget 1: Profile card with session metrics */}
          <Card className="border-default-100 bg-content1 flex flex-col gap-3.5 rounded-2xl border p-4 shadow-sm">
            <div className="flex items-center gap-3 select-none">
              <Avatar size="sm" className="size-10">
                <Avatar.Image src={ownerAvatar} alt={ownerName} />
                <Avatar.Fallback>{ownerName.substring(0, 2).toUpperCase()}</Avatar.Fallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-foreground mb-1 text-sm leading-none font-bold">
                  {ownerName}
                </span>
                <span className="text-muted-foreground text-[10px] leading-none font-medium">
                  Creator / Builder
                </span>
              </div>
            </div>
            <Typography color="muted" type="body-xs" className="leading-normal">
              Writing system, designing experiences, and capturing moments across the Nebula.
            </Typography>
          </Card>

          {/* Widget 2: Micro Github contribution-like grid (Footprints) */}
          <Card className="border-default-100 bg-content1 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm">
            <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase select-none">
              Footprints
            </span>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }).map((_, i) => {
                const density = footprintsMap[i];
                const colors = [
                  "bg-default-100/60",
                  "bg-accent-soft/30",
                  "bg-accent-soft/60",
                  "bg-accent-soft",
                  "bg-accent",
                ];
                return (
                  <div
                    key={i}
                    className={`aspect-square w-full rounded-sm ${colors[density]} cursor-pointer transition-all duration-200 hover:scale-110`}
                  />
                );
              })}
            </div>
            <div className="text-muted-foreground flex items-center justify-between pt-1 text-[9px] font-medium select-none">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="bg-default-100/60 size-2 rounded-sm" />
                <div className="bg-accent-soft/30 size-2 rounded-sm" />
                <div className="bg-accent-soft/60 size-2 rounded-sm" />
                <div className="bg-accent-soft size-2 rounded-sm" />
                <div className="bg-accent size-2 rounded-sm" />
              </div>
              <span>More</span>
            </div>
          </Card>

          {/* Widget 3: Popular tags topic cloud */}
          {publicTags.length > 0 && (
            <Card className="border-default-100 bg-content1 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm">
              <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase select-none">
                Topics Cloud
              </span>
              <TagGroup aria-label="Popular Topics" size="sm" selectionMode="none">
                <TagGroup.List className="flex flex-wrap gap-1.5">
                  {publicTags.slice(0, 12).map((tag) => {
                    const isSelected = selectedTopic?.toLowerCase() === tag.slug.toLowerCase();
                    return (
                      <Tag
                        key={tag.id}
                        id={tag.slug}
                        textValue={tag.name}
                        onPress={() => setSelectedTopic(isSelected ? null : tag.slug)}
                        className={`cursor-pointer transition-all duration-200 select-none ${
                          isSelected
                            ? "bg-accent text-accent-foreground scale-105 border-transparent"
                            : "bg-default-50 hover:bg-default-100 border-default-100 border"
                        }`}
                      >
                        #{tag.name}
                      </Tag>
                    );
                  })}
                </TagGroup.List>
              </TagGroup>
            </Card>
          )}
        </aside>
      </div>

      {/* 4. Publisher Modal */}
      {mounted && isAuthenticated && (
        <MomentPublisher isOpen={isPublisherOpen} onOpenChange={setIsPublisherOpen} />
      )}
    </div>
  );
}
