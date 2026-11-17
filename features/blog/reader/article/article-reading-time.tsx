"use client";

import { useRichTextEditorState } from "@heroui-pro/react/rich-text-editor";
import { createContext, use, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { readingMinutesFromCounts } from "@/lib/reading-time";

const ArticleReadingMinutesContext = createContext<number | null>(null);
const SetArticleReadingMinutesContext = createContext<(minutes: number | null) => void>(() => {});

/** Minutes published by the reader editor's HeroUI character count. */
export function useArticleReadingMinutes() {
  return use(ArticleReadingMinutesContext);
}

export function ArticleReadingTimeProvider({ children }: { children: ReactNode }) {
  const [minutes, setMinutes] = useState<number | null>(null);

  return (
    <SetArticleReadingMinutesContext value={setMinutes}>
      <ArticleReadingMinutesContext value={minutes}>{children}</ArticleReadingMinutesContext>
    </SetArticleReadingMinutesContext>
  );
}

/**
 * Lives inside RichTextEditor and reads the counts HeroUI keeps on that
 * editor. The visible minutes stay in the article hero.
 */
function countsFromEditor(editor: {
  getText: () => string;
  storage: { characterCount?: { characters?: () => number; words?: () => number } };
}) {
  const text = editor.getText();
  return {
    characterCount: editor.storage.characterCount?.characters?.() ?? text.length,
    text,
    wordCount: editor.storage.characterCount?.words?.() ?? 0,
  };
}

export function ArticleReadingTimePublisher() {
  const publish = use(SetArticleReadingMinutesContext);
  const published = useRef<string | null>(null);
  const counts = useRichTextEditorState((state) => countsFromEditor(state.editor));

  useLayoutEffect(() => {
    if (!counts) return;
    const signature = `${counts.characterCount}:${counts.wordCount}:${counts.text.length}`;
    if (published.current === signature) return;
    published.current = signature;
    publish(readingMinutesFromCounts(counts));
  }, [counts, publish]);

  useLayoutEffect(() => {
    return () => {
      published.current = null;
      publish(null);
    };
  }, [publish]);

  return null;
}
