"use client";

import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react/rich-text-editor";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useArticleOutlinePublisher, useArticleReadingMinutesPublisher } from "./article-outline";

const EMPTY_OUTLINE: TableOfContentData = [];

function outlineSignature(items: TableOfContentData) {
  return items.map((item) => `${item.id}:${item.isActive ? 1 : 0}`).join("|");
}

function subscribeToReadingPosition(onChange: () => void) {
  window.addEventListener("odyssey-outline-scroll", onChange);
  return () => window.removeEventListener("odyssey-outline-scroll", onChange);
}

const CHARACTERS_PER_MINUTE = 260;

/** Publishes HeroUI's character count as reading minutes for the article hero. */
export function ArticleReadingTimeSource() {
  const publish = useArticleReadingMinutesPublisher();
  const characterCount = useRichTextEditorState((state) => {
    const count = state.editor.storage.characterCount?.characters?.();
    return count && count > 0 ? count : null;
  });

  useEffect(() => {
    publish(characterCount ? Math.max(1, Math.ceil(characterCount / CHARACTERS_PER_MINUTE)) : null);
    return () => publish(null);
  }, [characterCount, publish]);

  return null;
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
  const publish = useArticleOutlinePublisher();
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
