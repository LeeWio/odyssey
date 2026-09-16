"use client";

import { Button, ScrollShadow } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";

import { RemoteMedia } from "@/components/ui/remote-media";

export interface PublisherGalleryItem {
  id: string;
  preview: string;
  altText?: string;
}

interface PublisherGalleryProps {
  items: PublisherGalleryItem[];
  onRemove: (id: string) => void;
}

export const PublisherGallery = ({ items, onRemove }: PublisherGalleryProps) => {
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
            className="group border-separator/30 bg-surface-secondary relative size-20 min-w-20 overflow-hidden rounded-xl border"
          >
            <RemoteMedia
              src={item.preview}
              alt={item.altText || `Attachment ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

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
          </motion.div>
        ))}
      </AnimatePresence>
    </ScrollShadow>
  );
};
