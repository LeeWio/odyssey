"use client";

import { FloatingToc, useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";
import type { TableOfContentDataItem } from "@tiptap/extension-table-of-contents";
import { TextSelection } from "@tiptap/pm/state";
import type React from "react";
import { memo, useEffect, useMemo, useState } from "react";

export type TableOfContentsAnchor = TableOfContentDataItem;

const EMPTY_TABLE_OF_CONTENTS: TableOfContentsAnchor[] = [];

export type TableOfContentsProps = {
  placement?: "left" | "right";
  onItemClick?: () => void;
};

export const RichTextTableOfContents = memo(
  ({ placement = "right", onItemClick: propOnItemClick }: TableOfContentsProps) => {
    const { editor } = useRichTextEditor();

    // Subscribe through HeroUI Pro so the table of contents follows editor transactions.
    const items =
      useRichTextEditorState((state) => {
        return state.editor.storage.tableOfContents?.content;
      }) || EMPTY_TABLE_OF_CONTENTS;

    const [scrollActiveId, setScrollActiveId] = useState<string>("");
    const observedIds = useMemo(() => items.map((item) => item.id), [items]);

    // Keep the active item synchronized with headings visible in the viewport.
    useEffect(() => {
      if (observedIds.length === 0) {
        setScrollActiveId("");
        return;
      }

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

      observedIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });

      return () => {
        observer.disconnect();
      };
    }, [observedIds]);

    if (!editor || items.length === 0) {
      return null;
    }

    const onItemClick = (e: React.MouseEvent, id: string) => {
      e.preventDefault();

      if (editor) {
        const element = editor.view.dom.querySelector(`[data-toc-id="${id}"]`);

        if (element) {
          const pos = editor.view.posAtDOM(element, 0);

          // set focus
          const tr = editor.view.state.tr;

          tr.setSelection(new TextSelection(tr.doc.resolve(pos)));

          editor.view.dispatch(tr);

          editor.view.focus();

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
