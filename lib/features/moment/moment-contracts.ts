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

export const MomentResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  likesCount: z.number(),
  visibility: z.enum(["public", "followers", "private"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  images: z.array(MomentImageResponseSchema).default([]),
  topics: z.array(MomentTopicResponseSchema).default([]),
});

export type MomentImageResponse = z.infer<typeof MomentImageResponseSchema>;
export type MomentTopicResponse = z.infer<typeof MomentTopicResponseSchema>;
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
}
