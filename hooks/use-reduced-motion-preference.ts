"use client";

import { useMediaQuery } from "@mantine/hooks";

/**
 * Follow the live browser preference. The first frame assumes motion is allowed
 * so an entrance can play; a reduce preference then stops later motion.
 */
export function useReducedMotionPreference() {
  return useMediaQuery("(prefers-reduced-motion: reduce)", false, {
    getInitialValueInEffect: false,
  });
}
