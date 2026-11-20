"use client";

import { createPageReveal } from "@/lib/motion";

import { Icon } from "@iconify/react";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { Tabs, Card, Chip, Skeleton, Typography } from "@heroui/react";
import { MotionChip, MotionTypography } from "@/components/ui";
import Image from "next/image";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { ArticleCover } from "@/components/card/article-cover";

// API hooks to fetch fresh content for the featured tab
import { useGetFeaturedPostsQuery, useGetPublicPostsQuery } from "@/lib/features/post";
import type { PublicJournalInitialData } from "@/lib/features/post/server";
import { useQueryState } from "@/lib/hooks/use-query-state";

const CHRONICLE_SECTIONS = ["featured", "explore", "orbit", "columns", "archive"] as const;
type ChronicleSection = (typeof CHRONICLE_SECTIONS)[number];

function ChroniclePanelFallback() {
  return (
    <div aria-busy="true" className="mt-8 grid min-h-80 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index} variant="secondary">
          <Card.Header>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-4 w-full" />
          </Card.Header>
        </Card>
      ))}
    </div>
  );
}

const ChronicleExplorePanel = dynamic(
  () => import("@/features/explore").then((module) => module.ExplorePage),
  { loading: ChroniclePanelFallback }
);
const ChronicleOrbitPanel = dynamic(() => import("@/features/blog/feed/blog-feed"), {
  loading: ChroniclePanelFallback,
});
const ChronicleColumnsPanel = dynamic(
  () => import("@/features/column").then((module) => module.ColumnsIndex),
  { loading: ChroniclePanelFallback }
);
const ChronicleArchivePanel = dynamic(
  () => import("@/features/archive").then((module) => module.ArchivePage),
  { loading: ChroniclePanelFallback }
);

function getChronicleSection(value: string | null): ChronicleSection {
  return CHRONICLE_SECTIONS.includes(value as ChronicleSection)
    ? (value as ChronicleSection)
    : "featured";
}

