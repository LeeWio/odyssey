import type { JSONContent } from "@tiptap/react";

import { normalizeLinkUrl } from "./link-utils";

// The minimal valid, standard ProseMirror document structure
export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJSONContentTree(value: unknown): value is JSONContent {
  const pending: unknown[] = [value];

  while (pending.length > 0) {
    const node = pending.pop();

    if (!isRecord(node) || typeof node.type !== "string") return false;
    if (node.text !== undefined && typeof node.text !== "string") return false;
    if (node.attrs !== undefined && !isRecord(node.attrs)) return false;

    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks)) return false;

      for (const mark of node.marks) {
        if (!isRecord(mark) || typeof mark.type !== "string") return false;
        if (mark.attrs !== undefined && !isRecord(mark.attrs)) return false;
      }
    }

    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) return false;
      pending.push(...node.content);
    }
  }

  return true;
}

export function parseJSONContent(value: unknown): JSONContent | null {
  if (typeof value === "string") {
    try {
      return parseJSONContent(JSON.parse(value));
    } catch {
      return null;
    }
  }

  return isJSONContentTree(value) && value.type === "doc" && Array.isArray(value.content)
    ? value
    : null;
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

export function hasPendingImageUploads(content: JSONContent): boolean {
  if (typeof content.attrs?.uploadId === "string") return true;

  return content.content?.some(hasPendingImageUploads) ?? false;
}

export function removeTemporaryImageAttributes(content: JSONContent): JSONContent {
  const node = { ...content };
  delete node.attrs;
  delete node.content;
  const attrs = { ...content.attrs };
  delete attrs.uploadId;

  return {
    ...node,
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
    ...(content.content ? { content: content.content.map(removeTemporaryImageAttributes) } : {}),
  };
}
