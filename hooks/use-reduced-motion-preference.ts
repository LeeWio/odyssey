"use client";

import { useMediaQuery } from "@mantine/hooks";

/**
 * Keep SSR and hydration identical; read the live preference after mounting.
 */
export function useReducedMotionPreference() {
  return useMediaQuery("(prefers-reduced-motion: reduce)", true);
}
