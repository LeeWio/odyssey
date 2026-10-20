"use client";

import { Section } from "@/components/layout/section";

import { createPageReveal } from "@/lib/motion";

import { Icon } from "@iconify/react";

import { SectionLoadError } from "./section-load-error";
import { Chip, Link, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { useGetPublicMomentsQuery } from "@/lib/features/moment";
import {
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER_CENTERED,
  HOME_SECTION_TITLE,
} from "./layout";

import { MomentsMasonry } from "./moments-masonry";

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
      <header className={HOME_SECTION_HEADER_CENTERED}>
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
            className={HOME_SECTION_TITLE}
          >
            This &amp; That
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className={HOME_SECTION_DESCRIPTION}>
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

      <motion.div className={HOME_SECTION_CONTENT} {...revealInView(0.2, 20)}>
        {(isError || (isFetching && !isLoading && recentMoments.length === 0)) && (
          <SectionLoadError
            subject="moments"
            isRetrying={isFetching}
            hasContent={recentMoments.length > 0}
            onRetry={() => void refetch()}
          />
        )}
        {recentMoments.length > 0 ? <MomentsMasonry moments={recentMoments} /> : null}
      </motion.div>
    </Section>
  );
}
