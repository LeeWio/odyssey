import { z } from "zod";

export const ColumnPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  coverImage: z.string().nullable().default(""),
  summary: z.string().nullable().default(""),
  authorName: z.string().nullable().default("Anonymous"),
  views: z.number(),
  likesCount: z.number(),
  publishedAt: z.string().nullable().optional(),
});

export const ColumnResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().default(""),
  coverImage: z.string().nullable().default(""),
  isPublished: z.boolean(),
  postsCount: z.number(),
  posts: z
    .array(ColumnPostSchema)
    .nullable()
    .optional()
    .transform((posts) => posts ?? []),
  createdAt: z.string(),
});

export type ColumnPost = z.infer<typeof ColumnPostSchema>;
export type ColumnResponse = z.infer<typeof ColumnResponseSchema>;

export interface ColumnRequest {
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  isPublished: boolean;
}
