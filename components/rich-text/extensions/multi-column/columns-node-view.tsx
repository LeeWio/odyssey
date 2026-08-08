"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  NodeViewContent,
  NodeViewWrapper,
  useEditorState,
  type NodeViewProps,
} from "@tiptap/react";
import {
  COLUMN_GAP_PX,
  getColumnGridTemplate,
  normalizeColumnWidths,
  resizeAdjacentColumns,
  serializeColumnWidths,
} from "./column-widths";

type ColumnsStyle = CSSProperties & { "--column-widths": string };

function getDividerPosition(widths: number[], dividerIndex: number, containerWidth: number) {
  const usableWidth = containerWidth - COLUMN_GAP_PX * (widths.length - 1);
  const cumulativeWidth = widths.slice(0, dividerIndex + 1).reduce((sum, width) => sum + width, 0);

  return (usableWidth * cumulativeWidth) / 100 + COLUMN_GAP_PX * dividerIndex + COLUMN_GAP_PX / 2;
}

export function ColumnsNodeView({ editor, getPos, node, updateAttributes }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupResizeRef = useRef<() => void>(() => undefined);
  const [containerWidth, setContainerWidth] = useState(0);
  const persistedWidths = useMemo(
    () => normalizeColumnWidths(node.attrs.widths, node.childCount),
    [node.attrs.widths, node.childCount]
  );
  const [dragWidths, setDragWidths] = useState<number[] | null>(null);
  const displayedWidths = dragWidths ?? persistedWidths;
  const isColumnsActive = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const position = getPos();

      if (typeof position !== "number") return false;

      const { from, to } = currentEditor.state.selection;

      return from > position && to < position + node.nodeSize;
    },
  });

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;

    const updateWidth = () => setContainerWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(updateWidth);

    updateWidth();
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => () => cleanupResizeRef.current(), []);

  const commitWidths = useCallback(
    (widths: number[]) => {
      const normalizedWidths = normalizeColumnWidths(widths, node.childCount);
      updateAttributes({ widths: normalizedWidths });
      setDragWidths(null);
    },
    [node.childCount, updateAttributes]
  );

  const startResize = useCallback(
    (event: React.PointerEvent, dividerIndex: number) => {
      if (!editor.isEditable || !containerWidth) return;

      event.preventDefault();
      cleanupResizeRef.current();
      const startX = event.clientX;
      const startWidths = [...displayedWidths];
      const usableWidth = containerWidth - COLUMN_GAP_PX * (startWidths.length - 1);
      let nextWidths = startWidths;

      const handlePointerMove = (pointerEvent: PointerEvent) => {
        nextWidths = resizeAdjacentColumns(
          startWidths,
          dividerIndex,
          ((pointerEvent.clientX - startX) / usableWidth) * 100
        );
        setDragWidths(nextWidths);
      };
      const handlePointerUp = () => {
        cleanupResizeRef.current();
        commitWidths(nextWidths);
      };

      cleanupResizeRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
        cleanupResizeRef.current = () => undefined;
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp, { once: true });
      window.addEventListener("pointercancel", handlePointerUp, { once: true });
    },
    [commitWidths, containerWidth, displayedWidths, editor.isEditable]
  );

  const style: ColumnsStyle = {
    "--column-widths": getColumnGridTemplate(displayedWidths),
  };

  return (
    <NodeViewWrapper
      ref={containerRef}
      className="relative my-4 w-full"
      data-column-widths={serializeColumnWidths(displayedWidths)}
      data-type="columns"
      style={style}
    >
      <NodeViewContent className="grid [grid-template-columns:var(--column-widths)] gap-4" />

      {isColumnsActive &&
        editor.isEditable &&
        containerWidth > 0 &&
        displayedWidths.slice(0, -1).map((_, dividerIndex) => (
          <Tooltip key={dividerIndex} delay={0}>
            <Button
              aria-label={`Resize columns ${dividerIndex + 1} and ${dividerIndex + 2}`}
              className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 cursor-col-resize touch-none"
              isIconOnly
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

                event.preventDefault();
                const step = event.shiftKey ? 10 : 5;
                commitWidths(
                  resizeAdjacentColumns(
                    displayedWidths,
                    dividerIndex,
                    event.key === "ArrowLeft" ? -step : step
                  )
                );
              }}
              onPointerDown={(event) => startResize(event, dividerIndex)}
              size="sm"
              style={{ left: getDividerPosition(displayedWidths, dividerIndex, containerWidth) }}
              variant="secondary"
            >
              <Icon aria-hidden="true" className="size-4" icon="lucide:grip-vertical" />
            </Button>
            <Tooltip.Content>Drag or use arrow keys to resize</Tooltip.Content>
          </Tooltip>
        ))}
    </NodeViewWrapper>
  );
}
