"use client";

import * as React from "react";
import {
  type FloatingToolbarState,
  flip,
  offset,
  useFloatingToolbar,
  useFloatingToolbarState,
} from "@platejs/floating";
import { useComposedRef } from "@udecode/cn";
import { KEYS } from "platejs";
import { useEditorId, useEventEditorValue, usePluginOption } from "platejs/react";
import { cn } from "@heroui/styles";
import { Toolbar } from "@heroui/react";
import { motion, AnimatePresence } from "motion/react";
import { motionProps } from "../types";

const MotionToolbar = motion.create(Toolbar);

export interface FloatingToolbarProps {
  children: React.ReactNode;
  className?: string;
  state?: FloatingToolbarState;
}

/**
 * A specialized floating toolbar for the editor.
 * Wraps HeroUI's Toolbar with Plate's floating logic.
 */
export const FloatingToolbar = React.forwardRef<HTMLDivElement, FloatingToolbarProps>(
  ({ children, className, state }, forwardedRef) => {
    const editorId = useEditorId();
    const focusedEditorId = useEventEditorValue("focus");
    const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, "mode");
    const isAIChatOpen = usePluginOption({ key: KEYS.aiChat }, "open");

    const floatingToolbarState = useFloatingToolbarState({
      editorId,
      focusedEditorId,
      hideToolbar: isFloatingLinkOpen || isAIChatOpen,
      ...state,
      floatingOptions: {
        middleware: [
          offset(12),
          flip({
            fallbackPlacements: ["top-start", "top-end", "bottom-start", "bottom-end"],
            padding: 12,
          }),
        ],
        placement: "top",
        ...state?.floatingOptions,
      },
    });

    const {
      clickOutsideRef,
      hidden,
      props: rootProps,
      ref: floatingRef,
    } = useFloatingToolbar(floatingToolbarState);

    const ref = useComposedRef<HTMLDivElement>(forwardedRef, floatingRef, clickOutsideRef);

    return (
      <div ref={ref} {...rootProps} className={cn("absolute z-50", hidden && "pointer-events-none")}>
        <AnimatePresence>
          {!hidden && (
            <MotionToolbar
              key="floating-toolbar"
              layout="size"
              isAttached
              orientation="horizontal"
              {...motionProps}
              transition={{
                layout: { type: "spring", stiffness: 300, damping: 30 },
                ...motionProps.transition,
              }}
              aria-label="Floating toolbar"
              className={cn(
                "bg-overlay/80 transform-gpu backdrop-blur-xl backdrop-saturate-150 will-change-transform shadow-2xl rounded-full border border-border/50",
                className,
              )}
            >
              {children}
            </MotionToolbar>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

FloatingToolbar.displayName = "FloatingToolbar";
