import type { CommentResponse } from "@/lib/features/comment";
import type { EnhancedComment } from "../types";

export type CommentSortOrder = "newest" | "oldest" | "likes";

export type FlattenedReplyRow = {
  comment: EnhancedComment;
  replyTo: string;
  replyToId: number;
};

export function getCommentDisplayName(
  comment: Pick<CommentResponse, "nickname" | "username">
): string {
  return comment.nickname || comment.username || "Anonymous";
}

/** Normalize API nodes into EnhancedComment trees; merge lazy-loaded reply pages by root id. */
export function normalizeCommentTree(
  node: CommentResponse,
  options: {
    postId: number;
    replyPages?: Record<number, { comments: CommentResponse[] }>;
  }
): EnhancedComment {
  const { postId, replyPages = {} } = options;
  const fromChildren = (node.children ?? [])
    .map((child) => normalizeCommentTree(child, options))
    .filter(Boolean);

  const fromLazy = (replyPages[node.id]?.comments ?? [])
    .map((child) => normalizeCommentTree(child, options))
    .filter((child) => !fromChildren.some((existing) => existing.id === child.id));

  const children = [...fromChildren, ...fromLazy].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return {
    id: node.id,
    parentId: node.parentId ?? null,
    content: node.content,
    authorUserId: node.authorUserId ?? null,
    username: node.username || "Anonymous",
    nickname: node.nickname || node.username || "Anonymous",
    avatar: node.avatar || "",
    status: node.status ?? "APPROVED",
    postId: node.postId || postId,
    postTitle: node.postTitle || "",
    momentId: node.momentId ?? null,
    createdAt: node.createdAt,
    editedAt: node.editedAt ?? null,
    likesCount: node.likesCount || 0,
    reportsCount: node.reportsCount || 0,
    replyCount: node.replyCount || 0,
    likedByCurrentUser: node.likedByCurrentUser || false,
    viewerCanEdit: node.viewerCanEdit ?? undefined,
    viewerCanDelete: node.viewerCanDelete ?? undefined,
    pinned: node.pinned || false,
    featured: node.featured || false,
    deletedPlaceholder: node.deletedPlaceholder || false,
    children,
  };
}

export function sortCommentRoots(
  roots: EnhancedComment[],
  sortOrder: CommentSortOrder
): EnhancedComment[] {
  return [...roots].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortOrder === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    // Array.sort(a, b): negative keeps a before b. Prefer pinned/featured first.
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
    return (b.likesCount || 0) - (a.likesCount || 0);
  });
}

function commentFingerprint(
  comment: Pick<EnhancedComment, "content" | "username" | "parentId">
): string {
  return `${comment.parentId ?? "root"}::${(comment.username ?? "").toLowerCase()}::${comment.content}`;
}

function shouldKeepPendingComment(
  comment: EnhancedComment,
  serverIds: Set<number>,
  serverFingerprints: Set<string>
): boolean {
  if (comment.isFailed) return true;
  if (serverIds.has(comment.id)) return false;
  // Submitted locally (temp or real id) but the canonical row already arrived.
  if (!comment.isPending && serverFingerprints.has(commentFingerprint(comment))) {
    return false;
  }
  return true;
}

function injectPendingReplies(
  nodes: EnhancedComment[],
  inlineReplies: EnhancedComment[]
): EnhancedComment[] {
  return nodes.map((node) => {
    const existingIds = new Set(node.children.map((child) => child.id));
    const existingFingerprints = new Set(node.children.map((child) => commentFingerprint(child)));
    const repliesForThisNode = inlineReplies.filter((reply) => reply.parentId === node.id);
    const uniqueReplies = repliesForThisNode.filter((reply) =>
      shouldKeepPendingComment(reply, existingIds, existingFingerprints)
    );

    return {
      ...node,
      children: injectPendingReplies([...node.children, ...uniqueReplies], inlineReplies),
    };
  });
}

/** Merge optimistic pending roots/replies into normalized server roots, then sort. */
export function mergePendingIntoRoots(
  processedRoots: EnhancedComment[],
  pendingComments: EnhancedComment[],
  sortOrder: CommentSortOrder
): EnhancedComment[] {
  const rootPending = pendingComments.filter((comment) => comment.parentId === null);
  const rawIds = new Set(processedRoots.map((comment) => comment.id));
  const serverFingerprints = new Set(processedRoots.map((comment) => commentFingerprint(comment)));
  const filteredPending = rootPending.filter((comment) =>
    shouldKeepPendingComment(comment, rawIds, serverFingerprints)
  );

  const allRoots = [...filteredPending, ...processedRoots];
  const inlineReplies = pendingComments.filter((comment) => comment.parentId !== null);
  const rootsWithPendingReplies =
    inlineReplies.length > 0 ? injectPendingReplies(allRoots, inlineReplies) : allRoots;

  return sortCommentRoots(rootsWithPendingReplies, sortOrder);
}

/** Flatten a root’s subtree into two-level reply rows for presentation. */
export function flattenReplies(root: EnhancedComment): FlattenedReplyRow[] {
  const rows: FlattenedReplyRow[] = [];
  const visit = (parent: EnhancedComment, children: EnhancedComment[]) => {
    for (const child of children) {
      rows.push({
        comment: child,
        replyTo: getCommentDisplayName(parent),
        replyToId: parent.id,
      });
      visit(child, child.children ?? []);
    }
  };
  visit(root, root.children ?? []);
  return rows;
}

export function findRootIndexForComment(
  roots: EnhancedComment[],
  commentId: number | null | undefined
): number {
  if (commentId == null) return -1;

  const contains = (node: EnhancedComment): boolean =>
    node.id === commentId || node.children.some(contains);

  return roots.findIndex((comment) => contains(comment));
}

/** Nexus `PageResult.page` is 1-based. */
export function pageResultHasMore(page: number, totalPages: number): boolean {
  return page < totalPages;
}

export function nextCursorFromCommentIds(list: Array<{ id: number }>): number | null {
  if (list.length === 0) return null;
  return list.reduce((maxId, comment) => (comment.id > maxId ? comment.id : maxId), list[0]!.id);
}
