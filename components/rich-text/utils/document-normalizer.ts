import { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import type { JSONContent } from "@tiptap/react";

import { clampHeadingLevel } from "@/components/rich-text/extensions/heading";

import { normalizeLinkUrl } from "./link-utils";

// The minimal valid, standard ProseMirror document structure
export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Basic shape validation before handing a document to Tiptap's schema. */
export function isJSONContentTree(value: unknown): value is JSONContent {
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
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return isJSONContentTree(parsed) && parsed.type === "doc" && Array.isArray(parsed.content)
      ? parsed
      : null;
  } catch {
    return null;
  }
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
 * Heading IDs are deterministic and shared with Nexus metadata generation.
 */
export function normalizeRichTextDocument(content: JSONContent): JSONContent {
  const anchorCounts = new Map<string, number>();

  const headingAnchor = (node: JSONContent) => {
    const text = (node.content ?? [])
      .map((child) => (child.type === "text" ? (child.text ?? "") : headingText(child)))
      .join("")
      .trim();
    const base =
      text
        .normalize("NFKD")
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}\p{Script=Han}]+/gu, "-")
        .replace(/^-+|-+$/g, "") || "section";
    const count = (anchorCounts.get(base) ?? 0) + 1;
    anchorCounts.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };

  const headingText = (node: JSONContent): string =>
    node.type === "text" ? (node.text ?? "") : (node.content ?? []).map(headingText).join("");

  const normalizeNode = (node: JSONContent): JSONContent => {
    const normalizedContent = node.content?.map(normalizeNode);
    const normalizedMarks = normalizeMarks(node.marks);
    const attrs = node.attrs ? { ...node.attrs } : undefined;

    if (node.type === "heading") {
      const level = clampHeadingLevel(Number(attrs?.level));
      const anchor =
        typeof attrs?.["data-toc-id"] === "string" && attrs["data-toc-id"]
          ? attrs["data-toc-id"]
          : headingAnchor(node);
      return {
        ...node,
        attrs: { ...attrs, level, id: anchor, "data-toc-id": anchor },
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
