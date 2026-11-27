import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import type { JSONContent } from "@tiptap/core";
import { Typography } from "@heroui/react";
import katex from "katex";
import type { CSSProperties, ReactNode } from "react";
import { CodePreview } from "@/components/rich-text/code-block/code-preview";
import { readCodeSnippets } from "@/components/rich-text/code-block/code-snippets";
import { ReadingCodeWidget } from "@/components/rich-text/code-block/reading-code-widget";
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
import { ReadingCode } from "./reading-code";

function textContent(node: JSONContent): string {
  return node.text ?? node.content?.map(textContent).join("") ?? "";
}

async function HighlightedReadingCode({
  chrome,
  frame,
  snippets,
  showLineNumbers,
}: {
  chrome: unknown;
  frame: unknown;
  snippets: unknown;
  showLineNumbers: boolean;
}) {
  const { highlightCode } = await import("@/components/rich-text/code-block/highlight-code");
  const panels = await Promise.all(
    readCodeSnippets(snippets).map(async (snippet) => ({
      ...snippet,
      panel: (
        <CodePreview
          code={snippet.code}
          tokens={await highlightCode(snippet)}
          showLineNumbers={showLineNumbers}
        />
      ),
    }))
  );
  return <ReadingCodeWidget chrome={chrome} frame={frame} snippets={panels} />;
}

function describeDocument(document: JSONContent) {
  const headings: ArticleHeading[] = [];
  let characters = 0;

  function visit(node: JSONContent) {
    if (node.text) characters += Array.from(node.text).length;
    if (node.type === "heading") {
      const title = textContent(node).trim();
      const id = node.attrs?.id;
      if (title && typeof id === "string") {
        headings.push({ id, level: Number(node.attrs?.level) || 1, textContent: title });
      }
    }
    node.content?.forEach(visit);
  }

  visit(document);
  const firstLevel = headings.length ? Math.min(...headings.map(({ level }) => level)) : 1;
  return {
    content: document,
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
      unhandledMark: ({ children }) => children,
      unhandledNode: ({ children }) =>
        children == null || (Array.isArray(children) && !children.length) ? (
          <span className="text-muted">{fallback}</span>
        ) : (
          children
        ),
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
                {typeof caption === "string" && caption ? (
                  <figcaption className="mt-2 text-center">{caption}</figcaption>
                ) : null}
              </figure>
            </div>
          );
        },
        codeBlock: ({ node }) => (
          <ReadingCode code={node.textContent} language={node.attrs.language} />
        ),
        highlightedCodeBlock: ({ node }) => (
          <HighlightedReadingCode
            chrome={node.attrs.chrome}
            frame={node.attrs.frame}
            snippets={node.attrs.snippets}
            showLineNumbers={node.attrs.showLineNumbers !== false}
          />
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
