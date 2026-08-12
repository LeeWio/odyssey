import type { JSONContent } from "@tiptap/react";

import type { PostRequest, PostStatus } from "@/features/blog";
import { parseJSONContent } from "./document-normalizer";

const DRAFT_STORAGE_PREFIX = "odyssey_rich_text_draft:";
const DRAFT_VERSION = 1;
export const NEW_RICH_TEXT_DRAFT_ID = "new";
const POST_STATUSES = new Set<PostStatus>([
  "DRAFT",
  "PENDING_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]);

export interface RichTextDraft {
  content: JSONContent;
  postData: Partial<PostRequest>;
  savedAt: number;
  version: typeof DRAFT_VERSION;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getDraftKey(activeId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${activeId}`;
}

function sanitizePostData(value: unknown): Partial<PostRequest> | null {
  if (!isRecord(value)) return null;

  const data: Partial<PostRequest> = {};
  const stringFields = ["title", "slug", "summary", "coverImage"] as const;

  for (const field of stringFields) {
    if (typeof value[field] === "string") data[field] = value[field];
  }

  if (typeof value.isFeatured === "boolean") data.isFeatured = value.isFeatured;
  if (typeof value.status === "string" && POST_STATUSES.has(value.status as PostStatus)) {
    data.status = value.status as PostStatus;
  }

  const numericFields = ["categoryId", "seriesId", "seriesOrder"] as const;
  for (const field of numericFields) {
    if (typeof value[field] === "number" && Number.isFinite(value[field])) {
      data[field] = value[field];
    }
  }

  if (Array.isArray(value.tagIds) && value.tagIds.every((id) => typeof id === "number")) {
    data.tagIds = value.tagIds.filter(Number.isFinite);
  }

  return data;
}

function parseDraft(value: unknown): RichTextDraft | null {
  if (!isRecord(value) || value.version !== DRAFT_VERSION || typeof value.savedAt !== "number") {
    return null;
  }

  const content = parseJSONContent(value.content);
  const postData = sanitizePostData(value.postData);

  return content && postData && Number.isFinite(value.savedAt)
    ? { content, postData, savedAt: value.savedAt, version: DRAFT_VERSION }
    : null;
}

export function readRichTextDraft(activeId: string | null): RichTextDraft | null {
  if (!activeId || typeof window === "undefined") return null;

  try {
    const storedDraft = window.localStorage.getItem(getDraftKey(activeId));
    return storedDraft ? parseDraft(JSON.parse(storedDraft)) : null;
  } catch {
    return null;
  }
}

export function saveRichTextDraft(
  activeId: string | null,
  content: JSONContent,
  postData: Partial<PostRequest>
): boolean {
  if (!activeId || typeof window === "undefined") return false;

  const validContent = parseJSONContent(content);
  const validPostData = sanitizePostData(postData);
  if (!validContent || !validPostData) return false;

  try {
    const draft: RichTextDraft = {
      content: validContent,
      postData: validPostData,
      savedAt: Date.now(),
      version: DRAFT_VERSION,
    };
    window.localStorage.setItem(getDraftKey(activeId), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearRichTextDraft(activeId: string | null): void {
  if (!activeId || typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(getDraftKey(activeId));
  } catch {
    // Local storage can be unavailable in private or storage-constrained browsers.
  }
}
