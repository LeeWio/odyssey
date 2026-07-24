"use client";

import { Button, Card, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Transition } from "motion/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const MotionCard = motion(Card);
const MotionButton = motion(Button);

const spring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 30,
};

type MusicMiniWidgetProps = {
  title: string;
  artist: string;
  cover: string;
  defaultPlaying?: boolean;
  onPlayChange?: (isPlaying: boolean) => void;
};

export function MusicMiniWidget({
  title,
  artist,
  cover,
  defaultPlaying = false,
  onPlayChange,
}: MusicMiniWidgetProps) {
  const [isPlaying, setIsPlaying] = useState(defaultPlaying);

  const togglePlay = () => {
    setIsPlaying((value) => {
      const next = !value;
      onPlayChange?.(next);
      return next;
    });
  };

  return (
    <MotionCard
      className="relative max-h-44 w-40 overflow-hidden select-none"
      aria-label={`Music player: ${title} by ${artist}`}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -3 }}
      transition={spring}
    >
      <Card.Header className="flex flex-row items-start justify-between p-0">
        <motion.img
          alt={`${title} - ${artist}`}
          src={cover}
          className="ring-foreground/10 size-12 rounded-xl object-cover shadow-sm ring-1"
          whileHover={{ scale: 1.06, rotate: -2 }}
          transition={spring}
        />

        <motion.div
          animate={
            isPlaying ? { rotate: [0, -8, 6, 0], scale: [1, 1.08, 1] } : { rotate: 0, scale: 1 }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Icon icon="solar:music-note-bold" className="text-muted/80 size-5" />
        </motion.div>
      </Card.Header>

      <Card.Content className="gap-0 p-0">
        <Typography weight="bold" color="default" className="truncate leading-tight">
          {title}
        </Typography>

        <Typography color="muted" type="body-xs" className="truncate">
          {artist}
        </Typography>
      </Card.Content>

      <Card.Footer>
        <MotionButton
          size="sm"
          variant={isPlaying ? "secondary" : "tertiary"}
          fullWidth
          className="transition-colors"
          aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
          onPress={togglePlay}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={spring}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isPlaying ? "pause-icon" : "play-icon"}
              initial={{ opacity: 0, scale: 0.75, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.75, rotate: 12 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="flex items-center"
            >
              <Icon
                icon={isPlaying ? "solar:pause-bold" : "solar:play-bold"}
                className="size-4 shrink-0"
              />
            </motion.span>
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isPlaying ? "pause-text" : "play-text"}
              initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="inline-block"
            >
              {isPlaying ? "Pause" : "Play"}
            </motion.span>
          </AnimatePresence>
        </MotionButton>
      </Card.Footer>
    </MotionCard>
  );
}
