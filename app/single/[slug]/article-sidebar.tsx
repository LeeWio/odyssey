"use client";

import type { EmblaCarouselType } from "embla-carousel";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { Sparkles, Flame, Eye, Book, Code, Heart } from "@gravity-ui/icons";
import { motion } from "motion/react";
import { Carousel, Segment, EmptyState, ItemCard, Timeline } from "@heroui-pro/react";
import {
  Avatar,
  Description,
  Label,
  ListBox,
  ScrollShadow,
  Spinner,
  Button,
  Chip,
} from "@heroui/react";
import { useGetRelatedPostsQuery, useGetFeaturedPostsQuery } from "@/lib/features/post/post-api";

const tabs = [
  {
    icon: "gravity-ui:star-fill",
    id: "for-you",
    label: "For You",
  },
  {
    icon: "gravity-ui:flame",
    id: "top-picks",
    label: "Top Picks",
  },
  {
    icon: "gravity-ui:books",
    id: "read-next",
    label: "Read Next",
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

const mockUsers = [
  {
    id: "1",
    name: "Bob",
    email: "bob@heroui.com",
    avatarUrl: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg",
  },
  {
    id: "2",
    name: "Fred",
    email: "fred@heroui.com",
    avatarUrl: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg",
  },
  {
    id: "3",
    name: "Martha",
    email: "martha@heroui.com",
    avatarUrl: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg",
  },
];

const timelineIcons = [Sparkles, Book, Code, Heart, Flame];

const MotionTimeline = motion.create(Timeline);
const MotionTimelineItem = motion.create(Timeline.Item);
const MotionListBoxItem = motion.create(ListBox.Item);
const MotionListBox = motion.create(ListBox);

const listBoxContainerVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,

    transition: {
      delayChildren: 0.15,
      staggerChildren: 0.08,
    },
  },
} as const;

const listBoxItemVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    filter: "blur(4px)",
  },

  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",

    transition: {
      type: "spring",
      stiffness: 120,
      damping: 20,
      mass: 0.6,
    },
  },
} as const;

const containerVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,

    transition: {
      delayChildren: 0.15,
      staggerChildren: 0.12,
    },
  },
} as const;

const itemVariants = {
  hidden: {
    opacity: 0,
    x: -8,
    filter: "blur(4px)",
  },

  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",

    transition: {
      type: "spring",
      stiffness: 80,
      damping: 22,
      mass: 0.7,
    },
  },
} as const;

export interface ArticleSidebarProps {
  slug?: string;
}

