import { z } from "zod";

import { pageResultSchema } from "@/lib/api";

const baseCommentFields = {
  id: z.number(),
  parentId: z.number().nullable().optional(),
  content: z.string(),
  username: z.string().nullable().default("Anonymous"),
  nickname: z.string().nullable().optional(),
  avatar: z.string().nullable().default(""),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SPAM"]).optional(),
  postId: z.number().nullable().optional(),
  postTitle: z.string().nullable().optional(),
  createdAt: z.string(),
  editedAt: z.string().nullable().optional(),
  likesCount: z.number().nullable().default(0),
  reportsCount: z.number().nullable().default(0),
  replyCount: z.number().nullable().default(0),
  likedByCurrentUser: z.boolean().nullable().default(false),
  pinned: z.boolean().nullable().default(false),
  featured: z.boolean().nullable().default(false),
  deletedPlaceholder: z.boolean().nullable().default(false),
};

const baseCommentSchema = z.object(baseCommentFields);

export type CommentResponse = z.infer<typeof baseCommentSchema> & {
  children?: CommentResponse[];
};

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

export interface GuestbookRequest {
  content: string;
  parentId?: number;
}
