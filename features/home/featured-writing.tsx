"use client";

import { createPageReveal } from "@/lib/motion";
import { Section } from "@/components/layout/section";
import {
  HOME_CAROUSEL_SLIDE,
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER_CENTERED,
  HOME_SECTION_TITLE,
} from "./layout";

import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";

import { SectionLoadError } from "./section-load-error";
import { Chip, Link, Skeleton, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { useNearViewport } from "@/hooks/use-near-viewport";
import { useGetFeaturedPostsQuery } from "@/lib/features/post";
import { useTranslations } from "next-intl";

const FeaturedWritingCarousel = dynamic(
  () => import("./featured-writing-carousel").then((module) => module.FeaturedWritingCarousel),
  { loading: FeaturedWritingPlaceholder }
);

function FeaturedWritingPlaceholder() {
  return (
    <div aria-hidden="true">
      <div className="-ml-4 flex overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className={`${HOME_CAROUSEL_SLIDE} shrink-0`}>
            <Skeleton className="aspect-[16/10] min-h-64 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-8" />
    </div>
  );
}

export function FeaturedWriting() {
  const t = useTranslations("Home");
  const { ref, isNear } = useNearViewport<HTMLDivElement>();
  const shouldReduceMotion = useReducedMotionPreference();
  const { presence } = createPageReveal(shouldReduceMotion);

  const {
    data: featuredPosts,
    isLoading,
    isUninitialized,
    isFetching,
    isError,
    refetch,
  } = useGetFeaturedPostsQuery({ page: 0, size: 12 }, { skip: !isNear });

  const posts = featuredPosts?.list;
  const isPending = isUninitialized || isLoading;

  if (!isPending && !isFetching && !isError && !posts?.length) return null;

  return (
    <Section id="writing" aria-labelledby="writing-title">
      <header className={HOME_SECTION_HEADER_CENTERED}>
        <motion.div {...presence(0, 10)}>
          <Chip color="accent" size="sm" variant="soft">
            {t("writing.eyebrow")}
          </Chip>
        </motion.div>
        <motion.div {...presence()}>
          <Typography id="writing-title" type="h2" weight="bold" className={HOME_SECTION_TITLE}>
            {t("writing.title")}
          </Typography>
        </motion.div>
        <motion.div {...presence(0.04, 14)}>
          <Typography color="muted" type="body" className={HOME_SECTION_DESCRIPTION}>
            {t("writing.description")}
          </Typography>
        </motion.div>
        <motion.div {...presence(0.08, 14)}>
          <Link className="mt-2 text-sm no-underline" href="/single">
            {t("writing.browseAll")}
            <Link.Icon aria-hidden="true">
              <Icon icon="gravity-ui:arrow-up-right" />
            </Link.Icon>
          </Link>
        </motion.div>
      </header>

      <motion.div ref={ref} className={HOME_SECTION_CONTENT} {...presence(0.08, 16)}>
        {(isError || (isFetching && !isLoading && !posts?.length)) && (
          <SectionLoadError
            subject="writing"
            isRetrying={isFetching}
            hasContent={Boolean(posts?.length)}
            onRetry={() => void refetch()}
          />
        )}
        {isPending && !posts?.length ? (
          <FeaturedWritingPlaceholder />
        ) : posts?.length ? (
          <FeaturedWritingCarousel posts={posts.slice(0, 12)} />
        ) : null}
      </motion.div>
    </Section>
  );
}
