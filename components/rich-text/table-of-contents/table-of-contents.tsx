"use client";

import { FloatingToc, useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";
import type {
  TableOfContentData,
  TableOfContentDataItem,
} from "@tiptap/extension-table-of-contents";
import type React from "react";
import { memo, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type TableOfContentsAnchor = TableOfContentDataItem;

const EMPTY_TABLE_OF_CONTENTS: TableOfContentData = [];

export type TableOfContentsProps = {
  className?: string;
  items?: TableOfContentData;
  maxHeadingLevel?: number;
  maxShowCount?: number;
  onItemClick?: () => void;
  placement?: "left" | "right";
  position?: "container" | "viewport";
  scrollMode?: "editor" | "window";
  topOffset?: number;
  triggerMode?: "hover" | "press";
  updateLocationHash?: boolean;
};

function getScrollRoot(editorElement: HTMLElement, scrollMode: "editor" | "window") {
  if (scrollMode === "window") return window;

  return editorElement.closest<HTMLElement>('[data-slot="rich-text-editor-content"]');
}

function getHeadingElement(editorElement: HTMLElement, id: string) {
  return editorElement.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(id)}"]`);
}

function isHeadingVisible(
  element: HTMLElement,
  scrollRoot: HTMLElement | Window,
  topOffset: number
) {
  const elementRect = element.getBoundingClientRect();
  const rootTop = scrollRoot instanceof Window ? 0 : scrollRoot.getBoundingClientRect().top;
  const rootBottom =
    scrollRoot instanceof Window ? window.innerHeight : scrollRoot.getBoundingClientRect().bottom;

  return elementRect.top >= rootTop + topOffset && elementRect.bottom <= rootBottom;
}

function scrollToHeading(
  element: HTMLElement,
  scrollRoot: HTMLElement | Window,
  topOffset: number
) {
  if (scrollRoot instanceof Window) {
    scrollRoot.scrollTo({
      behavior: "smooth",
      top: element.getBoundingClientRect().top + scrollRoot.scrollY - topOffset,
    });
    return;
  }

  const rootTop = scrollRoot.getBoundingClientRect().top;

  scrollRoot.scrollTo({
    behavior: "smooth",
    top: scrollRoot.scrollTop + element.getBoundingClientRect().top - rootTop - topOffset,
  });
}

export const RichTextTableOfContents = memo(
  ({
    className,
    items: controlledItems,
    maxHeadingLevel = 3,
    maxShowCount = 20,
    onItemClick: propOnItemClick,
    placement = "right",
    position = "viewport",
    scrollMode = "window",
    topOffset = 0,
    triggerMode = "hover",
    updateLocationHash = true,
  }: TableOfContentsProps) => {
    const { editor } = useRichTextEditor();
    const storedItems =
      useRichTextEditorState((state) => state.editor.storage.tableOfContents?.content) ||
      EMPTY_TABLE_OF_CONTENTS;
    const cursorPosition =
      useRichTextEditorState((state) => state.editor.state.selection.from) ?? null;
    const allItems = controlledItems ?? storedItems;
    const items = useMemo(
      () => allItems.filter((item) => item.originalLevel <= maxHeadingLevel).slice(0, maxShowCount),
      [allItems, maxHeadingLevel, maxShowCount]
    );
    const [fallbackScrollActiveId, setFallbackScrollActiveId] = useState("");
    const [manualActiveId, setManualActiveId] = useState<string | null>(null);
    const manualNavigationCleanupRef = useRef<() => void>(() => undefined);

    useEffect(() => {
      if (controlledItems || !editor || items.length === 0) return;

      const scrollRoot = getScrollRoot(editor.view.dom, scrollMode);

      if (!scrollRoot) return;

      let animationFrame = 0;

      const updateFallbackActiveHeading = () => {
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          const rootTop = scrollRoot instanceof Window ? 0 : scrollRoot.getBoundingClientRect().top;
          let activeId = items[0]?.id ?? "";

          for (const item of items) {
            const heading = getHeadingElement(editor.view.dom, item.id);

            if (!heading) continue;

            if (heading.getBoundingClientRect().top - rootTop <= topOffset) {
              activeId = item.id;
              continue;
            }

            break;
          }

          setFallbackScrollActiveId((currentId) => (currentId === activeId ? currentId : activeId));
        });
      };

      updateFallbackActiveHeading();
      scrollRoot.addEventListener("scroll", updateFallbackActiveHeading, { passive: true });
      window.addEventListener("resize", updateFallbackActiveHeading);

      return () => {
        cancelAnimationFrame(animationFrame);
        scrollRoot.removeEventListener("scroll", updateFallbackActiveHeading);
        window.removeEventListener("resize", updateFallbackActiveHeading);
      };
    }, [controlledItems, editor, items, scrollMode, topOffset]);

    useEffect(() => () => manualNavigationCleanupRef.current(), []);

    if (!editor || items.length === 0) {
      return null;
    }

    const onItemClick = (event: React.MouseEvent, item: TableOfContentsAnchor) => {
      event.preventDefault();

      const element = getHeadingElement(editor.view.dom, item.id);
      const scrollRoot = getScrollRoot(editor.view.dom, scrollMode);

      if (!element || !scrollRoot) return;

      editor
        .chain()
        .focus()
        .setTextSelection(item.pos + 1)
        .run();
      manualNavigationCleanupRef.current();
      setManualActiveId(item.id);

      if (!isHeadingVisible(element, scrollRoot, topOffset)) {
        scrollToHeading(element, scrollRoot, topOffset);

        let releaseTimer: number | null = null;

        const cleanupManualNavigation = () => {
          if (releaseTimer !== null) {
            window.clearTimeout(releaseTimer);
            releaseTimer = null;
          }

          scrollRoot.removeEventListener("scroll", scheduleManualNavigationRelease);
          manualNavigationCleanupRef.current = () => undefined;
        };

        const scheduleManualNavigationRelease = () => {
          if (releaseTimer !== null) {
            window.clearTimeout(releaseTimer);
          }

          releaseTimer = window.setTimeout(() => {
            setManualActiveId(null);
            cleanupManualNavigation();
          }, 160);
        };

        manualNavigationCleanupRef.current = cleanupManualNavigation;
        scrollRoot.addEventListener("scroll", scheduleManualNavigationRelease, { passive: true });
        scheduleManualNavigationRelease();
      } else {
        const releaseTimer = window.setTimeout(() => {
          setManualActiveId(null);
          manualNavigationCleanupRef.current = () => undefined;
        }, 600);

        manualNavigationCleanupRef.current = () => {
          window.clearTimeout(releaseTimer);
          manualNavigationCleanupRef.current = () => undefined;
        };
      }

      if (updateLocationHash && window.history.pushState) {
        window.history.pushState(null, "", `#${item.id}`);
      }

      propOnItemClick?.();
    };

    const pluginActiveItem = items.find((item) => item.isActive);
    const cursorActiveItem =
      cursorPosition === null
        ? undefined
        : items.reduce<TableOfContentsAnchor | undefined>(
            (activeItem, item) => (item.pos <= cursorPosition ? item : activeItem),
            undefined
          );
    const activeId =
      manualActiveId ??
      pluginActiveItem?.id ??
      (controlledItems ? undefined : fallbackScrollActiveId || undefined) ??
      cursorActiveItem?.id ??
      items[0]?.id ??
      "";

    return (
      <div
        className={cn(
          "top-1/2 z-40 hidden -translate-y-1/2 md:block",
          position === "container" ? "absolute" : "fixed",
          placement === "left" ? "left-4 lg:left-6" : "right-4 lg:right-6",
          className
        )}
      >
        <FloatingToc placement={placement} triggerMode={triggerMode}>
          <FloatingToc.Trigger aria-label="Table of contents">
            {items.map((item) => (
              <FloatingToc.Bar key={item.id} active={item.id === activeId} level={item.level} />
            ))}
          </FloatingToc.Trigger>

          <FloatingToc.Content className="max-h-80 w-72 overflow-y-auto">
            <span className="text-muted mb-1 block px-3 py-1 text-[10px] font-semibold tracking-wider uppercase select-none">
              Contents
            </span>
            {items.map((item) => (
              <FloatingToc.Item
                key={item.id}
                active={item.id === activeId}
                level={item.level}
                onClick={(event) => onItemClick(event, item)}
              >
                {item.textContent}
              </FloatingToc.Item>
            ))}
          </FloatingToc.Content>
        </FloatingToc>
      </div>
    );
  }
);

RichTextTableOfContents.displayName = "RichTextTableOfContents";
export default RichTextTableOfContents;
