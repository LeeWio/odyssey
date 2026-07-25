"use client";

import { Book, Code, Flame, Heart, Sparkles } from "@gravity-ui/icons";
import { Card, Chip, Description, Label, ListBox, ScrollShadow, Spinner } from "@heroui/react";
import { Carousel, EmptyState, Segment, Timeline } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import type { EmblaCarouselType } from "embla-carousel";
import { motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useGetFeaturedPostsQuery, useGetRelatedPostsQuery } from "@/lib/features/post/post-api";
import { cn } from "@/lib/utils";

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
    icon: "gravity-ui:folder-open",
    id: "read-next",
    label: "Series Hub",
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

const COLLECTIONS = [
  {
    id: "digital-shelters",
    name: "极光数字避难所",
    count: 4,
    description: "数字排版与流体空间的交互美学",
    icon: "solar:shield-unique-bold",
  },
  {
    id: "tactile-typography",
    name: "反数码物理触觉",
    count: 7,
    description: "为什么屏幕也需要可触摸的纸张纤维",
    icon: "solar:hand-stars-bold",
  },
  {
    id: "interactive-gravity",
    name: "重力与阻尼微动效",
    count: 5,
    description: "探寻数字动画中的自然重力与阻力",
    icon: "solar:asteroid-bold",
  },
  {
    id: "editorial-curation",
    name: "高定社论出版物",
    count: 3,
    description: "重温经典实体排版的优雅格局与留白",
    icon: "solar:notebook-bold",
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

const MOCK_RELATED_POSTS = [
  {
    id: 1001,
    title: "微交互的力学：探寻 UI 动效中的‘弹性硬度’与‘重力阻力’",
    slug: "mechanics-of-micro-interactions",
    summary: "探讨如何使用 Framer Motion 中的 Spring 弹簧参数调试出最符合直觉的 UI 物理回弹感受。",
    publishedAt: new Date().toISOString(),
    views: 12040,
    likesCount: 84,
    category: { id: 1, name: "动效力学" },
  },
  {
    id: 1002,
    title: "触觉排版学：为何数字媒介需要可触摸的‘纸张纹理’？",
    slug: "editorial-tactility-and-paper-grain",
    summary:
      "SVG 分形噪声（Micro-noise）如何拯救高色面板的色彩断层并创造社论杂志般的实体摩擦触感。",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    views: 8940,
    likesCount: 52,
    category: { id: 2, name: "触觉排版" },
  },
  {
    id: 1003,
    title: "打造完美的‘暗黑空间’：高对比暗色调中的光影对比设计",
    slug: "building-perfect-dark-mode-spaces",
    summary: "深入剖析暗黑模式下的多层级阴影、冷紫色调氛围偏光、以及磨砂遮罩的遮蔽应用。",
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    views: 15400,
    likesCount: 110,
    category: { id: 3, name: "暗黑美学" },
  },
];

const MOCK_FEATURED_POSTS = [
  {
    id: 2001,
    title: "奥德赛体验指南：流体网格与不对称社论设计规约",
    slug: "odyssey-experience-guide",
    summary: "本指南为奥德赛设计规范，指导如何利用多列 CSS Grid 与粘性定位构建不规则排版层级。",
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    views: 24012,
    likesCount: 198,
    category: { id: 4, name: "设计规约" },
  },
  {
    id: 2002,
    title: "在喧嚣中守恒：论数字留白（Whitespace）在极简设计中的权重",
    slug: "whitespace-conservation-in-minimalist-design",
    summary:
      "探讨排版中‘呼吸面积’对用户认知带宽 of minimal design 的减压影响，以及如何让空白充盈着优雅的秩序感。",
    publishedAt: new Date(Date.now() - 345600000).toISOString(),
    views: 11045,
    likesCount: 92,
    category: { id: 5, name: "空间哲学" },
  },
];

export function ArticleSidebar({ slug }: ArticleSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [api, setApi] = useState<EmblaCarouselType>();

  // Determine initial active tab from the URL parameter (defaults to "for-you")
  const tabFromUrl = (searchParams.get("tab") as TabId) || "for-you";
  const [selectedTab, setSelectedTab] = useState<TabId>(tabFromUrl);

  // Fetch Recommended / Related posts (For You)
  const { data: serverRelatedPosts = [], isLoading: relatedLoading } = useGetRelatedPostsQuery(
    slug || "",
    { skip: !slug }
  );
  const relatedPosts = serverRelatedPosts.length > 0 ? serverRelatedPosts : MOCK_RELATED_POSTS;

  // Fetch Featured posts (Top Picks)
  const { data: featuredPage, isLoading: featuredLoading } = useGetFeaturedPostsQuery({
    page: 0,
    size: 5,
  });
  const serverFeaturedPosts = featuredPage?.list || [];
  const featuredPosts = serverFeaturedPosts.length > 0 ? serverFeaturedPosts : MOCK_FEATURED_POSTS;

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
    <aside className="sticky top-24 flex hidden h-fit min-w-0 flex-col gap-6 lg:block">
      {/* Editorial Epigraph Card as a Foreword */}
      <Card className="bg-default-50/5 border-default-100/50 group/quote hover:border-default-200/50 relative flex w-full flex-col gap-4 overflow-hidden rounded-2xl border p-6 text-left shadow-none transition-all duration-300">
        {/* Watermark Quote Icon */}
        <div className="pointer-events-none absolute top-0 right-0 -mt-4 -mr-2 opacity-[0.03] transition-opacity duration-500 select-none group-hover/quote:opacity-[0.06]">
          <Icon icon="lucide:quote" className="text-foreground size-24" />
        </div>

        <div className="flex items-center gap-2 select-none">
          <Icon icon="solar:heart-angle-bold" className="text-accent size-4 animate-pulse" />
          <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-neutral-400 uppercase">
            EPIGRAPH // 侧栏题记
          </span>
        </div>

        <p className="border-accent/30 border-l py-0.5 pl-3 font-serif text-[12px] leading-relaxed text-neutral-300 italic">
          “在无限滑动的嘈杂洪流里，我们建造起小小的、由文字与极光围合的避难所。只为让两颗在光缆两端跳动的灵魂，能在此处，呼吸一秒静谧。”
        </p>

        <div className="mt-1 flex justify-end pr-1">
          <span className="font-mono text-[9px] tracking-wider text-neutral-500 uppercase select-none">
            — ODYSSEY DIRECTORS // 主创寄语
          </span>
        </div>
      </Card>

      {/* Symmetrical Two-Word Segment & Carousel */}
      <div className="flex w-full flex-col">
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
                    className="pr-1"
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
                          align="center"
                          variants={itemVariants}
                        >
                          <Timeline.Rail>
                            <Timeline.Marker aria-hidden="true">
                              <IconComponent />
                            </Timeline.Marker>
                            <Timeline.Connector />
                          </Timeline.Rail>

                          <Timeline.Content className="w-full min-w-0 flex-1">
                            <button
                              type="button"
                              aria-current={isCurrent ? "page" : undefined}
                              aria-label={`Read ${post.title}`}
                              className={cn(
                                "group/article block w-full min-w-0 overflow-hidden rounded-md px-2 py-1.5 text-left transition-colors duration-150",
                                "focus-visible:ring-focus focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                                isCurrent ? "bg-default-100/45" : "hover:bg-default-100/25"
                              )}
                              onClick={() => router.push(`/single/${post.slug}`)}
                            >
                              <span className="flex w-full min-w-0 flex-col gap-1">
                                <span className="text-foreground group-hover/article:text-accent line-clamp-2 text-xs leading-5 font-medium transition-colors">
                                  {post.title}
                                </span>
                                {post.summary && (
                                  <span className="text-muted line-clamp-1 text-[11px] leading-4">
                                    {post.summary}
                                  </span>
                                )}

                                <span className="flex min-w-0 items-center gap-1.5">
                                  {post.category && (
                                    <Chip size="sm" variant={isCurrent ? "soft" : "tertiary"}>
                                      <Chip.Label>{post.category.name}</Chip.Label>
                                    </Chip>
                                  )}
                                  <time
                                    className="text-muted shrink-0 text-[11px] leading-4 tabular-nums"
                                    dateTime={dateSource}
                                  >
                                    {formattedDate}
                                  </time>
                                  <span className="text-muted shrink-0 text-[11px] leading-4">
                                    {readingTime} min
                                  </span>
                                </span>
                              </span>
                            </button>
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
                    selectionMode="none"
                    variants={listBoxContainerVariants}
                    initial="hidden"
                    animate="visible"
                    onAction={(key) => router.push(`/single/${key}`)}
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
                          className="group flex w-full min-w-0 items-center transition-colors duration-300"
                        >
                          <div className="group-hover:bg-accent/10 group-hover:text-accent flex size-8 shrink-0 items-center justify-center rounded-3xl font-mono font-semibold transition-all duration-300 group-hover:scale-105">
                            {String(idx + 1).padStart(2, "0")}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col">
                            <Label className="w-full truncate transition-colors duration-200">
                              {post.title}
                            </Label>
                            <Description>
                              <span>{formattedDate}</span>
                              <span>{readingTime} min read</span>
                            </Description>
                          </div>

                          <Chip color="success" variant="soft">
                            <Icon icon="gravity-ui:eye" />
                            <Chip.Label>{post.views}</Chip.Label>
                          </Chip>
                        </MotionListBoxItem>
                      );
                    })}
                  </MotionListBox>
                )}
              </ScrollShadow>
            </Carousel.Item>

            {/* Collections tab: Curated Series Index */}
            <Carousel.Item>
              <ScrollShadow hideScrollBar className="max-h-[380px]">
                <ListBox
                  aria-label="Collections"
                  className="flex w-full flex-col gap-1"
                  onAction={(key) => router.push(`/test/category?slug=${key}`)}
                >
                  {COLLECTIONS.map((col) => (
                    <ListBox.Item
                      key={col.id}
                      id={col.id}
                      textValue={col.name}
                      className="group hover:bg-default-100/50 flex w-full min-w-0 cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 outline-none select-none active:scale-[0.99]"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <div className="bg-default-100 border-default-200 group-hover:bg-accent/10 group-hover:border-accent/30 group-hover:text-accent flex size-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200">
                          <Icon
                            icon={col.icon}
                            className="group-hover:text-accent size-4 text-neutral-400 transition-colors"
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="group-hover:text-foreground truncate text-xs font-bold text-neutral-200 transition-colors">
                            {col.name}
                          </span>
                          <span className="mt-0.5 truncate text-[10px] leading-none text-neutral-500">
                            {col.description}
                          </span>
                        </div>
                      </div>

                      <Chip
                        size="sm"
                        variant="soft"
                        className="bg-default-100/80 group-hover:bg-accent/20 group-hover:text-accent h-5 px-2 py-0 font-mono text-[10px] font-bold transition-colors"
                      >
                        {col.count} Vol
                      </Chip>
                    </ListBox.Item>
                  ))}
                </ListBox>
              </ScrollShadow>
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
      size="sm"
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
