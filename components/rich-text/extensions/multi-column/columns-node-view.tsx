"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Resizable, type Layout } from "@heroui-pro/react/resizable";
import {
  NodeViewContent,
  NodeViewWrapper,
  useEditorState,
  type NodeViewProps,
} from "@tiptap/react";
import {
  getColumnGridTemplate,
  normalizeColumnWidths,
  serializeColumnWidths,
} from "./column-widths";

type ColumnsStyle = CSSProperties & { "--column-widths": string };

function haveSameWidths(first: number[], second: number[]) {
  return (
    first.length === second.length &&
    first.every((width, index) => Math.abs(width - second[index]) < 0.01)
  );
}

interface ColumnsResizeOverlayProps {
  groupId: string;
  persistedWidths: number[];
  panelIds: string[];
  onLayoutChange: (layout: Layout) => void;
  onPointerDownCapture: () => void;
  onKeyUpCapture: () => void;
}

const ColumnsResizeOverlay = React.memo(function ColumnsResizeOverlay({
  groupId,
  persistedWidths,
  panelIds,
  onLayoutChange,
  onPointerDownCapture,
  onKeyUpCapture,
}: ColumnsResizeOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" contentEditable={false}>
      <Resizable
        className="pointer-events-none [--resizable-handle-hit-area:1rem] [--resizable-handle-size:1rem]"
        id={groupId}
        onKeyUpCapture={onKeyUpCapture}
        onLayoutChange={onLayoutChange}
        onPointerDownCapture={onPointerDownCapture}
        orientation="horizontal"
      >
        {persistedWidths.flatMap((width, index) => {
          const panel = (
            <Resizable.Panel
              key={panelIds[index]}
              className="pointer-events-none"
              defaultSize={width}
              id={panelIds[index]}
              minSize={15}
            />
          );

          if (index === persistedWidths.length - 1) return [panel];

          return [
            panel,
            <Resizable.Handle
              key={`${panelIds[index]}-handle`}
              aria-label={`Resize columns ${index + 1} and ${index + 2}`}
              className="pointer-events-auto"
              id={`${panelIds[index]}-handle`}
              type="handle"
              variant="tertiary"
            />,
          ];
        })}
      </Resizable>
    </div>
  );
});

export function ColumnsNodeView({ editor, getPos, node, updateAttributes }: NodeViewProps) {
  const groupId = useId();
  const cleanupResizeRef = useRef<() => void>(() => undefined);
  const pendingWidthsRef = useRef<number[] | null>(null);
  const persistedWidths = useMemo(
    () => normalizeColumnWidths(node.attrs.widths, node.childCount),
    [node.attrs.widths, node.childCount]
  );
  const [previewWidths, setPreviewWidths] = useState<number[] | null>(null);
  const displayedWidths = previewWidths ?? persistedWidths;
  const panelIds = useMemo(
    () => Array.from({ length: node.childCount }, (_, index) => `${groupId}-column-${index}`),
    [groupId, node.childCount]
  );
  const isColumnsActive = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const position = getPos();

      if (typeof position !== "number") return false;

      const { from, to } = currentEditor.state.selection;

      return from > position && to < position + node.nodeSize;
    },
  });

  const commitPendingWidths = useCallback(() => {
    const widths = pendingWidthsRef.current;
    pendingWidthsRef.current = null;
    setPreviewWidths(null);

    if (!widths || haveSameWidths(widths, persistedWidths)) return;

    updateAttributes({ widths });
  }, [persistedWidths, updateAttributes]);

  const beginPointerResize = useCallback(() => {
    cleanupResizeRef.current();

    const finishResize = () => {
      cleanupResizeRef.current();
      commitPendingWidths();
    };

    cleanupResizeRef.current = () => {
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
      cleanupResizeRef.current = () => undefined;
    };

    window.addEventListener("pointerup", finishResize, { once: true });
    window.addEventListener("pointercancel", finishResize, { once: true });
  }, [commitPendingWidths]);

  useEffect(() => () => cleanupResizeRef.current(), []);

  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      const layoutWidths = panelIds.map((panelId) => layout[panelId]);

      if (layoutWidths.some((width) => !Number.isFinite(width))) return;

      const widths = normalizeColumnWidths(layoutWidths, node.childCount);
      pendingWidthsRef.current = widths;

      if (!haveSameWidths(widths, persistedWidths)) {
        setPreviewWidths(widths);
      }
    },
    [panelIds, node.childCount, persistedWidths]
  );

  const style: ColumnsStyle = {
    "--column-widths": getColumnGridTemplate(displayedWidths),
  };
  const layoutKey = `${node.childCount}:${serializeColumnWidths(persistedWidths)}`;

  return (
    <NodeViewWrapper
      className="relative my-4 w-full"
      data-column-widths={serializeColumnWidths(displayedWidths)}
      data-type="columns"
      style={style}
    >
      <NodeViewContent className="contents *:grid *:[grid-template-columns:var(--column-widths)] *:gap-4" />

      {isColumnsActive && editor.isEditable && (
        <ColumnsResizeOverlay
          key={layoutKey}
          groupId={groupId}
          persistedWidths={persistedWidths}
          panelIds={panelIds}
          onLayoutChange={handleLayoutChange}
          onPointerDownCapture={beginPointerResize}
          onKeyUpCapture={commitPendingWidths}
        />
      )}
    </NodeViewWrapper>
  );
}
