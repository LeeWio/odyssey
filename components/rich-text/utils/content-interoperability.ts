import { generateHTML, generateJSON, type JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { ExtensionKit } from "../extensions/extension-kit";
import {
  decodeRichTextPayload,
  RichTextSchemaError,
  serializeRichTextPayload,
} from "./content-schema";

export type ContentInteroperabilityFormat = "markdown" | "html" | "json";

export interface ContentInteroperabilityWarning {
  blocking: boolean;
  code: "invalid-content" | "migration" | "round-trip-change" | "unsupported-html";
  message: string;
}

export interface ContentImportAnalysis {
  canonicalSource: string;
  document: JSONContent | null;
  warnings: ContentInteroperabilityWarning[];
}

export interface ContentExportAnalysis {
  source: string;
  warnings: ContentInteroperabilityWarning[];
}

const CONVERSION_EXTENSIONS = [StarterKit, ...ExtensionKit];
const SUPPORTED_HTML_TAGS = new Set([
  "a",
  "audio",
  "b",
  "blockquote",
  "br",
  "code",
  "del",
  "details",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "iframe",
  "img",
  "li",
  "math",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strike",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

function inspectHTML(source: string): ContentInteroperabilityWarning[] {
  if (!source.trim()) return [];
  const parsed = new DOMParser().parseFromString(source, "text/html");
  const unsupported = new Set<string>();

  parsed.body.querySelectorAll("*").forEach((element) => {
    const tag = element.tagName.toLowerCase();
    if (!SUPPORTED_HTML_TAGS.has(tag)) unsupported.add(tag);
  });

  if (unsupported.size === 0) return [];
  return [
    {
      blocking: true,
      code: "unsupported-html",
      message: `Unsupported HTML elements would be removed: ${[...unsupported]
        .map((tag) => `<${tag}>`)
        .join(", ")}.`,
    },
  ];
}

function validateAgainstEditor(editor: Editor, document: JSONContent): JSONContent {
  return editor.schema.nodeFromJSON(document).toJSON();
}

function getMarkdownManager(editor: Editor) {
  if (!editor.markdown) {
    throw new Error("The Markdown extension is not available in this editor.");
  }
  return editor.markdown;
}

function canonicalizeForComparison(value: JSONContent, format: ContentInteroperabilityFormat) {
  const visit = (node: JSONContent): JSONContent => {
    const attrs = node.attrs ? { ...node.attrs } : undefined;
    if (attrs) {
      delete attrs.uploadId;
      if (format === "markdown" && node.type === "heading") {
        delete attrs.id;
        delete attrs["data-toc-id"];
      }
      for (const [key, attribute] of Object.entries(attrs)) {
        if (attribute === null || attribute === undefined) delete attrs[key];
      }
    }

    return {
      ...node,
      ...(attrs && Object.keys(attrs).length > 0 ? { attrs } : { attrs: undefined }),
      ...(node.content ? { content: node.content.map(visit) } : {}),
    };
  };

  return visit(value);
}

function roundTripWarning(
  editor: Editor,
  original: JSONContent,
  roundTripped: JSONContent,
  format: ContentInteroperabilityFormat
): ContentInteroperabilityWarning[] {
  const originalCanonical = canonicalizeForComparison(
    validateAgainstEditor(editor, original),
    format
  );
  const roundTripCanonical = canonicalizeForComparison(
    validateAgainstEditor(editor, roundTripped),
    format
  );

  return JSON.stringify(originalCanonical) === JSON.stringify(roundTripCanonical)
    ? []
    : [
        {
          blocking: false,
          code: "round-trip-change",
          message:
            "This format cannot represent every document detail exactly. Review the exported preview before continuing.",
        },
      ];
}

function invalidAnalysis(error: unknown): ContentImportAnalysis {
  const message =
    error instanceof RichTextSchemaError || error instanceof Error
      ? error.message
      : "The content could not be parsed.";
  return {
    canonicalSource: "",
    document: null,
    warnings: [{ blocking: true, code: "invalid-content", message }],
  };
}

export function analyzeContentImport(
  editor: Editor,
  format: ContentInteroperabilityFormat,
  source: string
): ContentImportAnalysis {
  try {
    if (format === "json") {
      const decoded = decodeRichTextPayload(source);
      const document = validateAgainstEditor(editor, decoded.document);
      return {
        canonicalSource: serializeRichTextPayload(document, true),
        document,
        warnings: decoded.migrated
          ? [
              {
                blocking: false,
                code: "migration",
                message: `Legacy schema v${decoded.sourceVersion} will be migrated to v2 on import.`,
              },
            ]
          : [],
      };
    }

    const htmlWarnings = inspectHTML(source);
    if (htmlWarnings.some((warning) => warning.blocking)) {
      return { canonicalSource: "", document: null, warnings: htmlWarnings };
    }

    if (format === "html") {
      const document = validateAgainstEditor(editor, generateJSON(source, CONVERSION_EXTENSIONS));
      const canonicalSource = generateHTML(document, CONVERSION_EXTENSIONS);
      const reparsed = generateJSON(canonicalSource, CONVERSION_EXTENSIONS);
      return {
        canonicalSource,
        document,
        warnings: [...htmlWarnings, ...roundTripWarning(editor, document, reparsed, format)],
      };
    }

    const markdown = getMarkdownManager(editor);
    const document = validateAgainstEditor(editor, markdown.parse(source));
    const canonicalSource = markdown.serialize(document);
    const reparsed = markdown.parse(canonicalSource);
    return {
      canonicalSource,
      document,
      warnings: [...htmlWarnings, ...roundTripWarning(editor, document, reparsed, format)],
    };
  } catch (error) {
    return invalidAnalysis(error);
  }
}

export function analyzeContentExport(
  editor: Editor,
  format: ContentInteroperabilityFormat
): ContentExportAnalysis {
  const document = validateAgainstEditor(editor, editor.getJSON());
  if (format === "json") {
    return { source: serializeRichTextPayload(document, true), warnings: [] };
  }

  if (format === "html") {
    const source = generateHTML(document, CONVERSION_EXTENSIONS);
    const reparsed = generateJSON(source, CONVERSION_EXTENSIONS);
    return { source, warnings: roundTripWarning(editor, document, reparsed, format) };
  }

  const markdown = getMarkdownManager(editor);
  const source = markdown.serialize(document);
  const reparsed = markdown.parse(source);
  return { source, warnings: roundTripWarning(editor, document, reparsed, format) };
}

export function canImportContent(analysis: ContentImportAnalysis | null): boolean {
  return Boolean(analysis?.document && !analysis.warnings.some((warning) => warning.blocking));
}
