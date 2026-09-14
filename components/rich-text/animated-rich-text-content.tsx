"use client";

import { useGSAP } from "@gsap/react";
import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { gsap } from "gsap";
import { startBlockEntrance } from "./animation/block-entrance";

gsap.registerPlugin(useGSAP);

interface AnimatedRichTextContentProps {
  className?: string;
  enabled?: boolean;
  /** Milliseconds between blocks entering the viewport together. */
  stagger?: number;
  /** Duration of a single block entrance in milliseconds. */
  duration?: number;
}

export function AnimatedRichTextContent({
  className,
  enabled = true,
  stagger = 45,
  duration = 280,
}: AnimatedRichTextContentProps) {
  const { editor, isReadOnly } = useRichTextEditor();
  useGSAP(
    () => {
      if (!editor || !enabled || !isReadOnly || typeof IntersectionObserver === "undefined") return;
      return startBlockEntrance(editor, { duration, stagger });
    },
    { dependencies: [editor, enabled, isReadOnly, stagger, duration], revertOnUpdate: true }
  );

  return <RichTextEditor.Content className={className} />;
}
