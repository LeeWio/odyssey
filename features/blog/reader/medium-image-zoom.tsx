"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@heroui/react";

interface MediumImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  unoptimized?: boolean;
}

export function MediumImageZoom({ src, alt, className, unoptimized }: MediumImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const toggleZoom = useCallback(() => {
    setIsZoomed((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsZoomed(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isZoomed]);

  return (
    <>
      <div
        className={cn("relative cursor-zoom-in overflow-hidden", className)}
        onClick={toggleZoom}
      >
        <Image
          src={src}
          alt={alt}
          width={800}
          height={450}
          unoptimized={unoptimized}
          className="h-auto w-full transition-opacity duration-300 hover:opacity-90"
        />
      </div>

      {isZoomed &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleZoom}
              className="bg-background/80 fixed inset-0 z-[200] flex cursor-zoom-out items-center justify-center backdrop-blur-xl"
            >
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
