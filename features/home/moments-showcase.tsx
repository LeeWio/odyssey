"use client";

import { Section } from "@/components/layout/section";
import { createPageReveal } from "@/lib/motion";
import { Chip, Link, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { useGetPublicMomentsQuery, type MomentResponse } from "@/lib/features/moment";
import { useTranslations } from "next-intl";
import {
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER_CENTERED,
  HOME_SECTION_TITLE,
  MOMENTS_SHOWCASE_LIMIT,
} from "./layout";

import { MomentsMasonry } from "./moments-masonry";
import { SectionLoadError } from "./section-load-error";

export function MomentsShowcase({ moments }: { moments: MomentResponse[] | null }) {
  const t = useTranslations("Home");
  const shouldReduceMotion = useReducedMotionPreference();
  const { revealInView } = createPageReveal(shouldReduceMotion);
  const query = useGetPublicMomentsQuery(
    { page: 0, size: MOMENTS_SHOWCASE_LIMIT },
    { skip: moments !== null }
  );
  const recentMoments = (moments ?? query.data?.list ?? []).slice(0, MOMENTS_SHOWCASE_LIMIT);

  const showError =
    query.isError || (query.isFetching && !query.isLoading && !recentMoments.length);
  if (recentMoments.length === 0 && !showError) return null;

  return (
    <Section id="moments-showcase" aria-labelledby="moments-showcase-title">
      <header className={HOME_SECTION_HEADER_CENTERED}>
        <motion.div {...revealInView(0, 10)}>
          <Chip color="default" size="sm" variant="secondary">
            {t("moments.eyebrow")}
          </Chip>
        </motion.div>
        <motion.div {...revealInView(0.06)}>
          <Typography
            id="moments-showcase-title"
            type="h2"
            weight="bold"
            className={HOME_SECTION_TITLE}
          >
            <Link className="text-inherit no-underline" href="/moments">
              {t("moments.title")}
            </Link>
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className={HOME_SECTION_DESCRIPTION}>
            {t("moments.description")}
          </Typography>
        </motion.div>
      </header>

      <div className={HOME_SECTION_CONTENT}>
        {showError ? (
          <SectionLoadError
            subject="moments"
            hasContent={recentMoments.length > 0}
            isRetrying={query.isFetching}
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {recentMoments.length ? <MomentsMasonry moments={recentMoments} /> : null}
      </div>
    </Section>
  );
}
