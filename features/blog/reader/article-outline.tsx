"use client";

import { Accordion, ListBox } from "@heroui/react";
import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react/rich-text-editor";
import type { TableOfContentData, TableOfContentDataItem } from "@tiptap/extension-table-of-contents";
import { useSyncExternalStore } from "react";
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
  variant,
}: {
  items: TableOfContentData;
  label: string;
  onJump: (item: TableOfContentDataItem) => void;
  variant: "inline" | "rail";
}) {
  useSyncExternalStore(subscribeToOutline, () => items.find((item) => item.isActive)?.id ?? "", () => "");
  const activeId = items.find((item) => item.isActive)?.id ?? items[0]?.id ?? "";

  return (
    <ListBox
      aria-label={label}
      className={cn(variant === "rail" && "max-h-[calc(100dvh-9rem)] overflow-y-auto")}
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
          <span style={{ marginInlineStart: `${(item.level - 1) * 0.75}rem` }}>{item.textContent}</span>
        </ListBox.Item>
      ))}
    </ListBox>
  );
}

export function ArticleOutline({
  className = "",
  label,
  maxHeadingLevel = 3,
  variant = "inline",
}: {
  className?: string;
  label: string;
  maxHeadingLevel?: number;
  variant?: "inline" | "rail";
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
  const railHost =
    variant === "rail" && isClient ? document.getElementById("article-outline-rail") : null;

  if (!editor || items.length === 0) return null;

  const jumpTo = (item: TableOfContentDataItem) => {
    const heading = item.dom;
    if (!heading) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.setAttribute("tabindex", "-1");
    window.scrollTo({
      behavior: reduceMotion ? "auto" : "smooth",
      top: heading.getBoundingClientRect().top + window.scrollY - ARTICLE_OUTLINE_TOP_OFFSET,
    });
    heading.focus({ preventScroll: true });
    if (window.history.pushState) {
      window.history.pushState(null, "", `#${item.id}`);
    }
  };

  const outlineList = (
    <OutlineList items={items} label={label} variant={variant} onJump={jumpTo} />
  );

  const accordion = (
    <Accordion
      className={cn(variant === "inline" && "mb-8 xl:hidden", className)}
      defaultExpandedKeys={[`article-outline-${variant}`]}
      variant="surface"
    >
      <Accordion.Item id={`article-outline-${variant}`}>
        <Accordion.Heading>
          <Accordion.Trigger>
            {label}
            <Accordion.Indicator />
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body>{outlineList}</Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );

  if (variant === "rail") {
    return railHost ? createPortal(accordion, railHost) : null;
  }

  return accordion;
}
