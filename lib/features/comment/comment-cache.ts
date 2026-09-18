import type { CommentResponse } from "./comment-contracts";

export type CommentLikePatch = {
  likedByCurrentUser: boolean;
  likesCount: number;
};

/** Mutate a comment (and nested children) in place; returns whether a node matched. */
export function applyLikeToCommentTree(
  comment: CommentResponse,
  commentId: number,
  liked: boolean
): boolean {
  if (comment.id === commentId) {
    const already = Boolean(comment.likedByCurrentUser);
    if (already === liked) {
      comment.likedByCurrentUser = liked;
      return true;
    }
    comment.likedByCurrentUser = liked;
    comment.likesCount = Math.max(0, (comment.likesCount ?? 0) + (liked ? 1 : -1));
    return true;
  }

  for (const child of comment.children ?? []) {
    if (applyLikeToCommentTree(child, commentId, liked)) return true;
  }
  return false;
}

export function applyLikeToCommentList(
  list: CommentResponse[] | undefined,
  commentId: number,
  liked: boolean
): boolean {
  if (!list) return false;
  let found = false;
  for (const comment of list) {
    if (applyLikeToCommentTree(comment, commentId, liked)) found = true;
  }
  return found;
}

export function nextLikePatch(
  currentLiked: boolean,
  currentCount: number,
  liked: boolean
): CommentLikePatch {
  if (currentLiked === liked) {
    return { likedByCurrentUser: liked, likesCount: Math.max(0, currentCount) };
  }
  return {
    likedByCurrentUser: liked,
    likesCount: Math.max(0, currentCount + (liked ? 1 : -1)),
  };
}

/** Invalidate post aggregates after comment publish/delete. */
export function relatedContentCountTags(postId: number) {
  return [{ type: "Post" as const, id: postId }];
}

/** Invalidate moment aggregates after moment-comment publish/delete. */
export function relatedMomentCountTags(momentId: number) {
  return [
    { type: "Moment" as const, id: momentId },
    { type: "Moment" as const, id: "LIST" },
  ];
}

export function applyInteractionOverrides<T extends CommentResponse>(
  comment: T,
  overrides: Record<number, CommentLikePatch>
): T {
  const patch = overrides[comment.id];
  const children = (comment.children ?? []).map((child) =>
    applyInteractionOverrides(child, overrides)
  );

  if (!patch) {
    return { ...comment, children };
  }

  return {
    ...comment,
    ...patch,
    children,
  };
}
