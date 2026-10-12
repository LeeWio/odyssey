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
      <PageFrame className="bg-background mx-auto max-w-4xl">
        <header className="border-default-200 max-w-2xl border-b pb-9">
          <motion.div className="flex flex-wrap gap-2" {...reveal(0, 10)}>
            <Chip size="sm" variant="secondary">
              {t("eyebrow")}
            </Chip>
            <Chip size="sm" variant="soft">
              {t("moderated")}
            </Chip>
          </motion.div>
          <motion.div {...reveal(0.06)}>
            <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
              {t("title")}
            </Typography>
          </motion.div>
          <motion.div {...reveal(0.12, 14)}>
            <Typography color="muted" type="body" className="mt-4 max-w-xl leading-7">
              {t("description")}
            </Typography>
          </motion.div>
        </header>

        {!isAuthenticated ? (
          <Card variant="secondary" className="border-accent/20 bg-surface-secondary/55 mt-8">
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
        ) : null}

        <section aria-label={t("entries")} className="border-default-200 mt-12 border-t pt-10">
          <CommentSystem isGuestbook />
        </section>
      </PageFrame>
    </Surface>
  );
}
