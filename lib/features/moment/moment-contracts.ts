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

export const MomentTopicCountSchema = z.object({
  slug: z.string(),
  count: z.number(),
});

export type MomentTopicCount = z.infer<typeof MomentTopicCountSchema>;

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
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
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

const boundedActive = (limit: number) =>
  z
    .array(z.number().int().nonnegative())
    .refine(
      (active) =>
        new Set(active).size === active.length && active.every((bucket) => bucket < limit),
      {
        message: "Cadence bucket is duplicated or outside its period",
      }
    );

export const MomentCadenceResponseSchema = z
  .object({
    zone: z.string().min(1),
    day: z.object({
      start: z.string().min(1),
      active: boundedActive(24),
    }),
    month: z.object({
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      days: z.number().int().min(28).max(31),
      offset: z.number().int().min(0).max(6),
      active: z.array(z.number().int().nonnegative()),
    }),
    year: z.object({
      year: z.number().int().min(1),
      active: boundedActive(48),
    }),
  })
  .refine(
    (cadence) =>
      new Set(cadence.month.active).size === cadence.month.active.length &&
      cadence.month.active.every((bucket) => bucket < cadence.month.days),
    { path: ["month", "active"], message: "Cadence bucket is duplicated or outside its period" }
  );

export type MomentCadenceResponse = z.infer<typeof MomentCadenceResponseSchema>;

export interface MomentRequest {
  content: string;
  visibility: "public" | "followers" | "private";
  images: MomentImageRequest[];
  topicSlugs: string[];
  stockSymbol?: string | null;
  /** Create-only: queue a post to the site-owner X account when public. */
  shareToX?: boolean;
}
