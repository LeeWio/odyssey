"use client";

import { Section } from "@/components/layout/section";

import { createPageReveal } from "@/lib/motion";

import { Icon } from "@iconify/react";

import dynamic from "next/dynamic";
import { SectionLoadError } from "./section-load-error";
import { Chip, Link, Skeleton, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { useGetPublicMomentsQuery } from "@/lib/features/moment";

const MomentsMasonry = dynamic(
  () =>
    import("@/components/home/moments-masonry").then((mod) => ({
      default: mod.MomentsMasonry,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="[columns:20rem] gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="mb-5 break-inside-avoid">
            <Skeleton
              className={`w-full rounded-2xl ${index % 3 === 0 ? "aspect-[4/5]" : index % 3 === 1 ? "aspect-[5/6]" : "aspect-square"}`}
            />
          </div>
        ))}
      </div>
    ),
  }
);

const MOMENTS_SHOWCASE_LIMIT = 18;

export function MomentsShowcase() {
  const shouldReduceMotion = useReducedMotionPreference();
  const { revealInView } = createPageReveal(shouldReduceMotion);

  const {
    data: moments,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetPublicMomentsQuery({
    page: 0,
    size: MOMENTS_SHOWCASE_LIMIT,
  });

  const recentMoments = moments?.list.slice(0, MOMENTS_SHOWCASE_LIMIT) ?? [];
  if (!isLoading && !isFetching && !isError && recentMoments.length === 0) return null;

  return (
    <Section id="moments-showcase" aria-labelledby="moments-showcase-title">
      <header className="flex flex-col items-center text-center">
        <motion.div {...revealInView(0, 10)}>
          <Chip color="default" size="sm" variant="secondary">
            Moments
          </Chip>
        </motion.div>
        <motion.div {...revealInView(0.06)}>
          <Typography
            id="moments-showcase-title"
            type="h2"
            weight="bold"
            className="mt-4 text-3xl leading-tight tracking-normal text-balance sm:text-4xl"
          >
            This &amp; That
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className="mt-3 max-w-xl leading-6">
            A little of this, a little of that.
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.16, 14)}>
          <Link className="mt-2 text-sm no-underline" href="/moments">
            See all moments
            <Link.Icon aria-hidden="true">
              <Icon icon="gravity-ui:arrow-up-right" />
            </Link.Icon>
          </Link>
        </motion.div>
      </header>

      <motion.div className="mt-12" {...revealInView(0.2, 20)}>
        {(isError || (isFetching && !isLoading && recentMoments.length === 0)) && (
          <SectionLoadError
            subject="moments"
            isRetrying={isFetching}
            hasContent={recentMoments.length > 0}
            onRetry={() => void refetch()}
          />
        )}
        {isLoading && recentMoments.length === 0 ? (
          <div className="[columns:20rem] gap-5" aria-busy="true" role="status">
            {Array.from({ length: MOMENTS_SHOWCASE_LIMIT }, (_, index) => (
              <div key={index} className="mb-5 break-inside-avoid">
                <Skeleton
                  className={`w-full rounded-2xl ${index % 4 === 0 ? "h-64" : index % 4 === 1 ? "h-44" : index % 4 === 2 ? "h-52" : "h-36"}`}
                />
              </div>
            ))}
          </div>
        ) : recentMoments.length > 0 ? (
          <MomentsMasonry moments={recentMoments} />
        ) : null}
      </motion.div>
    </Section>
  );
}
