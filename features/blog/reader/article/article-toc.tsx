"use client";

import { Accordion, ListBox, ScrollShadow } from "@heroui/react";
import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react/rich-text-editor";
import type {
  TableOfContentData,
  TableOfContentDataItem,
} from "@tiptap/extension-table-of-contents";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ARTICLE_OUTLINE_TOP_OFFSET } from "@/components/rich-text/extensions/table-of-contents";
import { cn } from "@/lib/utils";

const EMPTY_OUTLINE: TableOfContentData = [];

function subscribeToOutline(onChange: () => void) {
  window.addEventListener("odyssey-outline-scroll", onChange);
  return () => window.removeEventListener("odyssey-outline-scroll", onChange);
}

function OutlineList({
  items,
  label,
  onJump,
}: {
  items: TableOfContentData;
  label: string;
  onJump: (item: TableOfContentDataItem) => void;
}) {
  useSyncExternalStore(
    subscribeToOutline,
    () => items.find((item) => item.isActive)?.id ?? "",
    () => ""
  );
  const activeId = items.find((item) => item.isActive)?.id ?? items[0]?.id ?? "";

  return (
    <ScrollShadow className="max-h-72" hideScrollBar size={28}>
      <ListBox
        aria-label={label}
        selectedKeys={activeId ? [activeId] : []}
        selectionMode="none"
        onAction={(key) => {
          const item = items.find((entry) => entry.id === String(key));
          if (item) onJump(item);
        }}
      >
        {items.map((item) => (
          <ListBox.Item
            key={item.id}
            className={cn(item.id === activeId && "bg-default")}
            id={item.id}
            textValue={item.textContent}
          >
            <span
              className="line-clamp-2"
              style={{ marginInlineStart: `${(item.level - 1) * 0.75}rem` }}
            >
              {item.textContent}
            </span>
          </ListBox.Item>
        ))}
      </ListBox>
    </ScrollShadow>
  );
}

export function ArticleToc({
  className = "",
  label,
  maxHeadingLevel = 3,
}: {
  className?: string;
  label: string;
  maxHeadingLevel?: number;
}) {
  const { editor } = useRichTextEditor();
  const items =
    useRichTextEditorState((state) => {
      const content =
        (state.editor.storage.tableOfContents?.content as TableOfContentData | undefined) ??
        EMPTY_OUTLINE;

      return content.filter((item) => item.originalLevel <= maxHeadingLevel);
    }) ?? EMPTY_OUTLINE;
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const isWide = useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(min-width: 80rem)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(min-width: 80rem)").matches,
    () => false
  );
  const [railHost, setRailHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isClient || !isWide) return;
    const findHost = () => {
      const host = document.getElementById("article-toc-rail");
      if (host) setRailHost(host);
    };
    findHost();
    const frame = window.requestAnimationFrame(findHost);
    return () => window.cancelAnimationFrame(frame);
  }, [isClient, isWide, items.length]);

  if (!editor || items.length === 0) return null;

  const jumpTo = (item: TableOfContentDataItem) => {
    const heading = item.dom;
    if (!heading) return;

    heading.setAttribute("tabindex", "-1");
    window.scrollTo({
      behavior: "auto",
      top: heading.getBoundingClientRect().top + window.scrollY - ARTICLE_OUTLINE_TOP_OFFSET,
    });
    heading.focus({ preventScroll: true });
    if (window.history.pushState) {
      window.history.pushState(null, "", `#${item.id}`);
    }
  };

  const accordion = (
    <Accordion className={className} defaultExpandedKeys={["article-toc"]} variant="surface">
      <Accordion.Item id="article-toc">
        <Accordion.Heading>
          <Accordion.Trigger>
            {label}
            <Accordion.Indicator />
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body>
            <OutlineList items={items} label={label} onJump={jumpTo} />
          </Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );

  return isWide && railHost ? createPortal(accordion, railHost) : accordion;
}
