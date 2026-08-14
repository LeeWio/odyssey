"use client";

import { useState, useEffect } from "react";
import { BookOpen, PencilToSquare } from "@gravity-ui/icons";
import { Button, Card, Chip, Typography } from "@heroui/react";
import { EmojiReactionButton, Rating } from "@heroui-pro/react";
import { motion } from "motion/react";

import { CommentSystem } from "@/components/comment/comment-system";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function GuestbookPage() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // local states for rating and reactions
  const [rating, setRating] = useState<number>(0);
  const [reactions, setReactions] = useState<Record<string, { count: number; selected: boolean }>>({
    "❤️": { count: 42, selected: false },
    "🎉": { count: 18, selected: false },
    "👍": { count: 24, selected: false },
    "🤯": { count: 15, selected: false },
    "🔥": { count: 31, selected: false },
  });

  // Hydrate states from localStorage safely
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedRating = localStorage.getItem("odyssey-rating");
    if (savedRating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRating(Number(savedRating));
    }

    const savedReactions = localStorage.getItem("odyssey-reactions");
    if (savedReactions) {
      try {
        const parsed = JSON.parse(savedReactions) as Record<string, boolean>;
        setReactions((current) => {
          const updated = { ...current };
          Object.keys(parsed).forEach((emoji) => {
            if (updated[emoji]) {
              updated[emoji] = {
                count: parsed[emoji] ? updated[emoji].count + 1 : updated[emoji].count,
                selected: parsed[emoji],
              };
            }
          });
          return updated;
        });
      } catch (err) {
        console.error("Failed to parse reactions from localStorage", err);
      }
    }
  }, []);

  const handleRatingChange = (newValue: number) => {
    setRating(newValue);
    localStorage.setItem("odyssey-rating", String(newValue));
  };

  const toggleReaction = (emoji: string) => {
    setReactions((current) => {
      const entry = current[emoji];
      if (!entry) return current;

      const selected = !entry.selected;
      const count = selected ? entry.count + 1 : entry.count - 1;

      const updated = {
        ...current,
        [emoji]: { count, selected },
      };

      // persist selected keys to localStorage
      const selectionMap: Record<string, boolean> = {};
      Object.entries(updated).forEach(([key, value]) => {
        if (value.selected) selectionMap[key] = true;
      });
      localStorage.setItem("odyssey-reactions", JSON.stringify(selectionMap));

      return updated;
    });
  };

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <header className="border-default-200 grid gap-8 border-b pb-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="max-w-2xl">
            <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
              <BookOpen aria-hidden="true" className="size-4" />
              Visitor log
            </div>
            <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
              Leave a note before you go.
            </Typography>
            <Typography color="muted" type="body" className="mt-5 max-w-xl leading-7">
              Questions, small observations, and useful links are welcome. Every entry is reviewed
              before it becomes part of this public record.
            </Typography>
          </div>
          <Chip className="w-fit" size="sm" variant="soft">
            Moderated conversation
          </Chip>
        </header>

        {/* Playful Emotional Feedback Panel: Rating & Reactions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          className="mt-8"
        >
          <Card
            variant="secondary"
            className="border-default-200/50 bg-surface-secondary/20 rounded-2xl border p-6 shadow-sm"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Star Rating section */}
              <div className="flex flex-col gap-1.5">
                <Typography
                  type="body-sm"
                  weight="bold"
                  className="text-foreground text-muted/60 text-[10px] tracking-wide uppercase"
                >
                  Rate your Odyssey experience
                </Typography>
                <div className="flex items-center gap-3">
                  <Rating
                    aria-label="Platform Rating"
                    value={rating}
                    onValueChange={handleRatingChange}
                    size="md"
                    style={
                      { "--rating-active-color": "var(--color-accent)" } as React.CSSProperties
                    }
                  >
                    <Rating.Item value={1} />
                    <Rating.Item value={2} />
                    <Rating.Item value={3} />
                    <Rating.Item value={4} />
                    <Rating.Item value={5} />
                  </Rating>
                  {rating > 0 && (
                    <span className="text-accent font-mono text-xs font-semibold">
                      {rating} / 5
                    </span>
                  )}
                </div>
              </div>

              {/* Emoji Reaction button group */}
              <div className="flex shrink-0 flex-col gap-2">
                <Typography
                  type="body-sm"
                  weight="bold"
                  className="text-foreground text-muted/60 text-[10px] tracking-wide uppercase"
                >
                  React to the workspace
                </Typography>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(reactions).map(([emoji, { count, selected }]) => (
                    <EmojiReactionButton
                      key={emoji}
                      isSelected={selected}
                      onChange={() => toggleReaction(emoji)}
                      size="sm"
                    >
                      <EmojiReactionButton.Emoji>{emoji}</EmojiReactionButton.Emoji>
                      {count > 0 && <EmojiReactionButton.Count>{count}</EmojiReactionButton.Count>}
                    </EmojiReactionButton>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {!isAuthenticated ? (
          <div className="border-default-200 bg-surface-secondary mt-8 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <Typography type="body-sm" weight="semibold">
                Sign in to add an entry
              </Typography>
              <Typography color="muted" type="body-xs" className="mt-1">
                Reading is open to everyone. Sign in to leave a note or reply.
              </Typography>
            </div>
            <Button size="sm" onPress={() => dispatch(setLoginOpen(true))}>
              <PencilToSquare aria-hidden="true" className="size-4" />
              Sign in to write
            </Button>
          </div>
        ) : null}

        <section aria-label="Guestbook entries" className="mt-10">
          <CommentSystem isGuestbook />
        </section>
      </div>
    </div>
  );
}
