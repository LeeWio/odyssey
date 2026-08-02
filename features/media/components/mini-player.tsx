"use client";

import { Button, Card, Slider } from "@heroui/react";
import { SkipBack, SkipForward, Play, Pause, Shuffle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import React, { useMemo } from "react";
import { useMediaPlayer } from "../hooks/use-media-player";

export const MiniPlayer: React.FC = () => {
  const {
    currentMedia,
    queue,
    currentIndex,
    playing,
    currentTime,
    duration,
    shuffle,
    toggle,
    toggleShuffle,
    next,
    previous,
    seek,
  } = useMediaPlayer();

  const currentTrack = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < queue.length) {
      return queue[currentIndex];
    }
    return null;
  }, [queue, currentIndex]);

  if (!currentMedia || !currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 50, filter: "blur(10px)" }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4"
      >
        <Card className="bg-background/80 border-small overflow-hidden border-white/20 shadow-xl backdrop-blur-md">
          <Card.Content className="p-3">
            <div className="flex items-center gap-4">
              {/* Cover */}
              <motion.div
                animate={playing ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="relative h-12 w-12 flex-shrink-0"
              >
                <Image
                  alt={currentTrack.title}
                  className="rounded-md object-cover"
                  height={48}
                  src={currentMedia.cover || "/placeholder-music.png"}
                  width={48}
                />
              </motion.div>

              {/* Info */}
              <div className="min-w-0 flex-grow">
                <h4 className="truncate text-sm font-semibold">{currentTrack.title}</h4>
                <p className="text-default-500 truncate text-xs">
                  {currentTrack.artist || currentMedia.title}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="tertiary"
                  color={shuffle ? "primary" : "default"}
                  onClick={toggleShuffle}
                >
                  <Shuffle size={16} />
                </Button>
                <Button isIconOnly size="sm" variant="tertiary" onClick={previous}>
                  <SkipBack size={16} fill="currentColor" />
                </Button>
                <Button isIconOnly size="md" variant="secondary" onClick={toggle}>
                  {playing ? (
                    <Pause size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" />
                  )}
                </Button>
                <Button isIconOnly size="sm" variant="tertiary" onClick={next}>
                  <SkipForward size={16} fill="currentColor" />
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-2 px-1">
              <Slider
                aria-label="Music progress"
                maxValue={duration || 100}
                minValue={0}
                value={currentTime}
                onChange={(val) => seek(val as number)}
              >
                <Slider.Track className="bg-default/20">
                  <Slider.Fill className="bg-foreground" />
                  <Slider.Thumb className="bg-foreground h-2 w-2 border-none shadow-none" />
                </Slider.Track>
              </Slider>
            </div>
          </Card.Content>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
