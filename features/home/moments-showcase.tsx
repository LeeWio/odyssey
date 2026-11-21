"use client";

import { Section } from "@/components/layout/section";
import { createPageReveal } from "@/lib/motion";
import { Chip, Link, Typography } from "@heroui/react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { useTranslations } from "next-intl";
import {
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER_CENTERED,
  HOME_SECTION_TITLE,
} from "./layout";

export function MomentsShowcase({ children }: { children: ReactNode }) {
  const t = useTranslations("Home");
  const shouldReduceMotion = useReducedMotionPreference();
  const { revealInView } = createPageReveal(shouldReduceMotion);

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

      <div className={HOME_SECTION_CONTENT}>{children}</div>
    </Section>
  );
}
