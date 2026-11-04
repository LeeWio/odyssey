"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { MomentCardSkeleton } from "./card";
import { useMomentMotion } from "./feed-motion";

export function MomentFeedLoading({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);
  const { reduced } = useMomentMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="mx-auto min-h-48 w-full max-w-2xl gap-4 group-data-[view=grid]/moment-feed:max-w-none group-data-[view=grid]/moment-feed:columns-[20rem]"
      role="status"
      aria-label={label}
      aria-busy="true"
      initial={false}
      animate={{ opacity: reduced || !visible ? 1 : [0.65, 1, 0.65] }}
      transition={
        reduced || !visible
          ? { duration: 0 }
          : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
      }
    >
      {visible ? (
        <>
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className="mb-6 break-inside-avoid group-data-[view=grid]/moment-feed:mb-4"
            >
              <MomentCardSkeleton animationType="none" />
            </div>
          ))}
        </>
      ) : null}
    </motion.div>
  );
}
