"use client";

import { createPageReveal, pageEaseOut } from "@/lib/motion";

import { Icon } from "@iconify/react";

import dynamic from "next/dynamic";
import { SectionLoadError } from "./section-load-error";
import { Card, Chip, Link, Skeleton, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { Carousel } from "@heroui-pro/react/carousel";
import { useGetFeaturedPostsQuery } from "@/lib/features/post";
import { useLocale, useTranslations } from "next-intl";

const Grainient = dynamic(() => import("@/components/background/grainient"), {
  ssr: false,
  loading: () => <div className="bg-surface-secondary absolute inset-0" aria-hidden />,
});

const formatDate = (date: string | null | undefined, locale: string, fallback: string) => {
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

function getGrainientProps(seed: string, index: number) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash = (hash + index * 2654435761) >>> 0;

  return {
    warpStrength: 0.7 + ((hash % 9) / 9) * 1.2,
    warpFrequency: 3.5 + ((hash % 11) / 11) * 5.5,
    warpSpeed: 1.1 + ((hash % 7) / 7) * 1.8,
    blendAngle: (hash % 280) - 140,
    rotationAmount: 240 + ((hash % 13) / 13) * 560,
    zoom: 0.7 + ((hash % 6) / 6) * 0.5,
    grainAmount: 0,
    grainScale: 1.8 + ((hash % 5) / 5) * 1.2,
    timeSpeed: 0.1 + (index % 3) * 0.025,
  };
}

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
      <Grainient
        {...getGrainientProps(slug, index)}
        grainAnimated={false}
        className="absolute inset-0 opacity-100"
      />
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative z-10 flex h-full flex-col">
        <Card.Header>
          <div className="flex items-center justify-between gap-3">
            <Chip
              color="accent"
              size="sm"
              variant="soft"
              className="bg-background/35 backdrop-blur-md"
            >
              {category}
            </Chip>
            <Chip
              color="default"
              size="sm"
              variant="soft"
              className="bg-background/35 backdrop-blur-md"
            >
              <Icon icon="gravity-ui:calendar" aria-hidden="true" className="size-3" />
              {formatDate(publishedAt, locale, t("writing.recently"))}
            </Chip>
          </div>
        </Card.Header>
        <Card.Content className="flex-1">
          <Card.Title className="group-hover:text-accent line-clamp-2 text-xl tracking-[-0.03em] transition-colors">
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
    size: 6,
  });

  const posts = featuredPosts?.list.slice(0, 6) ?? [];

  if (!isLoading && !isFetching && !isError && posts.length === 0) return null;

  return (
    <section
      id="writing"
      aria-labelledby="writing-title"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24 sm:px-10 sm:py-32"
    >
      <header className="flex flex-col items-center text-center">
        <motion.div {...revealInView(0, 10)}>
          <Chip color="accent" size="sm" variant="soft">
            {t("writing.eyebrow")}
          </Chip>
        </motion.div>
        <motion.div {...revealInView(0.06)}>
          <Typography
            id="writing-title"
            type="h2"
            weight="bold"
            className="mt-4 text-[clamp(2rem,4vw,3.75rem)] tracking-[-0.04em]"
          >
            {t("writing.title")}
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className="mt-3 max-w-xl leading-6">
            {t("writing.description")}
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.16, 14)}>
          <Link className="mt-2 text-sm no-underline" href="/blog">
            {t("writing.browseAll")}
            <Link.Icon aria-hidden="true">
              <Icon icon="gravity-ui:arrow-up-right" />
            </Link.Icon>
          </Link>
        </motion.div>
      </header>

      <motion.div className="mt-12" {...revealInView(0.2, 20)}>
        {(isError || (isFetching && !isLoading && posts.length === 0)) && (
          <SectionLoadError
            subject="writing"
            isRetrying={isFetching}
            hasContent={posts.length > 0}
            onRetry={() => void refetch()}
          />
        )}
        {isLoading && posts.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Card
                key={index}
                variant="secondary"
                className="bg-surface-secondary/45 flex aspect-[16/10] flex-col justify-between overflow-hidden p-5"
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
          <Carousel opts={{ align: "start", loop: posts.length > 3 }}>
            <Carousel.Content className="-ml-4 items-stretch">
              {posts.map((post, index) => (
                <Carousel.Item key={post.id} className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.65,
                      delay: index * 0.06,
                      ease: pageEaseOut,
                    }}
                    className="aspect-[16/10] w-full"
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
    </section>
  );
}
