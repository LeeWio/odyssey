"use client";

import { createPageReveal } from "@/lib/motion";

import { Icon } from "@iconify/react";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Tabs, Card, Chip, Skeleton, Typography } from "@heroui/react";
import { MotionChip, MotionTypography } from "@/components/ui";
import Image from "next/image";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { ArticleCover } from "@/components/card/article-cover";

// Sub-components from our modular features
import BlogFeed from "@/features/blog/feed/blog-feed";
import { ColumnsIndex } from "@/features/column";
import { ArchivePage } from "@/features/archive";
import { ExplorePage } from "@/features/explore";

// API hooks to fetch fresh content for the featured tab
import { useGetFeaturedPostsQuery, useGetPublicPostsQuery } from "@/lib/features/post";

function formatDate(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ChroniclePage() {
  const t = useTranslations("Blog");
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion() ?? false;

  const { reveal } = createPageReveal(shouldReduceMotion);
  const [activeTab, setActiveTab] = useState<string>("featured");

  const { data: featuredData, isLoading: isFeaturedLoading } = useGetFeaturedPostsQuery({
    page: 0,
    size: 1,
  });
  const { data: recentData, isLoading: isRecentLoading } = useGetPublicPostsQuery({
    page: 0,
    size: 3,
  });

  const featuredPost = featuredData?.list?.[0];
  const recentPosts = recentData?.list ?? [];

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
                    <Chip color="accent" size="sm" variant="soft" className="w-fit">
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
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
          >
            <Tabs.ListContainer className="bg-transparent p-0">
              <Tabs.List aria-label={t("sections")} className="gap-6 sm:gap-8">
                <Tabs.Tab id="featured" className="h-12 px-1 text-sm font-medium">
                  {t("featured")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="explore" className="h-12 px-1 text-sm font-medium">
                  {t("exploreFilters")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="orbit" className="h-12 px-1 text-sm font-medium">
                  {t("orbitFeed")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="columns" className="h-12 px-1 text-sm font-medium">
                  {t("columns")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="archive" className="h-12 px-1 text-sm font-medium">
                  {t("timelineArchive")}
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {/* Panel 1: Featured Hub (Dynamic Cinematic Collage) */}
            <Tabs.Panel id="featured" className="mt-8 outline-none">
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
                            className="flex h-full flex-col overflow-hidden p-0 transition-shadow duration-300 hover:shadow-lg"
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
                                <Chip size="sm" variant="soft" className="w-fit">
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
                                {formatDate(post.createdAt, locale, t("recentlyPublished"))}
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
            <Tabs.Panel id="explore" className="outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <ExplorePage embedded />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 3: Orbit Logs Feed */}
            <Tabs.Panel id="orbit" className="outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <BlogFeed embedded />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 4: Columns index */}
            <Tabs.Panel id="columns" className="outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <ColumnsIndex embedded />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 5: Timeline Archive */}
            <Tabs.Panel id="archive" className="outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <ArchivePage embedded />
              </motion.div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </PageFrame>
  );
}
