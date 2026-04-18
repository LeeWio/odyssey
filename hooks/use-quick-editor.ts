"use client";

import { useOverlayState } from "@heroui/react";
import { useEffect } from "react";

/**
 * Hook to manage the global quick editor state and shortcut.
 */
export function useQuickEditor() {
  const state = useOverlayState();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle modal on Cmd+J or Ctrl+J
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        state.toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state]);

  return state;
}
