"use client";

import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react/rich-text-editor";
import type {
  TableOfContentData,
  TableOfContentDataItem,
} from "@tiptap/extension-table-of-contents";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  ARTICLE_OUTLINE_TOP_OFFSET,
  readingScrollOffset,
} from "@/components/rich-text/extensions/table-of-contents";

const EMPTY_OUTLINE: TableOfContentData = [];

export interface ArticleOutline {
  items: TableOfContentData;
  label: string;
}

const ArticleOutlineContext = createContext<ArticleOutline | null>(null);
const SetArticleOutlineContext = createContext<(outline: ArticleOutline | null) => void>(() => {});

export function ArticleOutlineProvider({ children }: { children: ReactNode }) {
  const [outline, setOutline] = useState<ArticleOutline | null>(null);
  const publish = useCallback((next: ArticleOutline | null) => setOutline(next), []);

  return (
    <SetArticleOutlineContext value={publish}>
      <ArticleOutlineContext value={outline}>{children}</ArticleOutlineContext>
    </SetArticleOutlineContext>
  );
}

export function useArticleOutline() {
  return use(ArticleOutlineContext);
}

function outlineSignature(items: TableOfContentData) {
  return items.map((item) => `${item.id}:${item.isActive ? 1 : 0}`).join("|");
}

function subscribeToReadingPosition(onChange: () => void) {
  window.addEventListener("odyssey-outline-scroll", onChange);
  return () => window.removeEventListener("odyssey-outline-scroll", onChange);
}

/**
 * The heading list lives in the editor. This publishes it when the headings
 * or the active section change, so the action bar can open the list.
 */
export function ArticleOutlineSource({
  label,
  maxHeadingLevel = 3,
}: {
  label: string;
  maxHeadingLevel?: number;
}) {
  const publish = use(SetArticleOutlineContext);
  const { editor } = useRichTextEditor();
  const items =
    useRichTextEditorState((state) => {
      const content =
        (state.editor.storage.tableOfContents?.content as TableOfContentData | undefined) ??
        EMPTY_OUTLINE;

      return !editor || content.length === 0
        ? EMPTY_OUTLINE
        : content.filter((item) => item.originalLevel <= maxHeadingLevel);
    }) ?? EMPTY_OUTLINE;
  const activeSignature = useSyncExternalStore(
    subscribeToReadingPosition,
    () => outlineSignature(items),
    () => ""
  );
  const published = useRef<string | null>(null);

  useEffect(() => {
    if (published.current === activeSignature) return;
    published.current = activeSignature;
    publish(!editor || !activeSignature ? null : { items, label });
  }, [activeSignature, editor, items, label, publish]);

  useEffect(() => {
    return () => {
      published.current = null;
      publish(null);
    };
  }, [publish]);

  return null;
}

export function currentHeadingId(items: TableOfContentData) {
  const position = readingScrollOffset() + ARTICLE_OUTLINE_TOP_OFFSET;
  let activeId = items[0]?.id ?? "";

  for (const item of items) {
    const heading = document.getElementById(item.id) ?? item.dom;
    if (!heading) continue;
    const top = heading.getBoundingClientRect().top + readingScrollOffset();
    if (position >= top) activeId = item.id;
  }

  return activeId;
}

export function headingElement(item: TableOfContentDataItem) {
  const heading = document.getElementById(item.id) ?? item.dom;
  if (!heading) return null;
  heading.setAttribute("tabindex", "-1");
  return heading;
}

export function writeHeadingHash(item: TableOfContentDataItem) {
  if (window.history.pushState) {
    window.history.pushState(null, "", `#${item.id}`);
  }
}
