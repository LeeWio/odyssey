import type { Transition, Variants } from "motion/react";

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const softSpring: Transition = {
  type: "spring",
  duration: 0.72,
  bounce: 0.12,
};

export const crispSpring: Transition = {
  type: "spring",
  duration: 0.55,
  bounce: 0.08,
};

/** Parent orchestrator only — never hide the section shell itself. */
export function chapterReveal(reduce: boolean): Variants {
  if (reduce) {
    return { hidden: {}, show: {} };
  }

  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.04,
      },
    },
  };
}

/**
 * Soft enter that stays readable even if whileInView never fires.
 * Never park content at opacity 0 as the resting/SSR state.
 */
export function captionReveal(reduce: boolean): Variants {
  if (reduce) {
    return {
      hidden: { opacity: 1, y: 0 },
      show: { opacity: 1, y: 0 },
    };
  }

  return {
    hidden: { opacity: 1, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: softSpring,
    },
  };
}

export function itemReveal(reduce: boolean): Variants {
  if (reduce) {
    return {
      hidden: { opacity: 1, y: 0, scale: 1 },
      show: { opacity: 1, y: 0, scale: 1 },
    };
  }

  return {
    hidden: { opacity: 1, y: 8, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: crispSpring,
    },
  };
}

export const chapterViewport = { once: true, amount: 0.15, margin: "0px 0px -5% 0px" } as const;
