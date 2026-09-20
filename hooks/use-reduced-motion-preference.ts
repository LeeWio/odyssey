"use client";

import { useMediaQuery } from "@mantine/hooks";

/** Keep SSR and hydration static, then follow live browser motion preferences. */
export function useReducedMotionPreference() {
  return useMediaQuery("(prefers-reduced-motion: reduce)", true, {
    getInitialValueInEffect: true,
  });
}
