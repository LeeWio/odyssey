"use client";

import { MotionConfig, motion } from "motion/react";
import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { pageEaseOut } from "@/lib/motion";

export const momentLayoutTransition = { duration: 0.4, ease: pageEaseOut };

const MomentMotionContext = createContext({
  enabled: false,
  reduced: true,
  enteredMomentIds: null as Set<number> | null,
});

export function MomentMotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotionPreference();
  const enteredMomentIds = useMemo(() => new Set<number>(), []);
  const value = useMemo(
    () => ({ enabled: true, reduced, enteredMomentIds }),
    [reduced, enteredMomentIds]
  );

  return (
    <MomentMotionContext value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </MomentMotionContext>
  );
}

export function useMomentMotion() {
  return useContext(MomentMotionContext);
}

export function MomentState({ children }: { children: ReactNode }) {
  const { reduced } = useMomentMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.16, ease: pageEaseOut }}
    >
      {children}
    </motion.div>
  );
}
