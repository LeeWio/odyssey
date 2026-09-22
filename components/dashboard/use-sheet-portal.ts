"use client";

import { useTimeout } from "@mantine/hooks";
import { useState } from "react";

/** Portal target for menus opened from inside the dashboard sheet. */
export function useSheetPortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useTimeout(() => setContainer(document.getElementById("dashboard-sheet-container")), 0, {
    autoInvoke: true,
  });

  return container;
}
