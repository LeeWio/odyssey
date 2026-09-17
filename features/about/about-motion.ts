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

export function bandReveal(reduce: boolean, delay = 0): Variants {
  if (reduce) {
    return {
      hidden: { opacity: 1, y: 0 },
      show: { opacity: 1, y: 0 },
    };
  }

  return {
    hidden: { opacity: 0, y: 28 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        ...softSpring,
        delay,
        staggerChildren: 0.07,
        delayChildren: 0.04,
      },
    },
  };
}

export function itemReveal(reduce: boolean): Variants {
  if (reduce) {
    return {
      hidden: { opacity: 1, y: 0, filter: "blur(0px)" },
      show: { opacity: 1, y: 0, filter: "blur(0px)" },
    };
  }

  return {
    hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: crispSpring,
    },
  };
}

export function heroContainer(reduce: boolean): Variants {
  if (reduce) {
    return {
      hidden: {},
      show: {},
    };
  }

  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.06,
      },
    },
  };
}

export function heroItem(reduce: boolean): Variants {
  if (reduce) {
    return {
      hidden: { opacity: 1, y: 0 },
      show: { opacity: 1, y: 0 },
    };
  }

  return {
    hidden: { opacity: 0, y: 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: softSpring,
    },
  };
}

export const panelSwap = {
  initial: (reduce: boolean) => (reduce ? false : { opacity: 0, y: 10, filter: "blur(3px)" }),
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: (reduce: boolean) => (reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(3px)" }),
  transition: (reduce: boolean): Transition =>
    reduce ? { duration: 0 } : { duration: 0.28, ease: easeOut },
};
