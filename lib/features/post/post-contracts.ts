import { z } from "zod";
import type { Pageable } from "@/lib/api";
import { CategoryResponseSchema } from "@/lib/features/category";
import { TagResponseSchema } from "@/lib/features/tag";

/**
 * --- Zod Schemas for Runtime Validation ---
 */

// Post Status Enum
export const PostStatusSchema = z.enum([
  "DRAFT",
  "PENDING_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]);
export type PostStatus = z.infer<typeof PostStatusSchema>;

const PostContentTypeSchema = z.enum(["JSON", "MDX"]);
export type PostContentType = z.infer<typeof PostContentTypeSchema>;

// Series Schema
export const SeriesResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().default(""),
  coverImage: z.string().nullable().default(""),
  isPublished: z.boolean(),
  postsCount: z.number(),
  createdAt: z.string(),
});

export const PostNavigationNeighborSchema = z.object({
  title: z.string(),
  slug: z.string(),
});

export const PostNavigationSchema = z.object({
  prev: PostNavigationNeighborSchema.nullable().default(null),
  next: PostNavigationNeighborSchema.nullable().default(null),
});

// Detailed Post Response
export const PostResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  coverImage: z.string().nullable().default(""),
  summary: z.string().nullable().default(""),
  content: z.string().nullable().default(""),
  contentType: PostContentTypeSchema.nullish().transform((value) => value ?? "JSON"),
  status: PostStatusSchema,
  isFeatured: z.boolean(),
  views: z.number(),
  likesCount: z.number(),
  favoritesCount: z.number(),
  isLiked: z.boolean().nullable().default(false),
  isFavorited: z.boolean().nullable().default(false),
  authorName: z.string().nullable().default("Anonymous"),
  authorAvatar: z.string().nullable().default(""),
  category: CategoryResponseSchema.nullable(),
  series: SeriesResponseSchema.nullable(),
  seriesOrder: z.number().nullable(),
  tags: z.array(TagResponseSchema).nullable().default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  navigation: PostNavigationSchema.nullable().optional().default(null),
});

// Compact Post Digest Response
export const PostDigestResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  coverImage: z.string().nullable().default(""),
  summary: z.string().nullable().default(""),
  authorName: z.string().nullable().default("Anonymous"),
  authorAvatar: z.string().nullable().default(""),
  category: CategoryResponseSchema.nullable(),
  views: z.number(),
  likesCount: z.number(),
  commentsCount: z
    .number()
    .nullish()
    .transform((value) => value ?? 0),
  publishedAt: z.string().nullable().optional(),
});

export type PostDigestResponse = z.infer<typeof PostDigestResponseSchema>;

export const PostInteractionResponseSchema = z.object({
  postId: z.number(),
  liked: z.boolean(),
  favorited: z.boolean(),
  likesCount: z.number(),
  favoritesCount: z.number(),
});

export type PostInteractionResponse = z.infer<typeof PostInteractionResponseSchema>;

// Post Search Document (Elasticsearch)
export const PostDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  content: z.string().nullable(),
  authorName: z.string().nullable(),
  categoryName: z.string().nullable(),
  tags: z.array(z.string()).nullable().default([]),
  publishedAt: z.string().nullable(),
  views: z.number(),
});

export const UnifiedSearchItemSchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  url: z.string(),
  icon: z.string().nullable().optional(),
  iconColor: z.string().nullable().optional(),
  shortcut: z.array(z.string()).nullable().optional().default([]),
});

export const UnifiedSearchGroupSchema = z.object({
  type: z.string(),
  label: z.string(),
  priority: z.number().nullable().optional(),
  items: z.array(UnifiedSearchItemSchema).nullable().optional().default([]),
});

export const UnifiedSearchResponseSchema = z.object({
  groups: z.array(UnifiedSearchGroupSchema).nullable().optional().default([]),
});

// Post Revision
export const PostRevisionSchema = z.object({
  id: z.number(),
  postId: z.number(),
  title: z.string(),
  summary: z.string().nullable(),
  content: z.string(),
  versionNumber: z.number(),
  createdBy: z.string(),
  createdAt: z.string(),
});

/**
 * --- TypeScript Interfaces ---
 */
export type PostResponse = z.infer<typeof PostResponseSchema>;
export type PostDocument = z.infer<typeof PostDocumentSchema>;
export type PostRevision = z.infer<typeof PostRevisionSchema>;
export type UnifiedSearchItem = z.infer<typeof UnifiedSearchItemSchema>;
export type UnifiedSearchGroup = z.infer<typeof UnifiedSearchGroupSchema>;
export type UnifiedSearchResponse = z.infer<typeof UnifiedSearchResponseSchema>;

export interface PostRequest {
  title: string;
  slug: string;
  coverImage?: string;
  summary?: string;
  content: string;
  contentType: "JSON";
  status: PostStatus;
  isFeatured?: boolean;
  categoryId?: number;
  seriesId?: number;
  seriesOrder?: number;
  tagIds?: number[];
}

export interface PostSearchQuery extends Pageable {
  categoryId?: number;
  tagId?: number;
  keyword?: string;
}

export interface PostAutosaveRequest {
  /** Post ID (for existing) or client-generated UUID (for new) */
  identifier: string;
  content: Record<string, unknown>;
}

export interface PostAutosaveResponse {
  identifier: string;
  content: Record<string, unknown>;
}
