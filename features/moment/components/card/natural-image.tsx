"use client";

import { motion, useAnimationControls } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { RemoteMedia } from "@/components/ui/remote-media";
import { pageEaseOut } from "@/lib/motion";
import { getMomentPhotoSource } from "../../utils/image-previews";
import { momentLayoutTransition, useMomentMotion } from "../feed-motion";

const MotionMedia = motion.create(RemoteMedia);

export function NaturalImage({
  src,
  originalSrc,
  alt,
  width,
  height,
  interactive,
  bounded = false,
}: {
  src: string;
  originalSrc?: string;
  alt: string;
  width?: number;
  height?: number;
  interactive: boolean;
  bounded?: boolean;
}) {
  const { enabled, reduced } = useMomentMotion();
  const controls = useAnimationControls();
  const cached = useRef(false);
  const [failedSource, setFailedSource] = useState<{
    original: string;
    stage: "optimized" | "original";
  }>();
  const failedStage = failedSource?.original === originalSrc ? failedSource?.stage : undefined;
  const source =
    originalSrc && failedStage !== "original"
      ? failedStage === "optimized"
        ? { src: originalSrc }
        : getMomentPhotoSource(originalSrc, "auto, (max-width: 40rem) calc(100vw - 2rem), 640px")
      : { src };

  useEffect(() => {
    if (!reduced) return;
    controls.stop();
    controls.set({ opacity: 1, scale: 1 });
  }, [controls, reduced]);

  return (
    <MotionMedia
      ref={(image) => {
        if (image?.complete && image.naturalWidth > 0) cached.current = true;
      }}
      {...source}
      alt={alt}
      width={width}
      height={height}
      className={`relative block h-auto w-full rounded-lg ${
        bounded
          ? "max-h-[min(55svh,420px)] object-cover lg:max-h-[min(60svh,560px)] lg:group-data-[view=grid]/moment-feed:max-h-[min(50svh,360px)]"
          : ""
      } ${interactive ? "pointer-events-none" : ""}`}
      initial={false}
      layout={enabled ? true : undefined}
      animate={controls}
      transition={{
        duration: 0.1,
        ease: pageEaseOut,
        layout: reduced ? { duration: 0 } : momentLayoutTransition,
      }}
      onError={() => {
        if (!originalSrc || source.src === src) return;
        setFailedSource({
          original: originalSrc,
          stage: source.src === originalSrc ? "original" : "optimized",
        });
      }}
      onLoad={() => {
        if (cached.current) return;
        cached.current = true;
        if (!enabled || reduced) return;
        controls.set({ opacity: 0 });
        void controls.start({ opacity: 1, transition: { duration: 0.18, ease: pageEaseOut } });
      }}
    />
  );
}
