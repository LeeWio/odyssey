import type { CommentResponse } from "@/lib/features/comment";

/** Apply a confirmed edit to locally retained comments without replacing metadata. */
export function reconcileCommentEdit<T extends CommentResponse>(
  comments: T[],
  id: number,
  content: string,
  editedAt: string
): T[] {
  let changed = false;
  const next = comments.map((comment) => {
    const children = comment.children
      ? reconcileCommentEdit(comment.children, id, content, editedAt)
      : comment.children;
    // A delete that settled while the edit was in flight must take precedence.
    const edited = comment.id === id && !comment.deletedPlaceholder;
    if (!edited && children === comment.children) return comment;
    changed = true;
    return {
      ...comment,
      ...(edited ? { content, editedAt } : {}),
      ...(children !== comment.children ? { children } : {}),
    };
  });
  return changed ? next : comments;
}
