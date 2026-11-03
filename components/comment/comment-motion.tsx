"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { pageSpring } from "@/lib/motion";

export function CommentPresence({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion() === true;

  return (
    <motion.div
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={
        reduce
          ? { duration: 0.12 }
          : {
              layout: pageSpring,
              opacity: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
              y: pageSpring,
            }
      }
    >
      {children}
    </motion.div>
  );
}
