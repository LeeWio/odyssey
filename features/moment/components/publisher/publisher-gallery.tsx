"use client";

import Image from "next/image";
import { Button, ScrollShadow } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";

interface PublisherGalleryProps {
  attachments: { preview: string }[];
  onRemove: (index: number) => void;
}

export const PublisherGallery = ({ attachments, onRemove }: PublisherGalleryProps) => {
  if (attachments.length === 0) return null;

  return (
    <ScrollShadow
      hideScrollBar
      variant="fade"
      className="flex w-full flex-row gap-3"
      orientation="horizontal"
    >
      <AnimatePresence mode="popLayout">
        {attachments.map((item, index) => (
          <motion.div
            key={item.preview}
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
            <Image
              src={item.preview}
              alt={`Attachment ${index + 1}`}
              width={80}
              height={80}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="hover:bg-danger absolute top-1 right-1 z-20 size-5 min-w-1.25 opacity-90 transition-all duration-200 hover:text-white active:scale-90 md:opacity-0 md:group-hover:opacity-100"
              onPress={() => onRemove(index)}
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
