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

export function FloatingToolbar({
  children,
  className,
  state,
  ...props
}: React.ComponentProps<typeof Toolbar> & {
  state?: FloatingToolbarState;
}) {
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

  const ref = useComposedRef<HTMLDivElement>(props.ref, floatingRef, clickOutsideRef);

  return (
    <div ref={ref} {...rootProps} className={cn("absolute z-50", hidden && "pointer-events-none")}>
      <AnimatePresence {...props}>
        {!hidden && (
          <MotionToolbar
            key="floating-toolbar"
            layout
            isAttached
            orientation="horizontal"
            {...motionProps}
            aria-label="Floating toolbar"
            className={cn(
              "bg-overlay/80 transform-gpu backdrop-blur-md backdrop-saturate-150 will-change-transform",
              className,
            )}
          >
            {children}
          </MotionToolbar>
        )}
      </AnimatePresence>
    </div>
  );
}
