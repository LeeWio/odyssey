"use client";

import { createPageReveal } from "@/lib/motion";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { Button, Card, Chip, Separator, Surface, Typography } from "@heroui/react";
import { motion } from "motion/react";

import { CommentSystem } from "@/components/comment/comment-system";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

export function GuestbookPage() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const shouldReduceMotion = useReducedMotionPreference();
  const { reveal } = createPageReveal(shouldReduceMotion);

  return (
    <Surface variant="transparent" className="bg-background min-h-[100dvh] w-full">
      <div className="mx-auto w-full max-w-4xl px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
        <header className="max-w-2xl">
          <motion.div className="flex flex-wrap gap-2" {...reveal(0, 10)}>
            <Chip size="sm" variant="secondary">
              Guestbook
            </Chip>
            <Chip size="sm" variant="soft">
              Moderated conversation
            </Chip>
          </motion.div>
          <motion.div {...reveal(0.06)}>
            <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
              Leave a note before you go.
            </Typography>
          </motion.div>
          <motion.div {...reveal(0.12, 14)}>
            <Typography color="muted" type="body" className="mt-5 max-w-xl leading-7">
              Questions, small observations, and useful links are welcome. Every entry is reviewed
              before it becomes part of this public record.
            </Typography>
          </motion.div>
        </header>

        <Separator className="mt-10" />

        {!isAuthenticated ? (
          <Card variant="secondary" className="mt-8">
            <Card.Header>
              <Card.Title className="text-base">Sign in to add an entry</Card.Title>
              <Card.Description>
                Reading is open to everyone. Sign in to leave a note or reply.
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Button size="sm" onPress={() => dispatch(setLoginOpen(true))}>
                Sign in to write
              </Button>
            </Card.Footer>
          </Card>
        ) : null}

        <section aria-label="Guestbook entries" className="mt-10">
          <CommentSystem isGuestbook />
        </section>
      </div>
    </Surface>
  );
}
