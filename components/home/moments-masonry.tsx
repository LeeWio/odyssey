"use client";

import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { MomentCard } from "@/features/moment/components/card";
import type { MomentResponse } from "@/lib/features/moment";

interface MomentsMasonryProps {
  moments: MomentResponse[];
}

export function MomentsMasonry({ moments }: MomentsMasonryProps) {
  const shouldReduceMotion = useReducedMotionPreference();

  return (
    <div data-testid="moments-masonry" className="[columns:20rem] gap-5">
      {moments.map((moment, index) => (
        <motion.div
          key={moment.id}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.24, delay: Math.min(index * 0.015, 0.18), ease: [0.16, 1, 0.3, 1] }
          }
          className="mb-5 w-full break-inside-avoid"
        >
          <MomentCard enableComments={false} moment={moment} />
        </motion.div>
      ))}
    </div>
  );
}
