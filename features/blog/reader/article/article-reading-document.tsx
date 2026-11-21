import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import type { JSONContent } from "@tiptap/core";
import { Typography } from "@heroui/react";
import katex from "katex";
import type { CSSProperties, ReactNode } from "react";
import { createReadingSchema } from "@/components/rich-text/extensions/reading-schema";
import {
  getColumnGridTemplate,
  normalizeColumnWidths,
} from "@/components/rich-text/extensions/multi-column/column-widths";
import { Mathematics } from "@/components/rich-text/extensions/mathematics/mathematics";
import {
  IMAGE_ALIGNMENT_CLASS_NAMES,
  normalizeImageAlignment,
  normalizeImageWidthPercent,
} from "@/components/rich-text/extensions/Image/attributes";
import { RICH_TEXT_PROSE_CLASS_NAME } from "@/components/rich-text/prose";
import {
  normalizeRichTextDocument,
  parseJSONContent,
} from "@/components/rich-text/utils/document-normalizer";
import { isSafeLinkUrl } from "@/components/rich-text/utils/link-utils";
import { RemoteMedia } from "@/components/ui/remote-media";
import type { ArticleHeading } from "./article-outline";
import { ReadingContent } from "./reading-content";
import { READING_OPENING_SCRIPT } from "./reading-opening";
import { CopyReadingCode } from "./copy-reading-code";

function textContent(node: JSONContent): string {
  return node.text ?? node.content?.map(textContent).join("") ?? "";
}

function describeDocument(document: JSONContent) {
  const headings: ArticleHeading[] = [];
  const usedIds = new Set<string>();
  let characters = 0;

  function visit(node: JSONContent): JSONContent {
    if (node.text) characters += Array.from(node.text).length;
    const children = node.content?.map(visit);
    if (node.type !== "heading") return children ? { ...node, content: children } : node;

    const title = textContent(node).trim();
    if (!title) return node;

    const storedId = node.attrs?.id ?? node.attrs?.["data-toc-id"];
    const slug = title
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");
    const baseId =
      typeof storedId === "string" && /^[\p{L}\p{N}_-]+$/u.test(storedId)
        ? storedId
        : `section-${slug.slice(0, 72) || headings.length + 1}`;
    let id = baseId;
    for (let suffix = 2; usedIds.has(id); suffix++) id = `${baseId}-${suffix}`;
    usedIds.add(id);
    const level = Number(node.attrs?.level) || 1;
    headings.push({ id, level, textContent: title });
    return { ...node, attrs: { ...node.attrs, id, "data-toc-id": id } };
  }

  const content = visit(document);
  const firstLevel = headings.length ? Math.min(...headings.map(({ level }) => level)) : 1;
  return {
    content,
    headings: headings.map((heading) => ({ ...heading, level: heading.level - firstLevel + 1 })),
    minutes: characters ? Math.max(1, Math.ceil(characters / 260)) : null,
  };
}

function formatMath(latex: unknown, displayMode: boolean) {
  const source = typeof latex === "string" ? latex : "";
  return katex.renderToString(source, {
    ...Mathematics.options.katexOptions,
    displayMode,
    trust: false,
  });
}

function isReadableImage(src: unknown): src is string {
  return (
    typeof src === "string" &&
    ((src.startsWith("/") && !src.startsWith("//")) || /^https?:\/\//i.test(src))
  );
}

export function prepareArticleReading(content: string | null, contentType: string) {
  const raw = contentType === "JSON" && content ? parseJSONContent(content) : null;
  if (!raw) return null;
  return describeDocument(normalizeRichTextDocument(raw));
}

export function ArticleReadingDocument({
  document,
  fallback,
}: {
  document: ReturnType<typeof prepareArticleReading>;
  fallback: string;
}) {
  if (!document)
    return (
      <Typography type="body" color="muted">
        {fallback}
      </Typography>
    );

  const content: ReactNode = renderToReactElement({
    content: document.content,
    extensions: createReadingSchema(),
    options: {
      nodeMapping: {
        imageUpload: () => null,
        details: ({ node, children }) => (
          <details
            className="odyssey-details bg-surface-secondary overflow-hidden"
            open={node.attrs.open === true}
          >
            {children}
          </details>
        ),
        detailsSummary: ({ children }) => (
          <summary className="cursor-pointer p-4">{children}</summary>
        ),
        detailsContent: ({ children }) => (
          <div data-type="detailsContent" className="px-4 pb-4">
            {children}
          </div>
        ),
        columns: ({ node, children }) => (
          <div
            data-type="columns"
            className="grid w-full [grid-template-columns:var(--column-widths)] gap-4"
            style={
              {
                "--column-widths": getColumnGridTemplate(
                  normalizeColumnWidths(node.attrs.widths, node.childCount)
                ),
              } as CSSProperties
            }
          >
            {children}
          </div>
        ),
        taskItem: ({ node, children }) => (
          <li
            data-type="taskItem"
            data-checked={Boolean(node.attrs.checked)}
            className="flex items-start gap-2"
          >
            <input
              type="checkbox"
              checked={Boolean(node.attrs.checked)}
              disabled
              className="mt-[0.4em]"
            />
            <div className="min-w-0 flex-1">{children}</div>
          </li>
        ),
        image: ({ node }) => {
          const { src, alt, alignment, widthPercent, caption } = node.attrs;
          if (!isReadableImage(src)) return null;
          return (
            <div
              className={`flex w-full ${IMAGE_ALIGNMENT_CLASS_NAMES[normalizeImageAlignment(alignment)]}`}
            >
              <figure
                className="max-w-full"
                style={{ width: `${normalizeImageWidthPercent(widthPercent)}%` }}
              >
                <RemoteMedia
                  src={src}
                  alt={typeof alt === "string" ? alt : ""}
                  className="w-full"
                />
                {caption ? <figcaption className="mt-2 text-center">{caption}</figcaption> : null}
              </figure>
            </div>
          );
        },
        codeBlock: ({ node }) => (
          <div data-reading-code="" className="min-w-0">
            <div className="flex justify-end">
              <CopyReadingCode />
            </div>
            <pre className="overflow-x-auto">
              <code className={node.attrs.language ? `language-${node.attrs.language}` : undefined}>
                {node.textContent}
              </code>
            </pre>
          </div>
        ),
        attachment: ({ node }) =>
          isSafeLinkUrl(node.attrs.src) ? (
            <a download href={node.attrs.src}>
              {node.attrs.fileName || node.attrs.src}
            </a>
          ) : null,
        inlineMath: ({ node }) => (
          <span
            data-type="inline-math"
            dangerouslySetInnerHTML={{ __html: formatMath(node.attrs.latex, false) }}
          />
        ),
        blockMath: ({ node }) => (
          <div
            data-type="block-math"
            dangerouslySetInnerHTML={{ __html: formatMath(node.attrs.latex, true) }}
          />
        ),
      },
    },
  });

  return (
    <ReadingContent className={RICH_TEXT_PROSE_CLASS_NAME}>
      <script dangerouslySetInnerHTML={{ __html: READING_OPENING_SCRIPT }} />
      {content}
    </ReadingContent>
  );
}
