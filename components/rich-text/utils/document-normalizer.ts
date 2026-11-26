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

    const href = typeof mark.attrs?.href === "string" ? normalizeLinkUrl(mark.attrs.href) : null;
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
  const reserved = new Set<string>();
  const assigned = new Set<string>();
  const suffixes = new Map<string, number>();
  const headingText = (node: JSONContent): string =>
    node.text ?? (node.content ?? []).map(headingText).join("");

  function storedAnchor(node: JSONContent) {
    return [node.attrs?.["data-toc-id"], node.attrs?.id].find(
      (id): id is string => typeof id === "string" && /^[\p{L}\p{N}_-]+$/u.test(id)
    );
  }

  function reserve(node: JSONContent) {
    if (node.type === "heading") {
      const id = storedAnchor(node);
      if (id) reserved.add(id);
    }
    node.content?.forEach(reserve);
  }

  reserve(content);

  function headingAnchor(node: JSONContent) {
    const stored = storedAnchor(node);
    if (stored && !assigned.has(stored)) {
      assigned.add(stored);
      return stored;
    }

    const base =
      headingText(node)
        .trim()
        .normalize("NFKD")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "") || "section";
    let suffix = suffixes.get(base) ?? 1;
    let id = suffix === 1 ? base : `${base}-${suffix}`;
    while (reserved.has(id) || assigned.has(id)) {
      suffix++;
      id = `${base}-${suffix}`;
    }
    suffixes.set(base, suffix + 1);
    assigned.add(id);
    return id;
  }

  const normalizeNode = (node: JSONContent): JSONContent => {
    const anchor = node.type === "heading" ? headingAnchor(node) : undefined;
    const normalizedContent = node.content?.map(normalizeNode);
    const normalizedMarks = normalizeMarks(node.marks);
    const attrs = node.attrs ? { ...node.attrs } : undefined;

    if (anchor) {
      const level = clampHeadingLevel(Number(attrs?.level));
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

function isPendingMediaUpload(node: JSONContent) {
  return node.type === "imageUpload" || typeof node.attrs?.uploadId === "string";
}

export function hasPendingMediaUploads(content: JSONContent): boolean {
  if (isPendingMediaUpload(content)) return true;

  return content.content?.some(hasPendingMediaUploads) ?? false;
}

export const hasPendingImageUploads = hasPendingMediaUploads;

export function getMediaValidationIssues(content: JSONContent): MediaValidationIssue[] {
  const issues: MediaValidationIssue[] = [];

  const visit = (node: JSONContent) => {
    const nodeType = node.type || "unknown";
    const src = typeof node.attrs?.src === "string" ? node.attrs.src.trim() : "";

    if (isPendingMediaUpload(node)) {
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
