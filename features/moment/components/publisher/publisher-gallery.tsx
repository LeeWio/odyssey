"use client";

import { Button, Input, ProgressBar, ScrollShadow } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";

import { RemoteMedia } from "@/components/ui/remote-media";
import type { PublisherMediaItem } from "../../hooks/use-moment-publish";

interface PublisherGalleryProps {
  items: PublisherMediaItem[];
  onRemove: (id: string) => void;
  onAltChange: (id: string, altText: string) => void;
  onRetry: (id: string) => void;
}

export const PublisherGallery = ({
  items,
  onRemove,
  onAltChange,
  onRetry,
}: PublisherGalleryProps) => {
  if (items.length === 0) return null;

  return (
    <ScrollShadow
      hideScrollBar
      variant="fade"
      className="flex w-full flex-row gap-3"
      orientation="horizontal"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.85, x: 15 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: -15 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="flex w-28 shrink-0 flex-col gap-2"
          >
            <div className="group border-separator/30 bg-surface-secondary relative size-28 overflow-hidden rounded-xl border">
              <RemoteMedia
                src={item.preview}
                alt={item.altText || `Attachment ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {item.kind === "local" && item.status === "uploading" ? (
                <div className="absolute inset-x-2 bottom-2 rounded-full bg-black/45 px-2 py-1 backdrop-blur-sm">
                  <ProgressBar
                    aria-label="Upload progress"
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
                aria-label="Remove image"
              >
                <Icon icon="gravity-ui:xmark" className="size-2.5" />
              </Button>
            </div>

            <Input
              aria-label={`Alt text for attachment ${index + 1}`}
              className="w-full text-xs"
              placeholder="Alt text"
              value={item.altText}
              onChange={(event) => onAltChange(item.id, event.target.value)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </ScrollShadow>
  );
};
