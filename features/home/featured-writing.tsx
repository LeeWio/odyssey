"use client";

import { createPageReveal, pageEaseOut } from "@/lib/motion";
import { Section } from "@/components/layout/section";
import {
  HOME_CAROUSEL_SLIDE,
  HOME_PREVIEW_GRID,
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER_CENTERED,
  HOME_SECTION_TITLE,
} from "./layout";

import { Icon } from "@iconify/react";

import { SectionLoadError } from "./section-load-error";
import { Card, Chip, Link, Skeleton, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { Carousel } from "@heroui-pro/react/carousel";
import { useGetFeaturedPostsQuery } from "@/lib/features/post";
import { useLocale, useTranslations } from "next-intl";

const FEATURED_WASHES = [
  "bg-[radial-gradient(circle_at_20%_15%,#d7c4a3_0%,#8e7358_46%,#2c3338_100%)]",
  "bg-[radial-gradient(circle_at_80%_10%,#b7c7be_0%,#5d7a78_48%,#243038_100%)]",
  "bg-[radial-gradient(circle_at_30%_80%,#e2c2a4_0%,#a56b58_46%,#2a2428_100%)]",
  "bg-[radial-gradient(circle_at_70%_30%,#c9d3c2_0%,#6d7f72_50%,#1e2826_100%)]",
] as const;

const formatDate = (date: string | null | undefined, locale: string, fallback: string) => {
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

function FeaturedArticle({
  title,
  summary,
  slug,
  category,
  publishedAt,
  index,
}: {
  title: string;
  summary: string;
  slug: string;
  category: string;
  publishedAt?: string | null;
  index: number;
}) {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <Card className="group relative h-full overflow-hidden" variant="transparent">
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${FEATURED_WASHES[index % FEATURED_WASHES.length]}`}
      />
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative z-10 flex h-full flex-col">
        <Card.Header>
          <div className="flex items-center justify-between gap-3">
            <Chip color="accent" size="sm" variant="soft" className="bg-background/70">
              {category}
            </Chip>
            <Chip color="default" size="sm" variant="soft" className="bg-background/70">
              <Icon icon="gravity-ui:calendar" aria-hidden="true" className="size-3" />
              {formatDate(publishedAt, locale, t("writing.recently"))}
            </Chip>
          </div>
        </Card.Header>
        <Card.Content className="flex-1">
          <Card.Title className="group-hover:text-accent line-clamp-2 text-xl tracking-normal transition-colors">
            {title}
          </Card.Title>
          <Card.Description className="line-clamp-2 leading-6">{summary}</Card.Description>
        </Card.Content>
        <Card.Footer className="mt-auto">
          <Link href={`/single/${slug}`} className="text-sm no-underline">
            {t("writing.readEssay")}
            <Link.Icon aria-hidden="true">
              <Icon icon="gravity-ui:arrow-up-right" />
            </Link.Icon>
          </Link>
        </Card.Footer>
      </div>
    </Card>
  );
}

export function FeaturedWriting() {
  const t = useTranslations("Home");
  const shouldReduceMotion = useReducedMotionPreference();
  const { revealInView } = createPageReveal(shouldReduceMotion);

  const {
    data: featuredPosts,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetFeaturedPostsQuery({
    page: 0,
    size: 12,
  });

  const posts = featuredPosts?.list.slice(0, 12) ?? [];

  if (!isLoading && !isFetching && !isError && posts.length === 0) return null;

  return (
    <Section id="writing" aria-labelledby="writing-title">
      <header className={HOME_SECTION_HEADER_CENTERED}>
        <motion.div {...revealInView(0, 10)}>
          <Chip color="accent" size="sm" variant="soft">
            {t("writing.eyebrow")}
          </Chip>
        </motion.div>
        <motion.div {...revealInView(0.06)}>
          <Typography id="writing-title" type="h2" weight="bold" className={HOME_SECTION_TITLE}>
            {t("writing.title")}
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className={HOME_SECTION_DESCRIPTION}>
            {t("writing.description")}
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.16, 14)}>
          <Link className="mt-2 text-sm no-underline" href="/single">
            {t("writing.browseAll")}
            <Link.Icon aria-hidden="true">
              <Icon icon="gravity-ui:arrow-up-right" />
            </Link.Icon>
          </Link>
        </motion.div>
      </header>

      <motion.div className={HOME_SECTION_CONTENT} {...revealInView(0.2, 20)}>
        {(isError || (isFetching && !isLoading && posts.length === 0)) && (
          <SectionLoadError
            subject="writing"
            isRetrying={isFetching}
            hasContent={posts.length > 0}
            onRetry={() => void refetch()}
          />
        )}
        {isLoading && posts.length === 0 ? (
          <div className={HOME_PREVIEW_GRID}>
            {Array.from({ length: 12 }, (_, index) => (
              <Card
                key={index}
                variant="secondary"
                className="bg-surface-secondary/45 flex aspect-[16/10] min-h-64 flex-col justify-between overflow-hidden p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-7 w-4/5 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/5 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <Carousel opts={{ align: "start", loop: false }}>
            <Carousel.Content className="-ml-4 items-stretch">
              {posts.map((post, index) => (
                <Carousel.Item
                  key={post.id}
                  className={HOME_CAROUSEL_SLIDE}
                  data-testid="home-writing-slide"
                >
                  <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.28,
                      delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.2),
                      ease: pageEaseOut,
                    }}
                    className="aspect-[16/10] min-h-64 w-full"
                  >
                    <FeaturedArticle
                      title={post.title}
                      summary={post.summary || t("writing.fallbackSummary")}
                      slug={post.slug}
                      category={post.category?.name ?? t("writing.fallbackCategory")}
                      publishedAt={post.publishedAt}
                      index={index}
                    />
                  </motion.div>
                </Carousel.Item>
              ))}
            </Carousel.Content>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Carousel.Previous />
              <Carousel.Dots />
              <Carousel.Next />
            </div>
          </Carousel>
        ) : null}
      </motion.div>
    </Section>
  );
}
