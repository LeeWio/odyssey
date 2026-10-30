"use client";

import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react/rich-text-editor";
import type {
  TableOfContentData,
  TableOfContentDataItem,
} from "@tiptap/extension-table-of-contents";
import { createContext, use, useEffect, useState, type ReactNode } from "react";

import { ARTICLE_OUTLINE_TOP_OFFSET } from "@/components/rich-text/extensions/table-of-contents";

const EMPTY_OUTLINE: TableOfContentData = [];

export interface ArticleOutlineSnapshot {
  items: TableOfContentData;
  label: string;
}

type OutlineListener = () => void;

/**
 * The action bar lives outside the editor. A revision counter keeps the bar
 * mounted while heading activity changes; callers read the latest list.
 */
class ArticleOutlineRegistry {
  private listeners = new Set<OutlineListener>();
  private revision = 0;
  private snapshot: ArticleOutlineSnapshot | null = null;

  getSnapshot = () => this.snapshot;

  subscribe = (listener: OutlineListener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  publish(snapshot: ArticleOutlineSnapshot | null) {
    const current = this.snapshot;
    const presenceChanged = Boolean(current) !== Boolean(snapshot);
    if (!presenceChanged && sameOutline(current, snapshot)) {
      this.snapshot = snapshot;
      return;
    }
    this.snapshot = snapshot;
    this.revision += 1;
    if (presenceChanged) {
      for (const listener of this.listeners) listener();
    }
  }
}

function sameOutline(current: ArticleOutlineSnapshot | null, next: ArticleOutlineSnapshot | null) {
  if (current === next) return true;
  if (!current || !next || current.label !== next.label) return false;
  if (current.items.length !== next.items.length) return false;
  return current.items.every(
    (item, index) =>
      item.id === next.items[index]?.id && item.isActive === next.items[index]?.isActive
  );
}

const ArticleOutlineRegistryContext = createContext<ArticleOutlineRegistry | null>(null);

export function ArticleOutlineScope({ children }: { children: ReactNode }) {
  const [registry] = useState(() => new ArticleOutlineRegistry());

  return <ArticleOutlineRegistryContext value={registry}>{children}</ArticleOutlineRegistryContext>;
}

export function useArticleOutlineRegistry() {
  return use(ArticleOutlineRegistryContext);
}

export function jumpToOutlineItem(item: TableOfContentDataItem) {
  const heading = item.dom;
  if (!heading) return;

  heading.setAttribute("tabindex", "-1");
  window.scrollTo({
    behavior: "auto",
    top: heading.getBoundingClientRect().top + window.scrollY - ARTICLE_OUTLINE_TOP_OFFSET,
  });
  if (window.history.pushState) {
    window.history.pushState(null, "", `#${item.id}`);
  }
  // The sheet restores focus to its trigger while closing. Focus the heading
  // after that restoration, without scrolling away from the landed position.
  window.setTimeout(() => heading.focus({ preventScroll: true }), 520);
}

export function ArticleOutlinePublisher({
  label,
  maxHeadingLevel = 3,
}: {
  label: string;
  maxHeadingLevel?: number;
}) {
  const registry = useArticleOutlineRegistry();
  const { editor } = useRichTextEditor();
  const items =
    useRichTextEditorState((state) => {
      const content =
        (state.editor.storage.tableOfContents?.content as TableOfContentData | undefined) ??
        EMPTY_OUTLINE;

      return content.filter((item) => item.originalLevel <= maxHeadingLevel);
    }) ?? EMPTY_OUTLINE;

  useEffect(() => {
    registry?.publish(!editor || items.length === 0 ? null : { items, label });
  });

  useEffect(() => {
    return () => registry?.publish(null);
  }, [registry]);

  return null;
}
