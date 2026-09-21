"use client";

import { useTimeout } from "@mantine/hooks";
import { useState } from "react";

/**
 * Custom hook to grab the dashboard sheet DOM container.
 * This is used to portal select/dropdown popovers inside the Sheet,
 * which prevents focus-trapping and outside-dismiss events from immediately closing them.
 */
export function usePortalContainer() {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useTimeout(() => setContainer(document.getElementById("dashboard-sheet-container")), 0, {
    autoInvoke: true,
  });

  return container;
}
