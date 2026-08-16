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

export const MomentResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  likesCount: z.number(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  images: z.array(MomentImageResponseSchema).default([]),
});

export type MomentImageResponse = z.infer<typeof MomentImageResponseSchema>;
export type MomentResponse = z.infer<typeof MomentResponseSchema>;

export interface MomentImageRequest {
  fileId: number;
  altText: string;
}

export interface MomentRequest {
  content: string;
  isPublished: boolean;
  images: MomentImageRequest[];
}
