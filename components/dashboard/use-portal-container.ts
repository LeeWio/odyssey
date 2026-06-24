import { useState, useEffect } from "react";

/**
 * Custom hook to grab the dashboard sheet DOM container.
 * This is used to portal select/dropdown popovers inside the Sheet,
 * which prevents focus-trapping and outside-dismiss events from immediately closing them.
 */
export function usePortalContainer() {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setContainer(document.getElementById("dashboard-sheet-container"));
    }
  }, []);

  return container;
}
