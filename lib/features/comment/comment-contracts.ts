import { z } from "zod";

import { pageResultSchema } from "@/lib/api";

const baseCommentFields = {
  id: z.number(),
  parentId: z.number().nullable().optional(),
  content: z.string(),
  authorUserId: z.number().nullable().optional(),
  username: z.string().nullable().default("Anonymous"),
  nickname: z.string().nullable().optional(),
  avatar: z.string().nullable().default(""),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SPAM"]).optional(),
  postId: z.number().nullable().optional(),
  postTitle: z.string().nullable().optional(),
  momentId: z.number().nullable().optional(),
  createdAt: z.string(),
  editedAt: z.string().nullable().optional(),
  likesCount: z.number().nullable().default(0),
  reportsCount: z.number().nullable().default(0),
  replyCount: z.number().nullable().default(0),
  likedByCurrentUser: z.boolean().nullable().default(false),
  viewerCanEdit: z.boolean().nullable().optional(),
  viewerCanDelete: z.boolean().nullable().optional(),
  pinned: z.boolean().nullable().default(false),
  featured: z.boolean().nullable().default(false),
  deletedPlaceholder: z.boolean().nullable().default(false),
};

const baseCommentSchema = z.object(baseCommentFields);

export const CommentStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "SPAM"]);

export const CommentPublishResponseSchema = z.object({
  id: z.number(),
  status: CommentStatusSchema,
});

export type CommentResponse = z.infer<typeof baseCommentSchema> & {
  children?: CommentResponse[];
};

export type CommentPublishResponse = z.infer<typeof CommentPublishResponseSchema>;

export const CommentResponseSchema: z.ZodType<CommentResponse> = baseCommentSchema.extend({
  children: z
    .lazy(() => z.array(CommentResponseSchema))
    .nullable()
    .optional()
    .transform((children) => children ?? []),
});

export const CommentAnchorContextResponseSchema = z.object({
  rootCommentId: z.number(),
  rootComment: CommentResponseSchema,
  targetComment: CommentResponseSchema,
  repliesWindow: pageResultSchema(CommentResponseSchema),
});

export type CommentAnchorContextResponse = z.infer<typeof CommentAnchorContextResponseSchema>;
export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED" | "SPAM";

export interface CommentRequest {
  content: string;
  postId: number;
  parentId?: number;
}

export interface MomentCommentRequest {
  content: string;
  momentId: number;
  parentId?: number;
}

export interface GuestbookRequest {
  content: string;
  parentId?: number;
}

/**
 * Transport-only options for safely retrying a publish request.
 * The key is sent as an HTTP header and must never be serialized into the body.
 */
export interface CommentPublishOptions {
  idempotencyKey?: string;
  /**
   * Lets the comment sheet reconcile its optimistic item before the related
   * query caches are invalidated. This is transport-only and is never sent.
   */
  deferInvalidation?: boolean;
}

export const CommentReportStatusSchema = z.enum(["OPEN", "ACTIONED", "DISMISSED"]);
export type CommentReportStatus = z.infer<typeof CommentReportStatusSchema>;

export const CommentModerationActionSchema = z.enum([
  "SUBMITTED",
  "EDITED",
  "STATUS_CHANGED",
  "AUTO_FLAGGED",
  "DELETED",
]);
export type CommentModerationAction = z.infer<typeof CommentModerationActionSchema>;

export const CommentReportResponseSchema = z.object({
  commentId: z.number().nullable().optional(),
  reporterId: z.number().nullable().optional(),
  reporterUsername: z.string().nullable().optional().default(""),
  reporterNickname: z.string().nullable().optional(),
  reason: z.string().nullable().optional().default(""),
  description: z.string().nullable().optional(),
  status: CommentReportStatusSchema.nullable().optional().default("OPEN"),
  handledBy: z.string().nullable().optional(),
  handledAt: z.string().nullable().optional(),
  resolutionNote: z.string().nullable().optional(),
  postId: z.number().nullable().optional(),
  postTitle: z.string().nullable().optional(),
  parentId: z.number().nullable().optional(),
  commentStatus: CommentStatusSchema.nullable().optional(),
  commentContent: z.string().nullable().optional().default(""),
  createdAt: z.string().nullable().optional().default(""),
});
export type CommentReportResponse = z.infer<typeof CommentReportResponseSchema>;

export const CommentModerationLogResponseSchema = z.object({
  id: z.number().nullable().optional(),
  commentId: z.number().nullable().optional(),
  postId: z.number().nullable().optional(),
  postTitle: z.string().nullable().optional(),
  parentId: z.number().nullable().optional(),
  commentContent: z.string().nullable().optional().default(""),
  action: CommentModerationActionSchema.nullable().optional(),
  previousStatus: CommentStatusSchema.nullable().optional(),
  newStatus: CommentStatusSchema.nullable().optional(),
  moderatorUsername: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  batchId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional().default(""),
});
export type CommentModerationLogResponse = z.infer<typeof CommentModerationLogResponseSchema>;

export const CommentRiskResponseSchema = z.object({
  id: z.number(),
  parentId: z.number().nullable().optional(),
  postId: z.number().nullable().optional(),
  postTitle: z.string().nullable().optional(),
  content: z.string().nullable().optional().default(""),
  username: z.string().nullable().optional().default("Anonymous"),
  nickname: z.string().nullable().optional(),
  avatar: z.string().nullable().optional().default(""),
  status: CommentStatusSchema.nullable().optional(),
  reportsCount: z.number().nullable().optional().default(0),
  openReports: z.number().nullable().optional().default(0),
  likesCount: z.number().nullable().optional().default(0),
  riskScore: z.number().nullable().optional().default(0),
  createdAt: z.string().nullable().optional().default(""),
  editedAt: z.string().nullable().optional(),
});
export type CommentRiskResponse = z.infer<typeof CommentRiskResponseSchema>;

export const CommentGovernanceOverviewResponseSchema = z.object({
  totalComments: z.number().nullable().optional().default(0),
  pendingComments: z.number().nullable().optional().default(0),
  approvedComments: z.number().nullable().optional().default(0),
  rejectedComments: z.number().nullable().optional().default(0),
  spamComments: z.number().nullable().optional().default(0),
  openReports: z.number().nullable().optional().default(0),
  actionedReports: z.number().nullable().optional().default(0),
  dismissedReports: z.number().nullable().optional().default(0),
  reportsLast24Hours: z.number().nullable().optional().default(0),
  autoFlaggedLast24Hours: z.number().nullable().optional().default(0),
  oldestPendingAt: z.string().nullable().optional(),
});
export type CommentGovernanceOverviewResponse = z.infer<
  typeof CommentGovernanceOverviewResponseSchema
>;

export interface AdminCommentListParams {
  status?: CommentStatus;
  postId?: number;
  featuredOnly?: boolean;
  username?: string;
  keyword?: string;
}

export const CommentInteractionResponseSchema = z.object({
  commentId: z.number(),
  liked: z.boolean(),
  likesCount: z.number(),
});
export type CommentInteractionResponse = z.infer<typeof CommentInteractionResponseSchema>;

export interface CommentReportResolutionRequest {
  status: "ACTIONED" | "DISMISSED";
  resolutionNote?: string;
}
