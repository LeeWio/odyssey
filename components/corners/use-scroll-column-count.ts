"use client";

import React from "react";

/** Card width used by the vertical scrolling boards. */
const COLUMN_MIN_WIDTH = 256;
const COLUMN_GAP = 16;

/**
 * How many scrolling columns fit in the container.
 * Wide screens drop one column from a tight fit so the board stays airy.
 */
export function useScrollColumnCount<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [element, setElement] = React.useState<T | null>(null);
  const [columnCount, setColumnCount] = React.useState(1);

  const assignRef = React.useCallback((node: T | null) => {
    ref.current = node;
    setElement(node);
  }, []);

  React.useLayoutEffect(() => {
    if (!element) return;

    const measure = (width: number) => {
      if (width <= 0) return;
      const fitted = Math.max(
        1,
        Math.floor((width + COLUMN_GAP) / (COLUMN_MIN_WIDTH + COLUMN_GAP))
      );
      // Keep the natural column count through a laptop, then loosen wider screens.
      const next = fitted > 4 ? fitted - 1 : fitted;
      setColumnCount((current) => (current === next ? current : next));
    };

    measure(element.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? element.getBoundingClientRect().width;
      measure(width);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return { ref: assignRef, columnCount };
}

export function splitIntoColumns<T>(items: readonly T[], columnCount: number): T[][] {
  const count = Math.max(1, columnCount);
  const columns = Array.from({ length: count }, () => [] as T[]);
  items.forEach((item, index) => {
    columns[index % count].push(item);
  });
  return columns;
}
