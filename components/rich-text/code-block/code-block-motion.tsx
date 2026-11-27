"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

const transition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };
const foldedGutter = { width: 0, opacity: 0 };

export function CodeLineNumberGutter({ show, children }: { show: boolean; children: ReactNode }) {
  const reduceMotion = useReducedMotionPreference();

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="line-numbers"
          aria-hidden="true"
          data-code-gutter=""
          className="flex shrink-0 overflow-hidden select-none"
          initial={reduceMotion ? false : foldedGutter}
          animate={{ width: "auto", opacity: 1 }}
          exit={{
            ...foldedGutter,
            transition: { ...transition, duration: reduceMotion ? 0 : 0.16 },
          }}
          transition={reduceMotion ? { duration: 0 } : transition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CodeSnippetTransition({
  selectedIndex,
  onLayoutTransitionEnd,
  children,
}: {
  selectedIndex: number;
  onLayoutTransitionEnd?: () => void;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotionPreference();
  const content = useRef<HTMLDivElement>(null);
  const previousIndex = useRef(selectedIndex);
  const naturalHeight = useRef(0);
  const height = useMotionValue<number | "auto">("auto");
  const opacity = useMotionValue(1);
  const overflow = useTransform(height, (value) => (value === "auto" ? "visible" : "hidden"));

  useLayoutEffect(() => {
    const panel = content.current;
    if (!panel) return;
    const observer = new ResizeObserver(() => {
      const nextHeight = panel.offsetHeight;
      // Edits and manual resizing should take effect immediately during a switch.
      if (nextHeight !== naturalHeight.current && height.get() !== "auto") height.jump("auto");
      naturalHeight.current = nextHeight;
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [height]);

  useLayoutEffect(() => {
    const panel = content.current;
    if (!panel) return;
    const currentHeight = height.get();
    const from = currentHeight === "auto" ? naturalHeight.current : currentHeight;
    const to = panel.offsetHeight;
    const selectionChanged = previousIndex.current !== selectedIndex;
    previousIndex.current = selectedIndex;
    naturalHeight.current = to;

    if (reduceMotion) {
      height.jump("auto");
      opacity.jump(1);
      return;
    }
    if (!selectionChanged) return;

    opacity.jump(0.55);
    const fade = animate(opacity, 1, transition);
    if (from === to) {
      height.jump("auto");
      return () => fade.stop();
    }

    height.jump(from);
    const resize = animate(height, to, {
      ...transition,
      onComplete: () => {
        height.jump("auto");
        onLayoutTransitionEnd?.();
      },
    });
    return () => {
      fade.stop();
      resize.stop();
    };
  }, [height, onLayoutTransitionEnd, opacity, reduceMotion, selectedIndex]);

  return (
    <motion.div data-code-snippet-viewport="" style={{ height, overflow }}>
      <motion.div
        ref={content}
        data-code-snippet-panel=""
        className="flow-root"
        style={{ opacity }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
