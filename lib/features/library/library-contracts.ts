import { z } from "zod";

import { CategoryResponseSchema } from "@/lib/features/category";
import { PostDigestResponseSchema } from "@/lib/features/post";

export const ReadingProgressRequestSchema = z.object({
  progressPercent: z.number().int().min(0).max(100),
  positionAnchor: z.string().max(500).optional(),
});

export const ReadingHistoryResponseSchema = z.object({
  post: PostDigestResponseSchema,
  progressPercent: z.number().int(),
  positionAnchor: z.string().nullable().optional(),
  lastReadAt: z.string(),
  completedAt: z.string().nullable().optional(),
});

export const PostCollectionRequestSchema = z.object({
  name: z.string().max(80),
  description: z.string().max(300).optional(),
});

export const PostCollectionResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().default(""),
  itemCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const FavoritePostResponseSchema = z.object({
  post: PostDigestResponseSchema,
  favoritedAt: z.string(),
});

export const CollectionPostResponseSchema = z.object({
  post: PostDigestResponseSchema,
  addedAt: z.string(),
});

export const RecommendedPostResponseSchema = z.object({
  post: PostDigestResponseSchema,
  reasonCode: z.string(),
  reason: z.string(),
});

export const ContentPreferenceResponseSchema = z.object({
  followedCategories: z.array(CategoryResponseSchema).default([]),
  hiddenPostCount: z.number(),
});

export const PersonalLibraryOverviewResponseSchema = z.object({
  continueReading: z.array(ReadingHistoryResponseSchema).default([]),
  recentFavorites: z.array(FavoritePostResponseSchema).default([]),
  recommendations: z.array(RecommendedPostResponseSchema).default([]),
});

export type ReadingProgressRequest = z.infer<typeof ReadingProgressRequestSchema>;
export type ReadingHistoryResponse = z.infer<typeof ReadingHistoryResponseSchema>;
export type PostCollectionRequest = z.infer<typeof PostCollectionRequestSchema>;
export type PostCollectionResponse = z.infer<typeof PostCollectionResponseSchema>;
export type FavoritePostResponse = z.infer<typeof FavoritePostResponseSchema>;
export type CollectionPostResponse = z.infer<typeof CollectionPostResponseSchema>;
export type ContentPreferenceResponse = z.infer<typeof ContentPreferenceResponseSchema>;
export type PersonalLibraryOverviewResponse = z.infer<typeof PersonalLibraryOverviewResponseSchema>;
