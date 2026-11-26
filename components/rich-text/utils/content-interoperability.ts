import { generateHTML, generateJSON, type JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { marked } from "marked";
import { parse, type DefaultTreeAdapterTypes } from "parse5";

import { createConversionExtensions } from "../extensions/extension-kit";
import { parseJSONContent } from "./document-normalizer";

export type ContentInteroperabilityFormat = "markdown" | "html" | "json";

export interface ContentInteroperabilityWarning {
  blocking: boolean;
  code: "invalid-content" | "round-trip-change" | "unsupported-html";
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

const CONVERSION_EXTENSIONS = createConversionExtensions();
const SUPPORTED_HTML_TAGS = new Set([
  "a",
  "audio",
  "b",
  "blockquote",
  "br",
  "code",
  "col",
  "colgroup",
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
  "input",
  "label",
  "li",
  "mark",
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
  "tfoot",
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
  const parsed = parse(source);
  const unsupported = new Set<string>();
  const documentElement = parsed.childNodes.find((node) => node.nodeName === "html");
  if (!documentElement || !("childNodes" in documentElement)) return [];

  // Walk the HTML tree without creating browser elements or loading its resources.
  function visit(node: DefaultTreeAdapterTypes.ChildNode) {
    if (!("tagName" in node)) return;
    if (!SUPPORTED_HTML_TAGS.has(node.tagName)) unsupported.add(node.tagName);
    node.childNodes.forEach(visit);
  }

  for (const section of documentElement.childNodes) {
    if ("childNodes" in section) section.childNodes.forEach(visit);
  }

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
  const node = editor.schema.nodeFromJSON(document);
  node.check();
  return node.toJSON();
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
  const message = error instanceof Error ? error.message : "The content could not be parsed.";
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
      const document = parseJSONContent(JSON.parse(source));
      if (!document) throw new Error("The content is not a valid Tiptap JSON document.");

      const validatedDocument = validateAgainstEditor(editor, document);
      return {
        canonicalSource: JSON.stringify(validatedDocument, null, 2),
        document: validatedDocument,
        warnings: [],
      };
    }

    const rawHtml: string[] = [];
    if (format === "markdown") {
      marked.walkTokens(marked.lexer(source), (token) => {
        if (token.type === "html") rawHtml.push(token.raw);
      });
    }
    const htmlWarnings = inspectHTML(format === "html" ? source : rawHtml.join(""));
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
    return { source: JSON.stringify(document, null, 2), warnings: [] };
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
