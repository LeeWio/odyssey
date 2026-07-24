"use client";

import type { RichTextEditorValueChangeDetails } from "@heroui-pro/react";
import type { Editor } from "@tiptap/core";
import type { JSONContent } from "@tiptap/react";
import { useEffect, useRef } from "react";
import { useRichTextAutosave } from "./use-rich-text-autosave";
import { useRichTextPublish } from "./use-rich-text-publish";

interface UseRichTextSetupProps {
  identifier: string;
  initialValue?: JSONContent;
  onChange?: (value: JSONContent, details: RichTextEditorValueChangeDetails) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
}

export function useRichTextSetup({
  identifier,
  initialValue,
  onChange,
  isFullscreen = false,
  onToggleFullscreen,
  onClose,
}: UseRichTextSetupProps) {
  // 1. Ref to intercept and programmatically control Tiptap's Editor instance
  const editorRef = useRef<Editor | null>(null);

  // 2. Decoupled Content Autosaving State Hook with full details support
  const autosave = useRichTextAutosave(identifier, initialValue, onChange);

  // 3. Decoupled Document Publishing State Hook
  const publish = useRichTextPublish(identifier, autosave.currentContent);

  // Intercept Escape key to exit fullscreen before closing the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        e.stopPropagation();
        onToggleFullscreen?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true); // Capture phase to preempt modal close
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isFullscreen, onToggleFullscreen]);

  return {
    editorRef,
    autosave,
    publish,
    onClose,
  };
}
export type RichTextSetupResult = ReturnType<typeof useRichTextSetup>;
