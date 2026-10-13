"use client";

import { createPageReveal } from "@/lib/motion";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { Button, Card, Chip, Surface, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { CommentSystem } from "@/components/comment/comment-system";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { PageFrame } from "@/components/layout/page-frame";

export function GuestbookPage() {
  const t = useTranslations("Guestbook");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const shouldReduceMotion = useReducedMotionPreference();
  const { reveal } = createPageReveal(shouldReduceMotion);

  return (
    <Surface variant="transparent" className="w-full">
      <PageFrame className="bg-background w-full">
        <header className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <div>
            <motion.div className="flex flex-wrap gap-2" {...reveal(0, 10)}>
              <Chip size="sm" variant="secondary">
                {t("eyebrow")}
              </Chip>
              <Chip size="sm" variant="soft">
                {t("moderated")}
              </Chip>
            </motion.div>
            <motion.div {...reveal(0.06)}>
              <Typography
                type="h1"
                weight="bold"
                className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-balance"
              >
                {t("title")}
              </Typography>
            </motion.div>
            <motion.div {...reveal(0.12, 14)}>
              <Typography color="muted" type="body" className="mt-4 max-w-xl leading-7">
                {t("description")}
              </Typography>
            </motion.div>
          </div>

          {!isAuthenticated ? (
            <Card variant="secondary" className="lg:justify-end">
              <Card.Header>
                <Card.Title className="text-base">{t("signInTitle")}</Card.Title>
                <Card.Description>{t("signInDescription")}</Card.Description>
              </Card.Header>
              <Card.Footer>
                <Button size="sm" onPress={() => dispatch(setLoginOpen(true))}>
                  {t("signInToWrite")}
                </Button>
              </Card.Footer>
            </Card>
          ) : (
            <div />
          )}
        </header>

        <section aria-label={t("entries")} className="mt-12">
          <CommentSystem isGuestbook />
        </section>
      </PageFrame>
    </Surface>
  );
}
