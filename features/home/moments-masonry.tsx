"use client";

import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { Link } from "@heroui/react";

import { MomentCard } from "@/features/moment/components/card";
import { pageRevealInView } from "@/lib/motion";
import type { MomentResponse } from "@/lib/features/moment";

interface MomentsMasonryProps {
  moments: MomentResponse[];
}

export function MomentsMasonry({ moments }: MomentsMasonryProps) {
  const shouldReduceMotion = useReducedMotionPreference();

  return (
    <div data-testid="moments-masonry" className="columns-1 gap-5 sm:[columns:20rem]">
      {moments.map((moment) => (
        <motion.div
          key={moment.id}
          {...pageRevealInView(shouldReduceMotion, 0, 12, { amount: 0.15 })}
          className="mb-5 w-full break-inside-avoid"
        >
          <Link
            className="block w-full text-inherit no-underline"
            href={`/moments#moment-${moment.id}`}
          >
            <MomentCard enableComments={false} interactive={false} moment={moment} />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
