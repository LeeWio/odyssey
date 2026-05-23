import { ApiResponse, Pageable, PageResult } from "@/types";
import { baseApi, transformError, ApiResponseSchema, PageResultSchema } from "../api/base-api";
import { toast } from "@heroui/react";
import { z } from "zod";
import { CategoryResponseSchema } from "../category/category-api";
import { TagResponseSchema } from "../tag/tag-api";

/**
 * --- Zod Schemas for Runtime Validation ---
 */

// Post Status Enum
export const PostStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export type PostStatus = z.infer<typeof PostStatusSchema>;

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

// Detailed Post Response
export const PostResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  coverImage: z.string().nullable().default(""),
  summary: z.string().nullable().default(""),
  content: z.string().nullable().default(""),
  status: PostStatusSchema,
  isFeatured: z.boolean(),
  views: z.number(),
  likesCount: z.number(),
  favoritesCount: z.number(),
  isLiked: z.boolean().nullable().default(false),
  isFavorited: z.boolean().nullable().default(false),
  authorName: z.string().nullable().default("Anonymous"),
  category: CategoryResponseSchema.nullable(),
  series: SeriesResponseSchema.nullable(),
  seriesOrder: z.number().nullable(),
  tags: z.array(TagResponseSchema).nullable().default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

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
  content: string;
}

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Admin: Search all posts
     */
    searchAdminPosts: builder.query<PageResult<PostResponse>, Pageable>({
      query: ({ page = 0, size = 10, sort }) => ({
        url: "/api/v1/admin/posts",
        params: { page, size, ...(sort && { sort: sort.join(",") }) },
      }),
      rawResponseSchema: ApiResponseSchema(PageResultSchema(PostResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<PostResponse>>) => response.data,
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "Post" as const, id })),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
    }),

    /**
     * Admin: Retrieve post by ID
     */
    getAdminPostById: builder.query<PostResponse, number>({
      query: (id) => `/api/v1/admin/posts/${id}`,
      rawResponseSchema: ApiResponseSchema(PostResponseSchema),
      transformResponse: (response: ApiResponse<PostResponse>) => response.data,
      transformErrorResponse: transformError,
      providesTags: (_result, _error, id) => [{ type: "Post", id }],
    }),

    /**
     * Admin: Create post
     */
    createPost: builder.mutation<PostResponse, PostRequest>({
      query: (body) => ({
        url: "/api/v1/admin/posts",
        method: "POST",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(PostResponseSchema),
      transformResponse: (response: ApiResponse<PostResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Post created successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to create post");
        }
      },
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),

    /**
     * Admin: Update post
     */
    updatePost: builder.mutation<PostResponse, { id: number; body: PostRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/posts/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(PostResponseSchema),
      transformResponse: (response: ApiResponse<PostResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Post updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update post");
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Post", id },
        { type: "Post", id: "LIST" },
      ],
    }),

    /**
     * Admin: Delete post
     */
    deletePost: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/posts/${id}`,
        method: "DELETE",
      }),
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Post deleted successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to delete post");
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: "Post", id },
        { type: "Post", id: "LIST" },
      ],
    }),

    /**
     * Public: Get published posts with filtering
     */
    getPublicPosts: builder.query<PageResult<PostResponse>, PostSearchQuery>({
      query: ({ page = 0, size = 10, categoryId, tagId, keyword }) => ({
        url: "/api/v1/public/blog/posts",
        params: { page, size, categoryId, tagId, keyword },
      }),
      rawResponseSchema: ApiResponseSchema(PageResultSchema(PostResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<PostResponse>>) => response.data,
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "Post" as const, id })),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
    }),

    /**
     * Public: Get post details by slug
     */
    getPublicPostBySlug: builder.query<PostResponse, string>({
      query: (slug) => `/api/v1/public/blog/posts/${slug}`,
      rawResponseSchema: ApiResponseSchema(PostResponseSchema),
      transformResponse: (response: ApiResponse<PostResponse>) => response.data,
      transformErrorResponse: transformError,
      providesTags: (result) => (result ? [{ type: "Post", id: result.id }] : ["Post"]),
    }),

    /**
     * Public: Full-text search (Elasticsearch)
     */
    searchPublicPosts: builder.query<PageResult<PostDocument>, { keyword?: string } & Pageable>({
      query: ({ keyword, page = 0, size = 10 }) => ({
        url: "/api/v1/public/search/posts",
        params: { keyword, page, size },
      }),
      rawResponseSchema: ApiResponseSchema(PageResultSchema(PostDocumentSchema)),
      transformResponse: (response: ApiResponse<PageResult<PostDocument>>) => response.data,
      transformErrorResponse: transformError,
    }),

    /**
     * Public: Unified search for command palette
     */
    unifiedSearch: builder.query<UnifiedSearchResponse, { keyword?: string }>({
      query: (params) => ({
        url: "/api/v1/public/search/unified",
        params: params.keyword ? { keyword: params.keyword } : undefined,
      }),
      rawResponseSchema: ApiResponseSchema(UnifiedSearchResponseSchema),
      transformResponse: (response: ApiResponse<UnifiedSearchResponse>) => response.data,
      transformErrorResponse: transformError,
    }),

    /**
     * User: Like post
     */
    likePost: builder.mutation<void, number>({
      query: (postId) => ({
        url: `/api/v1/public/interactions/posts/${postId}/like`,
        method: "POST",
      }),
      transformErrorResponse: transformError,
      invalidatesTags: (_result, _error, id) => [{ type: "Post", id }],
    }),

    /**
     * User: Favorite post
     */
    favoritePost: builder.mutation<void, number>({
      query: (postId) => ({
        url: `/api/v1/public/interactions/posts/${postId}/favorite`,
        method: "POST",
      }),
      transformErrorResponse: transformError,
      invalidatesTags: (_result, _error, id) => [{ type: "Post", id }],
    }),

    /**
     * Admin: Retrieve revision history for a post
     */
    getPostRevisions: builder.query<PostRevision[], number>({
      query: (id) => `/api/v1/admin/posts/${id}/revisions`,
      rawResponseSchema: ApiResponseSchema(z.array(PostRevisionSchema)),
      transformResponse: (response: ApiResponse<PostRevision[]>) => response.data,
      transformErrorResponse: transformError,
    }),

    /**
     * Admin: Revert a post to a specific revision
     */
    revertPostRevision: builder.mutation<PostResponse, { id: number; revisionId: number }>({
      query: ({ id, revisionId }) => ({
        url: `/api/v1/admin/posts/${id}/revisions/${revisionId}/revert`,
        method: "POST",
      }),
      rawResponseSchema: ApiResponseSchema(PostResponseSchema),
      transformResponse: (response: ApiResponse<PostResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Post reverted to selected revision!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to revert post");
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Post", id },
        { type: "Post", id: "LIST" },
      ],
    }),

    /**
     * Admin: Temporarily save post content (Redis-backed)
     */
    autosavePost: builder.mutation<void, PostAutosaveRequest>({
      query: (body) => ({
        url: "/api/v1/admin/posts/autosave",
        method: "POST",
        body,
      }),
      transformErrorResponse: transformError,
    }),

    /**
     * Admin: Retrieve autosaved content
     */
    getAutosave: builder.query<string, string>({
      query: (identifier) => `/api/v1/admin/posts/autosave/${identifier}`,
      rawResponseSchema: ApiResponseSchema(z.string()),
      transformResponse: (response: ApiResponse<string>) => response.data,
      transformErrorResponse: transformError,
    }),
  }),
  overrideExisting: false,
});

export const {
  useSearchAdminPostsQuery,
  useGetAdminPostByIdQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetPublicPostsQuery,
  useGetPublicPostBySlugQuery,
  useSearchPublicPostsQuery,
  useUnifiedSearchQuery,
  useLikePostMutation,
  useFavoritePostMutation,
  useGetPostRevisionsQuery,
  useRevertPostRevisionMutation,
  useAutosavePostMutation,
  useGetAutosaveQuery,
} = postApi;
