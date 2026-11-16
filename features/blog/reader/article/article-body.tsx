"use client";

import { RichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { createReaderExtensionKit } from "@/components/rich-text/extensions/extension-kit";

import { RichTextTableOfContents } from "@/components/rich-text/table-of-contents";
import { ArticleOutlineSource } from "@/features/blog/reader/article/article-outline";
import {
  normalizeRichTextDocument,
  parseJSONContent,
} from "@/components/rich-text/utils/document-normalizer";
import { RICH_TEXT_PROSE_CLASS_NAME } from "@/components/rich-text/prose";

export interface ArticleBodyProps {
  content: string | null | undefined;
  contentType?: string | null;
  /** Remount key when the source document changes. Defaults to `content`. */
  contentKey?: string | null;
  className?: string;
  shellClassName?: string;
  showTableOfContents?: boolean;
  /** Publishes the heading list to the reading action bar. */
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
    <RichTextEditor
      key={contentKey ?? content ?? "article-body"}
      className={className}
      isReadOnly
      extensions={extensions}
      editorOptions={{ editorProps: { attributes: { class: RICH_TEXT_PROSE_CLASS_NAME } } }}
      // HeroUI RichTextEditor already disables immediatelyRender for Next.js SSR.
      defaultValue={parsedContent}
    >
      <RichTextEditor.Shell className={shellClassName}>
        {outlineLabel ? <ArticleOutlineSource label={outlineLabel} /> : null}
        <RichTextEditor.Content />
        {showTableOfContents && !outlineLabel ? (
          <RichTextTableOfContents placement="right" />
        ) : null}
      </RichTextEditor.Shell>
    </RichTextEditor>
  );
}
