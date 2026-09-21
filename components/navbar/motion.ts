"use client";

// Premium ease-out: starts extremely fast, settles gracefully and intentionally
export const enterEase = [0.23, 1, 0.32, 1] as const;
export const exitEase = [0.4, 0, 1, 1] as const;
export const navigationSpring = {
  type: "spring" as const,
  stiffness: 360,
  damping: 40,
  mass: 0.8,
};
export const activeIndicatorSpring = {
  type: "spring" as const,
  stiffness: 520,
  damping: 42,
  mass: 0.7,
};

// Tight, swift stagger entrance for list/group items
export const contentEntrance = {
  hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.02 + index * 0.02,
      duration: 0.16,
      ease: enterEase,
    },
  }),
};
