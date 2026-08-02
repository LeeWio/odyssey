"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@heroui/react";

import { useMediaPlayer } from "@/features/media/hooks/use-media-player";
import type { MediaItem } from "@/features/media/types";
import { Icon } from "@iconify/react";

interface MediaPlayButtonProps extends React.ComponentProps<typeof Button> {
  media: MediaItem;
  shuffle?: boolean;
}

export const MediaPlayButton: React.FC<MediaPlayButtonProps> = ({
  media,
  shuffle = false,
  ...props
}) => {
  const {
    currentMedia,
    playing,
    play,
    toggle,
    toggleShuffle,
    shuffle: isShuffleEnabled,
  } = useMediaPlayer();

  const isCurrent = useMemo(() => currentMedia?.id === media.id, [currentMedia, media.id]);

  const isPlaying = isCurrent && playing;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isCurrent) {
      toggle();

      return;
    }

    play(media);

    if (shuffle && !isShuffleEnabled) {
      toggleShuffle();
    } else if (!shuffle && isShuffleEnabled) {
      toggleShuffle();
    }
  };

  return (
    <motion.div
      animate={
        isPlaying
          ? {
              scale: [1, 1.04, 1],
            }
          : {
              scale: 1,
            }
      }
      transition={
        isPlaying
          ? {
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : {
              duration: 0.2,
            }
      }
    >
      <Button isIconOnly aria-label={isPlaying ? "Pause" : "Play"} onClick={handleClick} {...props}>
        <AnimatePresence mode="wait" initial={false}>
          {isPlaying ? (
            <motion.div
              key="pause"
              initial={{
                opacity: 0,
                scale: 0.6,
                rotate: -20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.6,
                rotate: 20,
              }}
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Icon icon="gravity-ui:pause-fill" />
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{
                opacity: 0,
                scale: 0.6,
                rotate: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.6,
                rotate: -20,
              }}
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Icon icon="gravity-ui:play-fill" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
};
