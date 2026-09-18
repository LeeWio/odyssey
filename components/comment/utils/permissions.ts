import type { CommentResponse } from "@/lib/features/comment";

export type CommentCapabilityInput = Pick<
  CommentResponse,
  | "authorUserId"
  | "username"
  | "nickname"
  | "viewerCanEdit"
  | "viewerCanDelete"
  | "deletedPlaceholder"
>;

export function resolveCommentCapabilities(
  comment: CommentCapabilityInput,
  options: {
    isAuthenticated: boolean;
    currentUserId: number | null;
    currentUsername: string | null;
  }
) {
  if (comment.deletedPlaceholder) {
    return { canEdit: false, canDelete: false };
  }

  const isAuthorById =
    options.currentUserId != null &&
    comment.authorUserId != null &&
    options.currentUserId === comment.authorUserId;

  const normalizedUser = options.currentUsername?.toLowerCase() ?? null;
  const isAuthorByName =
    Boolean(options.isAuthenticated && normalizedUser) &&
    (normalizedUser === (comment.username ?? "").toLowerCase() ||
      normalizedUser === comment.nickname?.toLowerCase());

  const isAuthor = comment.authorUserId != null ? isAuthorById : isAuthorByName;

  return {
    canEdit: comment.viewerCanEdit ?? isAuthor,
    canDelete: comment.viewerCanDelete ?? isAuthor,
  };
}
