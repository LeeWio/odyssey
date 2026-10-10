import type { Transition } from "motion/react";

export function stackTransition(
  reduce: boolean | null,
  expanded: boolean,
  index: number,
  count: number
): Transition {
  if (reduce) return { duration: 0 };

  return {
    type: "spring",
    stiffness: 420,
    damping: 36,
    mass: 0.75,
    delay: expanded ? Math.min(index, 5) * 0.035 : Math.min(count - 1 - index, 5) * 0.02,
  };
}
