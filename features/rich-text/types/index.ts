import type { Transition } from "framer-motion";

export const motionProps = {
  initial: { opacity: 0, scale: 0.92, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 6 },
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 28,
    mass: 1,
  } as Transition,
  whileHover: { scale: 1.02 },
};
