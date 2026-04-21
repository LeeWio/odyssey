import { type Transition } from "framer-motion";

export const motionProps = {
  initial: { opacity: 0, scale: 0.95, y: 8, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.95, y: 8, filter: "blur(4px)" },
  transition: {
    type: "spring" as const,
    stiffness: 380,
    damping: 30,
    mass: 1,
  } as Transition,
};
