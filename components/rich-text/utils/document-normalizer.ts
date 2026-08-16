import { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import type { JSONContent } from "@tiptap/react";

import { normalizeLinkUrl } from "./link-utils";
import { decodeRichTextPayload } from "./content-schema";

// The minimal valid, standard ProseMirror document structure
export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function parseJSONContent(value: unknown): JSONContent | null {
  try {
    return decodeRichTextPayload(value).document;
  } catch {
    return null;
  }
}

function getNodeTextContent(node: JSONContent): string {
  if (typeof node.text === "string") return node.text;

  return node.content?.map(getNodeTextContent).join("") ?? "";
}

function createAnchorSlug(value: string, position: number): string {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `section-${position}`;
}

function normalizeMarks(marks: JSONContent["marks"]): JSONContent["marks"] {
  return marks?.flatMap((mark) => {
    if (mark.type !== "link") {
      return [
        {
          ...mark,
          ...(mark.attrs ? { attrs: { ...mark.attrs } } : {}),
        },
      ];
    }

    const href = normalizeLinkUrl(mark.attrs?.href);
    if (!href) return [];

    const { target, ...attrs } = mark.attrs ?? {};

    return [
      {
        ...mark,
        attrs: {
          ...attrs,
          href,
          ...(target === "_blank" ? { target } : {}),
        },
      },
    ];
  });
}

/**
 * Creates a safe copy of a Tiptap document for rendering or persistence.
 * Heading IDs derive from heading text and remain deterministic across readers.
 */
export function normalizeRichTextDocument(content: JSONContent): JSONContent {
  const usedAnchorIds = new Set<string>();
  let headingPosition = 0;

  const normalizeNode = (node: JSONContent): JSONContent => {
    const normalizedContent = node.content?.map(normalizeNode);
    const normalizedMarks = normalizeMarks(node.marks);
    const attrs = node.attrs ? { ...node.attrs } : undefined;

    if (node.type === "heading") {
      headingPosition += 1;

      const baseId = createAnchorSlug(
        getNodeTextContent({
          ...node,
          ...(normalizedContent ? { content: normalizedContent } : {}),
        }),
        headingPosition
      );
      let id = baseId;
      let duplicateCount = 2;

      while (usedAnchorIds.has(id)) {
        id = `${baseId}-${duplicateCount}`;
        duplicateCount += 1;
      }

      usedAnchorIds.add(id);

      return {
        ...node,
        attrs: {
          ...attrs,
          id,
          "data-toc-id": id,
        },
        ...(normalizedMarks ? { marks: normalizedMarks } : {}),
        ...(normalizedContent ? { content: normalizedContent } : {}),
      };
    }

    return {
      ...node,
      ...(attrs ? { attrs } : {}),
      ...(normalizedMarks ? { marks: normalizedMarks } : {}),
      ...(normalizedContent ? { content: normalizedContent } : {}),
    };
  };

  return normalizeNode(content);
}

/**
 * Normalizes any potential Tiptap document input, converting invalid or empty
 * structures (like empty '{}' objects, undefined values, or raw JSON strings)
 * safely into a valid, standard ProseMirror JSONContent tree.
 */
export const normalizeJSONContent = (value: unknown): JSONContent => {
  const content = parseJSONContent(value);
  return content && content.content?.length ? normalizeRichTextDocument(content) : EMPTY_DOC;
};

export interface MediaValidationIssue {
  code: "invalid-youtube" | "missing-alt" | "missing-source" | "pending-upload";
  nodeType: string;
}

export function hasPendingMediaUploads(content: JSONContent): boolean {
  if (typeof content.attrs?.uploadId === "string") return true;

  return content.content?.some(hasPendingMediaUploads) ?? false;
}

export const hasPendingImageUploads = hasPendingMediaUploads;

export function getMediaValidationIssues(content: JSONContent): MediaValidationIssue[] {
  const issues: MediaValidationIssue[] = [];

  const visit = (node: JSONContent) => {
    const nodeType = node.type || "unknown";
    const src = typeof node.attrs?.src === "string" ? node.attrs.src.trim() : "";

    if (typeof node.attrs?.uploadId === "string") {
      issues.push({ code: "pending-upload", nodeType });
    }

    if (["attachment", "audio", "image"].includes(nodeType) && !src) {
      issues.push({ code: "missing-source", nodeType });
    }

    if (nodeType === "image" && src) {
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt.trim() : "";
      if (!alt) issues.push({ code: "missing-alt", nodeType });
    }

    if (nodeType === "youtube") {
      if (!src || !isValidYoutubeUrl(src)) issues.push({ code: "invalid-youtube", nodeType });
    }

    node.content?.forEach(visit);
  };

  visit(content);
  return issues;
}

export function removeTemporaryMediaAttributes(content: JSONContent): JSONContent {
  const node = { ...content };
  delete node.attrs;
  delete node.content;
  const attrs = { ...content.attrs };
  delete attrs.uploadId;

  return {
    ...node,
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
    ...(content.content ? { content: content.content.map(removeTemporaryMediaAttributes) } : {}),
  };
}

export const removeTemporaryImageAttributes = removeTemporaryMediaAttributes;
