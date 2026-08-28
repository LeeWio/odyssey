"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Tabs, Card, Chip, Skeleton, Typography } from "@heroui/react";
import { MotionChip, MotionTypography } from "@/components/ui";
import Image from "next/image";
import Link from "next/link";
import { Eye } from "@gravity-ui/icons";

// Sub-components from our modular features
import { BlogFeed } from "@/features/blog";
import { ColumnsIndex } from "@/features/column";
import { ArchivePage } from "@/features/archive";
import { ExplorePage } from "@/features/explore";

// API hooks to fetch fresh content for the featured tab
import { useGetFeaturedPostsQuery, useGetPublicPostsQuery } from "@/features/blog";

const easeOut = [0.22, 1, 0.36, 1] as const;

function formatDate(value?: string | null) {
  if (!value) return "Recently published";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ChroniclePage() {
  const shouldReduceMotion = useReducedMotion() ?? false;
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

  const reveal = (delay = 0, distance = 18) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.65, delay, ease: easeOut },
  });

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        {/* Cinematic Header matching Homepage */}
        <header className="flex flex-col items-center text-center">
          <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
            The Chronicle
          </MotionChip>
          <MotionTypography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] leading-[0.98] tracking-[-0.055em]"
            {...reveal(0.12)}
          >
            Writing, structured & free.
          </MotionTypography>
          <MotionTypography
            color="muted"
            type="body"
            className="mt-4 max-w-xl leading-relaxed text-balance"
            {...reveal(0.2, 12)}
          >
            Field notes on design systems, accessible systems engineering, and the architectural
            logs of a technical odyssey.
          </MotionTypography>
        </header>

        {/* High-Aesthetic Tabs Bar */}
        <div className="mt-12 flex justify-center">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full max-w-4xl"
          >
            <Tabs.ListContainer className="border-default-100 border-b bg-transparent p-0">
              <Tabs.List aria-label="Chronicle sections" className="gap-6 sm:gap-8">
                <Tabs.Tab id="featured" className="h-12 px-1 text-sm font-medium">
                  Featured
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="explore" className="h-12 px-1 text-sm font-medium">
                  Explore & Filters
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="orbit" className="h-12 px-1 text-sm font-medium">
                  Orbit Feed
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="columns" className="h-12 px-1 text-sm font-medium">
                  Columns
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="archive" className="h-12 px-1 text-sm font-medium">
                  Timeline Archive
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {/* Panel 1: Featured Hub (Dynamic Cinematic Collage) */}
            <Tabs.Panel id="featured" className="mt-10 outline-none">
              <motion.div className="space-y-16" {...reveal(0.05, 10)}>
                {/* Section A: Featured Essay (Cinematic Banner Card) */}
                <div>
                  {isFeaturedLoading ? (
                    <Card variant="secondary" className="overflow-hidden p-0">
                      <Skeleton className="aspect-[16/9] w-full" />
                    </Card>
                  ) : featuredPost ? (
                    <Link
                      className="group block no-underline"
                      href={`/single/${featuredPost.slug}`}
                    >
                      <Card
                        variant="secondary"
                        className="relative overflow-hidden p-0 transition-shadow duration-300 hover:shadow-xl"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12">
                          {/* Image Visual Column */}
                          <div className="relative aspect-video w-full overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[28rem]">
                            <Image
                              alt=""
                              aria-hidden="true"
                              className="scale-105 object-cover opacity-25 blur-2xl saturate-75"
                              fill
                              src="/IMG_5332.JPG"
                            />
                            <div className="from-background/10 via-surface-secondary/70 to-surface-secondary absolute inset-0 bg-linear-to-b lg:bg-linear-to-r" />
                            {/* Accent Visual */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-foreground/5 font-mono text-7xl font-black italic select-none">
                                FEATURED
                              </span>
                            </div>
                          </div>

                          {/* Detail Content Column */}
                          <div className="flex flex-col justify-center p-8 sm:p-10 lg:col-span-5">
                            <Chip color="accent" size="sm" variant="soft" className="w-fit">
                              Highlight
                            </Chip>
                            <Card.Header className="mt-4 p-0">
                              <Card.Title className="group-hover:text-accent text-3xl leading-tight font-bold tracking-[-0.03em] transition-colors sm:text-4xl">
                                {featuredPost.title}
                              </Card.Title>
                              {featuredPost.summary ? (
                                <Card.Description className="mt-3 text-sm leading-relaxed text-balance">
                                  {featuredPost.summary}
                                </Card.Description>
                              ) : null}
                            </Card.Header>

                            <Typography color="muted" type="body-xs" className="mt-6 tabular-nums">
                              Published {formatDate(featuredPost.publishedAt)}
                            </Typography>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ) : null}
                </div>

                {/* Section B: Recent Essays Grid */}
                <div>
                  <div className="mb-6 flex items-end justify-between">
                    <div>
                      <Typography type="h3" weight="bold" className="tracking-tight">
                        Recent Logs
                      </Typography>
                      <Typography color="muted" type="body-sm" className="mt-1">
                        Latest updates and field notes from the orbital logger.
                      </Typography>
                    </div>
                  </div>

                  {isRecentLoading ? (
                    <div className="grid gap-6 md:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
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
                    <div className="grid gap-6 md:grid-cols-3">
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
                                {formatDate(post.createdAt)}
                              </span>
                              <span className="text-muted flex items-center gap-1.5 font-mono text-[10px] tabular-nums">
                                <Eye className="size-3" />
                                {post.views.toLocaleString()}
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
                <ExplorePage />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 3: Orbit Logs Feed */}
            <Tabs.Panel id="orbit" className="outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <BlogFeed />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 4: Columns index */}
            <Tabs.Panel id="columns" className="outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <ColumnsIndex />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 5: Timeline Archive */}
            <Tabs.Panel id="archive" className="outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <ArchivePage />
              </motion.div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
