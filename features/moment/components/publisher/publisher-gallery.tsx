"use client";

import { Button, FieldError, Input, ProgressBar, ScrollShadow, TextField } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { RemoteMedia } from "@/components/ui/remote-media";
import type { PublisherMediaItem } from "../../hooks/use-moment-publish";

interface PublisherGalleryProps {
  items: PublisherMediaItem[];
  highlightMissingAlt?: boolean;
  onRemove: (id: string) => void;
  onAltChange: (id: string, altText: string) => void;
  onRetry: (id: string) => void;
}

export const PublisherGallery = ({
  items,
  highlightMissingAlt = false,
  onRemove,
  onAltChange,
  onRetry,
}: PublisherGalleryProps) => {
  const shouldReduceMotion = useReducedMotion() ?? false;

  if (items.length === 0) return null;

  return (
    <ScrollShadow
      hideScrollBar
      variant="fade"
      className="flex w-full flex-row gap-3"
      orientation="horizontal"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          const missingAlt = !item.altText.trim();
          const showAltError = highlightMissingAlt && missingAlt;

          return (
            <motion.div
              key={item.id}
              layout={!shouldReduceMotion}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.85, x: 15 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.85, x: -15 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }
              }
              className="flex w-28 shrink-0 flex-col gap-2"
            >
              <div className="group border-separator/30 bg-surface-secondary relative size-28 overflow-hidden rounded-xl border">
                <RemoteMedia
                  src={item.preview}
                  alt={item.altText || `Attachment ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />

                {item.kind === "local" && item.status === "uploading" ? (
                  <div className="absolute inset-x-2 bottom-2 rounded-full bg-black/45 px-2 py-1 backdrop-blur-sm">
                    <ProgressBar
                      aria-label={`Uploading ${item.altText || `attachment ${index + 1}`}`}
                      className="w-full"
                      size="sm"
                      value={item.progress}
                    >
                      <ProgressBar.Track>
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                  </div>
                ) : null}

                {item.kind === "local" && item.status === "failed" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 p-2 text-center">
                    <span className="text-[10px] leading-tight text-white">Upload failed</span>
                    <Button size="sm" variant="secondary" onPress={() => onRetry(item.id)}>
                      Retry
                    </Button>
                  </div>
                ) : null}

                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="hover:bg-danger absolute top-1 right-1 z-20 size-5 min-w-1.25 opacity-90 transition-all duration-200 hover:text-white active:scale-90 md:opacity-0 md:group-hover:opacity-100"
                  onPress={() => onRemove(item.id)}
                  aria-label={`Remove ${item.altText || `attachment ${index + 1}`}`}
                >
                  <Icon icon="gravity-ui:xmark" className="size-2.5" />
                </Button>
              </div>

              <TextField
                aria-label={`Alt text for attachment ${index + 1}`}
                isInvalid={showAltError}
                className="w-full"
              >
                <Input
                  className="w-full text-xs"
                  placeholder="Alt text"
                  value={item.altText}
                  onChange={(event) => onAltChange(item.id, event.target.value)}
                />
                {showAltError ? <FieldError>Alt text is required</FieldError> : null}
              </TextField>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </ScrollShadow>
  );
};
