import { cn } from "@heroui/react";
import {
  AnimatePresence,
  domMax,
  LazyMotion,
  m,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";

interface AuthStepProps {
  children: ReactNode;
  className?: string;
  stepKey: string;
}

const reducedMotionVariants = {
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
  hidden: { opacity: 0, y: 0, transition: { duration: 0 } },
};

const motionVariants = {
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.2, ease: "easeOut" as const },
      y: { duration: 0.2, ease: "easeOut" as const },
    },
  },
  hidden: {
    opacity: 0,
    y: 6,
    transition: {
      opacity: { duration: 0.12, ease: "easeIn" as const },
      y: { duration: 0.12, ease: "easeIn" as const },
    },
  },
};

export const AuthStep = ({ children, className, stepKey }: AuthStepProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domMax}>
      <m.div
        className="flex min-h-0 flex-col"
        layout={!shouldReduceMotion}
        transition={{
          layout: shouldReduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 360, damping: 38, mass: 0.8 },
        }}
      >
        {/* wait keeps the leaving step in flow until it exits, so the dialog height does not stack both steps. */}
        <AnimatePresence initial={false} mode="wait">
          <AuthStepContent
            key={stepKey}
            className={className}
            reduceMotion={Boolean(shouldReduceMotion)}
          >
            {children}
          </AuthStepContent>
        </AnimatePresence>
      </m.div>
    </LazyMotion>
  );
};

function AuthStepContent({
  children,
  className,
  reduceMotion,
}: {
  children: ReactNode;
  className?: string;
  reduceMotion: boolean;
}) {
  const isPresent = useIsPresent();
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (isPresent || !content) return;
    const { activeElement, body } = content.ownerDocument;
    if (content.contains(activeElement) || activeElement === body) {
      // Keep keyboard events inside the dialog while the outgoing view is inert.
      content.closest<HTMLElement>('[role="dialog"]')?.focus({ preventScroll: true });
    }
  }, [isPresent]);

  return (
    <m.div
      ref={contentRef}
      inert={!isPresent}
      className={cn("flex min-h-0 w-full flex-col gap-y-3", className)}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={reduceMotion ? reducedMotionVariants : motionVariants}
    >
      {children}
    </m.div>
  );
}
