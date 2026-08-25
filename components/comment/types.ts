import type { CommentResponse } from "@/lib/features/comment";

/** Backend comment data plus transient state used while a command is in flight. */
export type EnhancedComment = CommentResponse & {
  children: EnhancedComment[];
  isPending?: boolean;
  isFailed?: boolean;
};
