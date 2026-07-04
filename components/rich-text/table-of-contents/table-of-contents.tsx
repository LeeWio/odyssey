"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import { Editor as CoreEditor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { FloatingToc, useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";

export interface TableOfContentsAnchor {
  id: string;
  textContent: string;
  originalLevel: number;
  level: number;
  isActive: boolean;
  pos: number;
  itemIndex?: number;
}

export type TableOfContentsProps = {
  editor?: CoreEditor; // Explicit editor prop to support rendering anywhere outside editor context
  placement?: "left" | "right";
  onItemClick?: () => void;
};

export const RichTextTableOfContents = memo(
  ({
    editor: propEditor,
    placement = "right",
    onItemClick: propOnItemClick,
  }: TableOfContentsProps) => {
    // 1. Dual-mode fallback: Read editor from react context if no explicit editor prop is passed
    const contextEditor = useRichTextEditor().editor;
    const activeEditor = propEditor || contextEditor;

    // 2. Reactively subscribe to ToC anchor state on editor transactions using official HeroUI Pro state hook
    const items =
      useRichTextEditorState((state) => {
        const rawAnchors = state.editor.storage.tableOfContents?.anchors || [];
        return rawAnchors as unknown as TableOfContentsAnchor[];
      }) || [];

    const [scrollActiveId, setScrollActiveId] = useState<string>("");

    // Sync the latest items to a stable Ref to bypass re-observe triggers on every render cycle
    const itemsRef = useRef<TableOfContentsAnchor[]>(items);
    useEffect(() => {
      itemsRef.current = items;
    });

    // Stable ID-mapped string dependency to guarantee reference identity safety
    const itemIds = items.map((a) => a.id).join(",");

    // 3. Robust Intersection Observer to calculate scrollActiveId based on global window scroll viewport entry
    useEffect(() => {
      const currentItems = itemsRef.current;
      if (!currentItems || currentItems.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const visibleEntries = entries.filter((entry) => entry.isIntersecting);
          if (visibleEntries.length > 0) {
            setScrollActiveId(visibleEntries[0].target.id);
          }
        },
        {
          rootMargin: "-100px 0px -60% 0px",
          threshold: 0.1,
        }
      );

      currentItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      });

      return () => {
        observer.disconnect();
      };
    }, [itemIds]);

    if (!activeEditor || items.length === 0) {
      return null;
    }

    // 4. 100% faithful port of the provided onItemClick logic
    const onItemClick = (e: React.MouseEvent, id: string) => {
      e.preventDefault();

      if (activeEditor) {
        const element = activeEditor.view.dom.querySelector(`[data-toc-id="${id}"]`);

        if (element) {
          const pos = activeEditor.view.posAtDOM(element, 0);

          // set focus
          const tr = activeEditor.view.state.tr;

          tr.setSelection(new TextSelection(tr.doc.resolve(pos)));

          activeEditor.view.dispatch(tr);

          activeEditor.view.focus();

          if (history.pushState) {
            history.pushState(null, "", `#${id}`);
          }

          window.scrollTo({
            top: element.getBoundingClientRect().top + window.scrollY,
            behavior: "smooth",
          });
        }
      }
      propOnItemClick?.();
    };

    const activeItem = items.find((item) => item.isActive);
    const activeId = scrollActiveId || (activeItem ? activeItem.id : "");

    return (
      <div
        className={`fixed ${placement === "left" ? "left-6" : "right-6"} top-1/2 z-40 hidden -translate-y-1/2 lg:block`}
      >
        <FloatingToc placement={placement} triggerMode="hover">
          {/* Dynamic horizontal indicators tracking active heading and hierarchy level */}
          <FloatingToc.Trigger aria-label="Table of contents">
            {items.map((item) => (
              <FloatingToc.Bar key={item.id} active={item.id === activeId} level={item.level} />
            ))}
          </FloatingToc.Trigger>

          {/* Floating popover list of headers with comfortable glassmorphism mask */}
          <FloatingToc.Content className="w-64">
            <span className="text-muted mb-1.5 block px-3 py-1 text-[10px] font-semibold tracking-wider uppercase select-none">
              Contents
            </span>
            {items.map((item) => (
              <FloatingToc.Item
                key={item.id}
                active={item.id === activeId}
                level={item.level}
                onClick={(e) => onItemClick(e, item.id)}
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
