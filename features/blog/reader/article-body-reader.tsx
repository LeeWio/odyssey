"use client";

import { RichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { useMemo } from "react";
import { AnimatedRichTextContent } from "@/components/rich-text/animated-rich-text-content";
import { ExtensionKit } from "@/components/rich-text/extensions/extension-kit";
import { RichTextTableOfContents } from "@/components/rich-text/table-of-contents";
import {
  normalizeRichTextDocument,
  parseJSONContent,
} from "@/components/rich-text/utils/document-normalizer";
import { MotionRichTextEditor } from "@/components/ui/motion-rich-text";

export interface ArticleBodyReaderProps {
  content: string | null | undefined;
  contentType?: string | null;
  /** Remount key when the source document changes. Defaults to `content`. */
  contentKey?: string | null;
  shellClassName?: string;
  /** Entrance animation delay in seconds. */
  motionDelay?: number;
  showTableOfContents?: boolean;
}

/**
 * Isolated TipTap read surface. Keep this module behind `next/dynamic` so
 * article chrome can paint without pulling the editor graph.
 */
export function ArticleBodyReader({
  content,
  contentType,
  contentKey,
  shellClassName = "border-none bg-transparent p-0",
  motionDelay = 0,
  showTableOfContents = true,
}: ArticleBodyReaderProps) {
  const parsedContent = useMemo(() => {
    if (!content || contentType !== "JSON") return null;
    const doc = parseJSONContent(content);
    return doc ? normalizeRichTextDocument(doc) : null;
  }, [content, contentType]);

  if (!parsedContent) {
    return (
      <p className="text-default-500 text-base leading-8">
        This article is unavailable because its content is not a supported Tiptap document.
      </p>
    );
  }

  return (
    <MotionRichTextEditor
      key={contentKey ?? content ?? "article-body"}
      isReadOnly
      extensions={ExtensionKit}
      defaultValue={parsedContent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: motionDelay }}
      style={{ willChange: "opacity" }}
    >
      <RichTextEditor.Shell className={shellClassName}>
        <AnimatedRichTextContent />
        {showTableOfContents ? <RichTextTableOfContents placement="right" /> : null}
      </RichTextEditor.Shell>
    </MotionRichTextEditor>
  );
}
