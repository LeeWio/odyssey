"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@heroui/react";
import { useTranslations } from "next-intl";

interface MediumImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  unoptimized?: boolean;
}

export function MediumImageZoom({ src, alt, className, unoptimized }: MediumImageZoomProps) {
  const t = useTranslations("Article");
  const [isZoomed, setIsZoomed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeZoom = useCallback(() => {
    setIsZoomed(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeZoom();
        if (e.key === "Tab") {
          e.preventDefault();
          closeButtonRef.current?.focus();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      closeButtonRef.current?.focus();
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [closeZoom, isZoomed]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("zoomImage", { alt: alt || t("image") })}
        className={cn("relative block cursor-zoom-in overflow-hidden text-left", className)}
        onClick={() => setIsZoomed(true)}
      >
        <Image
          src={src}
          alt={alt}
          width={800}
          height={450}
          unoptimized={unoptimized}
          className="h-auto w-full transition-opacity duration-300 hover:opacity-90"
        />
      </button>

      {isZoomed &&
        createPortal(
          <AnimatePresence>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("imagePreview")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeZoom}
              className="bg-background/80 fixed inset-0 z-[200] flex cursor-zoom-out items-center justify-center backdrop-blur-xl"
            >
              <button
                ref={closeButtonRef}
                type="button"
                aria-label={t("closeImagePreview")}
                className="text-foreground focus-visible:ring-accent absolute top-4 right-4 z-10 rounded-full bg-black/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                onClick={closeZoom}
              >
                {t("close")}
              </button>
              <motion.div
                layoutId={`image-${src}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative h-[90vh] w-[90vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-contain"
                  priority
                  unoptimized={unoptimized}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
