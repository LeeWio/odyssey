"use client";

import { Icon } from "@iconify/react";

import dynamic from "next/dynamic";
import { SectionLoadError } from "./section-load-error";
import { Chip, Link, Skeleton, Typography } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { useGetPublicMomentsQuery } from "@/lib/features/moment";

const MomentsMasonry = dynamic(
  () =>
    import("@/components/home/moments-masonry").then((mod) => ({
      default: mod.MomentsMasonry,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/5] w-full rounded-2xl" />
        ))}
      </div>
    ),
  }
);

const MOMENTS_SHOWCASE_LIMIT = 18;

export function MomentsShowcase() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const revealInView = (delay = 0, distance = 20) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.65,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

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
    <section
      id="moments-showcase"
      aria-labelledby="moments-showcase-title"
      className="mx-auto w-full max-w-7xl scroll-mt-24 px-6 py-24 sm:py-32"
    >
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
            className="mt-4 text-[clamp(2rem,4vw,3.75rem)] tracking-[-0.04em]"
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: MOMENTS_SHOWCASE_LIMIT }, (_, index) => (
              <Skeleton key={index} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        ) : recentMoments.length > 0 ? (
          <MomentsMasonry moments={recentMoments} />
        ) : null}
      </motion.div>
    </section>
  );
}
