import { z } from "zod";

export const MomentImageResponseSchema = z.object({
  id: z.number(),
  fileId: z.number(),
  originalName: z.string(),
  fileUrl: z.string(),
  thumbnailUrl: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  altText: z.string(),
  sortOrder: z.number(),
});

export const MomentTopicResponseSchema = z.object({
  id: z.number(),
  slug: z.string(),
});

export const MomentXSyncResponseSchema = z
  .object({
    status: z.enum(["PENDING", "POSTED", "FAILED", "SKIPPED"]),
    xPostId: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    error: z.string().nullable().optional(),
    attempts: z.number().nullable().optional(),
    postedAt: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

export const MomentResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  stockSymbol: z.string().nullable().optional(),
  likesCount: z.number(),
  commentsCount: z.number().nullable().optional().default(0),
  visibility: z.enum(["public", "followers", "private"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  images: z.array(MomentImageResponseSchema).default([]),
  topics: z.array(MomentTopicResponseSchema).default([]),
  authorName: z.string().nullable().optional(),
  authorAvatar: z.string().nullable().optional(),
  xSync: MomentXSyncResponseSchema,
});

export type MomentImageResponse = z.infer<typeof MomentImageResponseSchema>;
export type MomentTopicResponse = z.infer<typeof MomentTopicResponseSchema>;
export type MomentXSyncResponse = NonNullable<z.infer<typeof MomentXSyncResponseSchema>>;
export type MomentResponse = z.infer<typeof MomentResponseSchema>;

export interface MomentImageRequest {
  fileId: number;
  altText: string;
}

export interface MomentRequest {
  content: string;
  visibility: "public" | "followers" | "private";
  images: MomentImageRequest[];
  topicSlugs: string[];
  stockSymbol?: string | null;
  /** Create-only: queue a post to the site-owner X account when public. */
  shareToX?: boolean;
}
