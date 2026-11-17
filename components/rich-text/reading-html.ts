import { generateHTML } from "@tiptap/html/server";

import { createConversionExtensions } from "@/components/rich-text/extensions/extension-kit";
import {
  normalizeRichTextDocument,
  parseJSONContent,
} from "@/components/rich-text/utils/document-normalizer";

/** Reading HTML for the article JSON. The editor hydrates this instead of a skeleton. */
export function readingHtml(content: string | null | undefined, contentType?: string | null) {
  if (!content || contentType !== "JSON") return "";
  const document = parseJSONContent(content);
  if (!document) return "";
  return generateHTML(normalizeRichTextDocument(document), createConversionExtensions());
}