function formatDate(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ChroniclePage({ initialData }: { initialData: PublicJournalInitialData }) {
  const t = useTranslations("Blog");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const { searchParams, updateQuery } = useQueryState();

  const { reveal } = createPageReveal(shouldReduceMotion);
  const activeTab = getChronicleSection(searchParams.get("section"));

  const { data: featuredData, isLoading: isFeaturedLoading } = useGetFeaturedPostsQuery(
    {
      page: 0,
      size: 1,
    },
    { skip: Boolean(initialData.featured) }
  );
  const { data: recentData, isLoading: isRecentLoading } = useGetPublicPostsQuery(
    {
      page: 0,
      size: 3,
    },
    { skip: Boolean(initialData.latest) }
  );

  const featuredPost = (initialData.featured ?? featuredData)?.list?.[0];
  const recentPosts = (initialData.latest ?? recentData)?.list ?? [];

  const handleSectionChange = (key: React.Key) => {
    const section = getChronicleSection(String(key));
    updateQuery({ section: section === "featured" ? null : section });
  };

  return (
    <PageFrame className="bg-background">
      <div className="w-full">
        <header className="grid items-end gap-8 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
          <div>
            <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
              {t("chronicleEyebrow")}
            </MotionChip>
            <MotionTypography
              type="h1"
              weight="bold"
              className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em]"
              {...reveal(0.12)}
            >
              {t("chronicleTitle")}
            </MotionTypography>
            <MotionTypography
              color="muted"
              type="body"
              className="mt-4 max-w-sm leading-relaxed text-balance"
              {...reveal(0.2, 12)}
            >
              {t("chronicleDescription")}
            </MotionTypography>
          </div>

          {isFeaturedLoading ? (
            <Card variant="secondary" className="overflow-hidden p-0">
              <Skeleton className="aspect-[16/8] w-full" />
            </Card>
          ) : featuredPost ? (
            <motion.div {...reveal(0.16, 16)}>
              <Link className="group block no-underline" href={`/single/${featuredPost.slug}`}>
                <Card
                  variant="secondary"
                  className="grid overflow-hidden p-0 transition-shadow duration-300 hover:shadow-xl lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]"
                >
                  <div className="relative aspect-[16/9] min-h-64 overflow-hidden lg:aspect-auto">
                    <ArticleCover
                      animated={false}
                      presetId={featuredPost.shaderPreset}
                      seed={featuredPost.slug}
                    />
                  </div>
                  <Card.Header className="justify-end gap-4 p-6 sm:p-8">
                    <Chip color="accent" size="sm" variant="soft">
                      {t("highlight")}
                    </Chip>
                    <Card.Title className="group-hover:text-accent text-2xl leading-tight font-bold tracking-[-0.03em] transition-colors sm:text-4xl">
                      {featuredPost.title}
                    </Card.Title>
                    {featuredPost.summary ? (
                      <Card.Description className="line-clamp-3 text-sm leading-relaxed">
                        {featuredPost.summary}
                      </Card.Description>
                    ) : null}
                    <Typography color="muted" type="body-xs" className="tabular-nums">
                      {formatDate(featuredPost.publishedAt, locale, t("recentlyPublished"))}
                    </Typography>
                  </Card.Header>
                </Card>
              </Link>
            </motion.div>
          ) : null}
        </header>

        <div className="mt-12">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={handleSectionChange}
            className="w-full"
            variant="secondary"
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label={t("sections")} className="gap-6 sm:gap-8">
                <Tabs.Tab id="featured">
                  {t("featured")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="explore">
                  {t("exploreFilters")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="orbit">
                  {t("orbitFeed")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="columns">
                  {t("columns")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="archive">
                  {t("timelineArchive")}
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {/* Panel 1: Featured Hub (Dynamic Cinematic Collage) */}
            <Tabs.Panel id="featured" className="mt-8">
              <motion.div {...reveal(0.05, 10)}>
                <div>
                  <div className="mb-6 flex items-end justify-between gap-6">
                    <div>
                      <Typography type="h3" weight="bold" className="tracking-tight">
                        {t("recentLogs")}
                      </Typography>
                      <Typography color="muted" type="body-sm" className="mt-1">
                        {t("recentLogsHint")}
                      </Typography>
                    </div>
                  </div>

                  {isRecentLoading ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index} variant="secondary" className="overflow-hidden p-0">
                          <Skeleton className="aspect-video w-full" />
                          <Card.Header className="p-5">
                            <Skeleton className="h-5 w-20 rounded-md" />
                            <Skeleton className="mt-2 h-7 w-4/5 rounded-md" />
                          </Card.Header>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
                      {recentPosts.map((post) => (
                        <Link
                          key={post.id}
                          className="group block no-underline"
                          href={`/single/${post.slug}`}
                        >
                          <Card
                            variant="secondary"
                            className="h-full overflow-hidden p-0 transition-shadow duration-300 hover:shadow-lg"
                          >
                            <div className="bg-default-100 relative aspect-video w-full overflow-hidden">
                              <Image
                                alt=""
                                src="/IMG_4958.WEBP"
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="pointer-events-none absolute inset-0 border-b border-black/10 dark:border-white/10" />
                            </div>

                            <Card.Header className="p-5">
                              {post.category?.name ? (
                                <Chip size="sm" variant="soft">
                                  {post.category.name}
                                </Chip>
                              ) : null}
                              <Card.Title className="group-hover:text-accent mt-3 line-clamp-2 text-lg leading-snug font-bold transition-colors">
                                {post.title}
                              </Card.Title>
                              {post.summary ? (
                                <Card.Description className="mt-2 line-clamp-3 text-xs leading-relaxed">
                                  {post.summary}
                                </Card.Description>
                              ) : null}
                            </Card.Header>

                            <Card.Footer className="border-default-100/50 mt-auto flex items-center justify-between border-t p-5 pt-4">
                              <span className="text-muted/80 text-[10px] font-medium tracking-wide uppercase">
                                {formatDate(post.publishedAt, locale, t("recentlyPublished"))}
                              </span>
                              <span className="text-muted flex items-center gap-1.5 font-mono text-[10px] tabular-nums">
                                <Icon icon="gravity-ui:eye" className="size-3" />
                                {post.views.toLocaleString(locale)}
                              </span>
                            </Card.Footer>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </Tabs.Panel>

            {/* Panel 2: Explore & Filters */}
            <Tabs.Panel id="explore">
              <motion.div {...reveal(0.05, 10)}>
                <ChronicleExplorePanel embedded />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 3: Orbit Logs Feed */}
            <Tabs.Panel id="orbit">
              <motion.div {...reveal(0.05, 10)}>
                <ChronicleOrbitPanel embedded />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 4: Columns index */}
            <Tabs.Panel id="columns">
              <motion.div {...reveal(0.05, 10)}>
                <ChronicleColumnsPanel embedded />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 5: Timeline Archive */}
            <Tabs.Panel id="archive">
              <motion.div {...reveal(0.05, 10)}>
                <ChronicleArchivePanel embedded />
              </motion.div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </PageFrame>
  );
}
