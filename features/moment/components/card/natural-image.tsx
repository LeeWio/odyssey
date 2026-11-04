"use client";

import { motion, useAnimationControls } from "motion/react";
import { useEffect, useRef } from "react";

import { RemoteMedia } from "@/components/ui/remote-media";
import { pageEaseOut } from "@/lib/motion";
import { momentLayoutTransition, useMomentMotion } from "../feed-motion";

const MotionMedia = motion.create(RemoteMedia);

export function NaturalImage({
  src,
  alt,
  interactive,
  bounded = false,
}: {
  src: string;
  alt: string;
  interactive: boolean;
  bounded?: boolean;
}) {
  const { enabled, reduced } = useMomentMotion();
  const controls = useAnimationControls();
  const cached = useRef(false);

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
      src={src}
      alt={alt}
      className={
        bounded
          ? "mx-auto block h-auto max-h-[min(55svh,420px)] w-auto max-w-full rounded-lg object-contain lg:max-h-[min(60svh,560px)] lg:group-data-[view=grid]/moment-feed:max-h-[min(50svh,360px)]"
          : "block h-auto w-full rounded-lg"
      }
      initial={false}
      layout={enabled ? true : undefined}
      animate={controls}
      whileTap={enabled && !reduced && interactive ? { scale: 0.99 } : undefined}
      transition={{
        duration: 0.1,
        ease: pageEaseOut,
        layout: reduced ? { duration: 0 } : momentLayoutTransition,
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