export function ArticleSidebar({ slug }: ArticleSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [api, setApi] = useState<EmblaCarouselType>();

  // Determine initial active tab from the URL parameter (defaults to "for-you")
  const tabFromUrl = (searchParams.get("tab") as TabId) || "for-you";
  const [selectedTab, setSelectedTab] = useState<TabId>(tabFromUrl);

  // Fetch Recommended / Related posts (For You)
  const { data: relatedPosts = [], isLoading: relatedLoading } = useGetRelatedPostsQuery(
    slug || "",
    { skip: !slug }
  );

  // Fetch Featured posts (Top Picks)
  const { data: featuredPage, isLoading: featuredLoading } = useGetFeaturedPostsQuery({
    page: 0,
    size: 5,
  });
  const featuredPosts = featuredPage?.list || [];

  const handleSelectionChange = useCallback(
    (tabId: TabId) => {
      const index = tabs.findIndex((tab) => tab.id === tabId);

      if (index === -1) {
        return;
      }

      setSelectedTab(tabId);
      api?.scrollTo(index);

      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tabId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [api, searchParams, pathname, router]
  );

  // Sync the Carousel position instantly on initial load if tabFromUrl differs
  useEffect(() => {
    if (!api) {
      return;
    }

    const index = tabs.findIndex((tab) => tab.id === tabFromUrl);
    if (index !== -1 && api.selectedScrollSnap() !== index) {
      api.scrollTo(index, true); // Snap instantly with zero sliding flash
    }
  }, [api, tabFromUrl]);

  // Synchronize carousel manual swiping / scrolling gestures back to URL query parameters
  useEffect(() => {
    if (!api) {
      return;
    }

    const handleSelect = () => {
      const index = api.selectedScrollSnap();
      const tab = tabs[index];

      if (tab) {
        setSelectedTab(tab.id);
        const params = new URLSearchParams(searchParams.toString());
        if (params.get("tab") !== tab.id) {
          params.set("tab", tab.id);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
      }
    };

    handleSelect();

    api.on("select", handleSelect);
    api.on("reInit", handleSelect);

    return () => {
      api.off("select", handleSelect);
      api.off("reInit", handleSelect);
    };
  }, [api, searchParams, pathname, router]);

  return (
    <aside className="hidden min-w-0 lg:block">
      <div className="sticky top-6">
        <ArticleSegment selectedKey={selectedTab} onSelectionChange={handleSelectionChange} />
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            containScroll: "trimSnaps",
            dragFree: false,
            loop: false,
            skipSnaps: false,
          }}
          className="mt-5 w-full"
        >
          <Carousel.Content>
            <Carousel.Item>
              <ScrollShadow hideScrollBar>
                {relatedLoading ? (
                  <div className="flex h-40 items-center justify-center gap-2">
                    <Spinner size="sm" color="accent" />
                  </div>
                ) : !slug || relatedPosts.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center p-4 text-center">
                    <EmptyState size="sm">
                      <EmptyState.Header>
                        <EmptyState.Media variant="icon">
                          <Sparkles className="size-5" />
                        </EmptyState.Media>
                        <EmptyState.Title className="text-default-700 mt-1 text-sm font-semibold">
                          No Recommendations Yet
                        </EmptyState.Title>
                        <EmptyState.Description className="text-default-400 mt-1 max-w-[220px] text-xs">
                          We&apos;ll recommend related content as it becomes available.
                        </EmptyState.Description>
                      </EmptyState.Header>
                    </EmptyState>
                  </div>
                ) : (
                  <MotionTimeline
                    density="compact"
                    size="sm"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {relatedPosts.slice(0, 5).map((post, idx) => {
                      const readingTime = post.summary
                        ? Math.max(2, Math.ceil(post.summary.length / 40) + 1)
                        : 5;
                      const dateSource = post.publishedAt || new Date().toISOString();
                      const formattedDate = new Date(dateSource).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      });

                      const isCurrent = post.slug === slug;
                      const IconComponent = timelineIcons[idx % timelineIcons.length];

                      return (
                        <MotionTimelineItem
                          key={post.id}
                          status={isCurrent ? "current" : "default"}
                          align="start"
                          className="group min-w-0 cursor-pointer"
                          onClick={() => router.push(`/blog/${post.slug}`)}
                          variants={itemVariants}
                        >
                          <Timeline.Rail>
                            <Timeline.Marker aria-hidden="true">
                              {isCurrent ? (
                                <IconComponent className="transition-all duration-200" />
                              ) : (
                                <IconComponent className="group-hover:text-accent transition-all duration-200 group-hover:scale-125" />
                              )}
                            </Timeline.Marker>
                            <Timeline.Connector
                              className={`${isCurrent ? "bg-accent opacity-60" : "opacity-25"}`}
                            />
                          </Timeline.Rail>

                          <Timeline.Content className="w-full min-w-0 flex-1 pl-2">
                            <div className="flex w-full min-w-0 flex-col transition-all duration-300 ease-out group-hover:-translate-y-0.5">
                              <div className="w-full">
                                <h4
                                  title={post.title}
                                  className={`line-clamp-2 block w-full text-xs leading-snug font-semibold transition-colors duration-200 ${
                                    isCurrent
                                      ? "text-accent"
                                      : "text-default-800 group-hover:text-foreground"
                                  }`}
                                >
                                  {post.title}
                                </h4>
                              </div>

                              {post.summary && (
                                <p className="text-default-400 mt-1 line-clamp-2 text-[11px] leading-relaxed font-normal">
                                  {post.summary}
                                </p>
                              )}

                              <div className="text-default-400 mt-1.5 flex items-center gap-1.5 text-[10px] font-medium">
                                {post.category && (
                                  <>
                                    <span className="text-accent font-semibold">
                                      {post.category.name}
                                    </span>
                                    <span>·</span>
                                  </>
                                )}
                                <span>{formattedDate}</span>
                                <span>·</span>
                                <span>{readingTime} min read</span>
                              </div>
                            </div>
                          </Timeline.Content>
                        </MotionTimelineItem>
                      );
                    })}
                  </MotionTimeline>
                )}
              </ScrollShadow>
            </Carousel.Item>

            <Carousel.Item>
              <ScrollShadow hideScrollBar className="max-h-80">
                {featuredLoading ? (
                  <div className="flex h-40 items-center justify-center gap-2">
                    <Spinner size="sm" color="accent" />
                  </div>
                ) : featuredPosts.length === 0 ? (
                  <EmptyState size="sm" className="p-4">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <Flame className="size-5" />
                      </EmptyState.Media>
                      <EmptyState.Title className="text-default-700 mt-1 text-sm font-semibold">
                        No Top Picks Yet
                      </EmptyState.Title>
                      <EmptyState.Description className="text-default-400 mt-1 max-w-55 text-xs">
                        Featured posts will appear here once they are selected.
                      </EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                ) : (
                  <MotionListBox
                    aria-label="Featured Articles"
                    variants={listBoxContainerVariants}
                    initial="hidden"
                    animate="visible"
                    onAction={(key) => router.push(`/blog/${key}`)}
                  >
                    {featuredPosts.slice(0, 5).map((post, idx) => {
                      const readingTime = post.summary
                        ? Math.max(2, Math.ceil(post.summary.length / 40) + 1)
                        : 5;
                      const dateSource = post.publishedAt || new Date().toISOString();
                      const formattedDate = new Date(dateSource).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      });

                      return (
                        <MotionListBoxItem
                          key={post.id}
                          id={post.slug}
                          textValue={post.title}
                          variants={listBoxItemVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{
                            type: "spring",
                            stiffness: 120,
                            damping: 20,
                            mass: 0.6,
                            delay: 0.15 + idx * 0.08,
                          }}
                          whileHover={{
                            x: 4,
                            transition: {
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            },
                          }}
                          className="group flex w-full min-w-0 items-center gap-3 transition-colors duration-300"
                        >
                          <div className="bg-default-100 text-default-500 group-hover:bg-accent/10 group-hover:text-accent flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold transition-all duration-300 group-hover:scale-105">
                            {String(idx + 1).padStart(2, "0")}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <Label
                              title={post.title}
                              className="text-default-800 group-hover:text-foreground block w-full truncate text-sm font-medium transition-colors duration-200"
                            >
                              {post.title}
                            </Label>

                            <Description className="text-default-400 group-hover:text-default-500 flex items-center gap-2 text-[11px] font-normal transition-colors duration-200">
                              <span>{formattedDate}</span>

                              <span className="opacity-50">•</span>

                              <span>{readingTime} min read</span>
                            </Description>
                          </div>

                          {/* Views */}

                          <div className="text-default-400 group-hover:text-accent flex shrink-0 items-center gap-1 text-[11px] font-medium transition-all duration-300">
                            <Eye className="size-3.5 transition-transform duration-300 group-hover:scale-110" />

                            <span>{post.views}</span>
                          </div>

                          <ListBox.ItemIndicator />
                        </MotionListBoxItem>
                      );
                    })}
                  </MotionListBox>
                )}
              </ScrollShadow>
            </Carousel.Item>

            {/* Read Next tab: Mock user profiles */}
            <Carousel.Item>
              <ListBox aria-label="Users" onAction={(key) => console.log(`Selected user: ${key}`)}>
                {mockUsers.map((user) => (
                  <ListBox.Item
                    key={user.id}
                    id={user.id}
                    textValue={user.name}
                    className="group hover:bg-default-50/80 flex w-full min-w-0 cursor-pointer items-center rounded-xl p-2 transition-all duration-200 active:scale-[0.98]"
                  >
                    <ItemCard variant="transparent" className="flex w-full items-center gap-3 p-0">
                      <ItemCard.Icon className="flex shrink-0">
                        <Avatar size="sm" className="size-8 shrink-0">
                          <Avatar.Image src={user.avatarUrl} alt={user.name} />
                          <Avatar.Fallback>{user.name[0]}</Avatar.Fallback>
                        </Avatar>
                      </ItemCard.Icon>

                      <ItemCard.Content className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <ItemCard.Title className="text-default-800 group-hover:text-foreground block w-full truncate text-sm font-medium transition-colors duration-200">
                          {user.name}
                        </ItemCard.Title>

                        <ItemCard.Description className="text-default-400 group-hover:text-default-500 text-[11px] font-normal transition-colors duration-200">
                          {user.email}
                        </ItemCard.Description>
                      </ItemCard.Content>

                      <ItemCard.Action className="flex shrink-0 items-center">
                        <span className="text-default-400 group-hover:text-accent text-[11px] font-medium transition-colors duration-200">
                          Creator
                        </span>
                      </ItemCard.Action>
                    </ItemCard>

                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Carousel.Item>
          </Carousel.Content>
        </Carousel>
      </div>
    </aside>
  );
}

interface ArticleSegmentProps {
  selectedKey: TabId;
  onSelectionChange: (key: TabId) => void;
}

function ArticleSegment({ selectedKey, onSelectionChange }: ArticleSegmentProps) {
  return (
    <Segment
      aria-label="Article navigation"
      selectedKey={selectedKey}
      onSelectionChange={(key) => {
        onSelectionChange(String(key) as TabId);
      }}
      variant="ghost"
      className="w-full"
    >
      {tabs.map((tab) => (
        <Segment.Item key={tab.id} id={tab.id} style={{ gap: 0 }} className="w-auto">
          {({ isSelected }) => (
            <>
              <Icon icon={tab.icon} className="shrink-0 text-base" />

              <span
                style={{
                  gridTemplateColumns: isSelected ? "1fr" : "0fr",
                  opacity: isSelected ? 1 : 0,
                }}
                className="inline-grid min-w-0 transition-all duration-200 ease-out motion-reduce:transition-none"
              >
                <span
                  style={{
                    paddingInlineStart: isSelected ? "0.375rem" : 0,
                  }}
                  className="min-w-0 overflow-hidden whitespace-nowrap transition-[padding] duration-200 ease-out motion-reduce:transition-none"
                >
                  {tab.label}
                </span>
              </span>
            </>
          )}
        </Segment.Item>
      ))}
    </Segment>
  );
}
