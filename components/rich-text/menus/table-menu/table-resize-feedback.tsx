"use client";

import { useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { Chip } from "@heroui/react";
import { columnResizingPluginKey } from "@tiptap/pm/tables";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Read native drag state, without a competing resize gesture or per-pixel announcements. */
export function TableResizeFeedback() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const [badge, setBadge] = useState<{ width: number; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!editor || isDisabled || isReadOnly) return;
    let frame = 0;
    let point = { x: 0, y: 0 };
    let previous = false;
    const minimum =
      editor.extensionManager.extensions.find((extension) => extension.name === "table")?.options
        .cellMinWidth ?? 100;
    const refresh = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (editor.isDestroyed) return;
        const drag = columnResizingPluginKey.getState(editor.state)?.dragging;
        const next = drag
          ? {
              width: Math.round(Math.max(minimum, drag.startWidth + point.x - drag.startX)),
              x: Math.min(innerWidth - 90, Math.max(8, point.x + 12)),
              y: Math.min(innerHeight - 32, Math.max(8, point.y + 12)),
            }
          : null;
        setBadge((current) => (!next && !current ? current : next));
      });
    };
    const pointer = (event: MouseEvent) => {
      point = { x: event.clientX, y: event.clientY };
      if (previous) refresh();
    };
    const transaction = () => {
      previous = !!columnResizingPluginKey.getState(editor.state)?.dragging;
      refresh();
    };
    editor.view.dom.addEventListener("mousedown", pointer, true);
    window.addEventListener("mousemove", pointer);
    editor.on("transaction", transaction);
    return () => {
      cancelAnimationFrame(frame);
      editor.off("transaction", transaction);
      editor.view.dom.removeEventListener("mousedown", pointer, true);
      window.removeEventListener("mousemove", pointer);
    };
  }, [editor, isDisabled, isReadOnly]);
  if (!editor || !badge || isDisabled || isReadOnly) return null;
  const portal =
    editor.view.dom.closest<HTMLElement>("[data-slot='modal-container']") ?? document.body;
  return createPortal(
    <div
      aria-hidden="true"
      data-table-resize-width=""
      className="pointer-events-none fixed z-50 tabular-nums"
      style={{ left: badge.x, top: badge.y }}
    >
      <Chip size="sm" variant="secondary">
        {badge.width} px
      </Chip>
    </div>,
    portal
  );
}
