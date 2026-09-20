import type { CommentResponse } from "@/lib/features/comment";

/** Reconcile a confirmed deletion in locally accumulated pages or pending rows. */
export function reconcileCommentDeletion<T extends CommentResponse>(
  comments: T[],
  id: number
): T[] {
  const flattened: CommentResponse[] = [];
  const collect = (items: CommentResponse[]) => {
    for (const item of items) {
      flattened.push(item);
      collect(item.children ?? []);
    }
  };
  collect(comments);
  const target = flattened.find((comment) => comment.id === id);
  if (!target) return comments;

  // Replies may be nested, flattened by the cursor API, or not yet loaded.
  const keepPlaceholder = Boolean(
    target.deletedPlaceholder ||
    (target.replyCount ?? 0) > 0 ||
    target.children?.length ||
    flattened.some((comment) => comment.parentId === id)
  );

  const reconcile = <C extends CommentResponse>(items: C[]): C[] => {
    let changed = false;
    const next: C[] = [];
    for (const item of items) {
      if (item.id === id) {
        changed = true;
        if (keepPlaceholder) {
          next.push({
            ...item,
            content: "[deleted]",
            deletedPlaceholder: true,
            pinned: false,
            featured: false,
            status: "APPROVED",
            viewerCanEdit: false,
            viewerCanDelete: false,
          });
        }
        continue;
      }
      const children = item.children ? reconcile(item.children) : item.children;
      const lostDirectReply =
        !keepPlaceholder &&
        (item.id === target.parentId || item.children?.some((child) => child.id === id));
      if (children !== item.children || lostDirectReply) {
        changed = true;
        next.push({
          ...item,
          children,
          replyCount: lostDirectReply ? Math.max(0, (item.replyCount ?? 0) - 1) : item.replyCount,
        });
      } else {
        next.push(item);
      }
    }
    return changed ? next : items;
  };
  return reconcile(comments);
}
