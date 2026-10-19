"use client";

import { Typography } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AnimatedRichTextContent } from "@/components/rich-text/animated-rich-text-content";
import { createReaderExtensionKit } from "@/components/rich-text/extensions/extension-kit";

import { RichTextTableOfContents } from "@/components/rich-text/table-of-contents";
import { ArticleToc } from "@/features/blog/reader/article/article-toc";
import {
  normalizeRichTextDocument,
  parseJSONContent,
} from "@/components/rich-text/utils/document-normalizer";
import { MotionRichTextEditor } from "@/components/ui/motion-rich-text";

export interface ArticleBodyProps {
  content: string | null | undefined;
  contentType?: string | null;
  /** Remount key when the source document changes. Defaults to `content`. */
  contentKey?: string | null;
  className?: string;
  shellClassName?: string;
  /** Entrance animation delay in seconds. */
  motionDelay?: number;
  showTableOfContents?: boolean;
  /** Persistent heading list. The floating contents control stays off when this is set. */
  outlineLabel?: string;
}

/**
 * Isolated TipTap read surface. Keep this module behind `next/dynamic` so
 * article chrome can paint without pulling the editor graph.
 */
export function ArticleBody({
  content,
  contentType,
  contentKey,
  className,
  shellClassName = "border-none bg-transparent p-0",
  motionDelay = 0,
  outlineLabel,
  showTableOfContents = true,
}: ArticleBodyProps) {
  const t = useTranslations("Article");
  const parsedContent = useMemo(() => {
    if (!content || contentType !== "JSON") return null;
    const doc = parseJSONContent(content);
    return doc ? normalizeRichTextDocument(doc) : null;
  }, [content, contentType]);

  const extensions = useMemo(() => createReaderExtensionKit(), []);

  if (!parsedContent) {
    return <p className="text-default-500 text-base leading-8">{t("unsupportedContent")}</p>;
  }

  return (
    <MotionRichTextEditor
      key={contentKey ?? content ?? "article-body"}
      className={className}
      isReadOnly
      extensions={extensions}
      // HeroUI RichTextEditor already disables immediatelyRender for Next.js SSR.
      defaultValue={parsedContent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: motionDelay }}
      style={{ willChange: "opacity" }}
    >
      <RichTextEditor.Shell className={shellClassName}>
        {outlineLabel ? <ArticleToc label={outlineLabel} /> : null}
        <Typography.Prose className="max-w-none [&_img]:h-auto [&_img]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto">
          <AnimatedRichTextContent />
        </Typography.Prose>
        {showTableOfContents && !outlineLabel ? (
          <RichTextTableOfContents placement="right" />
        ) : null}
      </RichTextEditor.Shell>
    </MotionRichTextEditor>
  );
}
