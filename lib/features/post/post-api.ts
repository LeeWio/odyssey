import { z } from "zod";
import type { ApiResponse, Pageable, PageResult } from "@/lib/api";
import { apiResponseSchema, baseApi, pageResultSchema, transformApiError } from "@/lib/api";
import { notifyMutation } from "@/lib/toast";
import {
  PostResponseSchema,
  PostResponse,
  PostDigestResponseSchema,
  PostDigestResponse,
  PostInteractionResponseSchema,
  PostInteractionResponse,
  PostDocumentSchema,
  PostDocument,
  UnifiedSearchResponseSchema,
  UnifiedSearchResponse,
  PostRevisionSchema,
  PostRevision,
  PostRequest,
  PostSearchQuery,
  PostEditorDraftSchema,
  type PostEditorDraft,
} from "./post-contracts";

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Admin: Search all posts
     */
    searchAdminPosts: builder.query<PageResult<PostResponse>, Pageable>({
      query: ({ page = 0, size = 10, sort }) => ({
        url: "/api/v1/admin/posts",
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(PostResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<PostResponse>>) => response.data,
      transformErrorResponse: transformApiError,
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
      rawResponseSchema: apiResponseSchema(PostResponseSchema),
      transformResponse: (response: ApiResponse<PostResponse>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, id) => [{ type: "Post", id }],
    }),

    /**
     * Admin: Create post
     */
    createPost: builder.mutation<PostResponse, { body: PostRequest; draftRevision: string }>({
      query: ({ body, draftRevision }) => ({
        url: "/api/v1/admin/posts",
        method: "POST",
        body,
        headers: { "X-Editor-Draft-Revision": draftRevision },
      }),
      rawResponseSchema: apiResponseSchema(PostResponseSchema),
      transformResponse: (response: ApiResponse<PostResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to create post.",
          success: "Post created successfully.",
        });
      },
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),

    /**
     * Admin: Update post
     */
    updatePost: builder.mutation<
      PostResponse,
      { id: number; body: PostRequest; draftRevision?: string }
    >({
      query: ({ id, body, draftRevision }) => ({
        url: `/api/v1/admin/posts/${id}`,
        method: "PUT",
        body,
        headers: draftRevision ? { "X-Editor-Draft-Revision": draftRevision } : undefined,
      }),
      rawResponseSchema: apiResponseSchema(PostResponseSchema),
      transformResponse: (response: ApiResponse<PostResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to update post.",
          success: "Post updated successfully.",
        });
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
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to delete post.",
          success: "Post deleted successfully.",
        });
      },
      invalidatesTags: (_result, _error, id) => [
        { type: "Post", id },
        { type: "Post", id: "LIST" },
      ],
    }),

    /**
     * Public: Get published posts with filtering
     */
    getPublicPostDigests: builder.query<PageResult<PostDigestResponse>, PostSearchQuery>({
      query: ({ page = 0, size = 10, categoryId, tagId, keyword, authorName }) => ({
        url: "/api/v1/public/blog/posts/digest",
        params: { page, size, categoryId, tagId, keyword, authorName },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(PostDigestResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<PostDigestResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "Post" as const, id })),
              { type: "Post", id: "DIGEST" },
            ]
          : [{ type: "Post", id: "DIGEST" }],
    }),

    getPublicPosts: builder.query<PageResult<PostResponse>, PostSearchQuery>({
      query: ({ page = 0, size = 10, categoryId, tagId, keyword, authorName }) => ({
        url: "/api/v1/public/blog/posts",
        params: { page, size, categoryId, tagId, keyword, authorName },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(PostResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<PostResponse>>) => response.data,
      transformErrorResponse: transformApiError,
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
      query: (slug) => `/api/v1/public/blog/posts/${encodeURIComponent(slug)}`,
      rawResponseSchema: apiResponseSchema(PostResponseSchema),
      transformResponse: (response: ApiResponse<PostResponse>) => response.data,
      transformErrorResponse: transformApiError,
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
      rawResponseSchema: apiResponseSchema(pageResultSchema(PostDocumentSchema)),
      transformResponse: (response: ApiResponse<PageResult<PostDocument>>) => response.data,
      transformErrorResponse: transformApiError,
    }),

    /**
     * Public: Unified search for command palette
     */
    unifiedSearch: builder.query<UnifiedSearchResponse, { keyword?: string }>({
      query: (params) => ({
        url: "/api/v1/public/search/unified",
        params: params.keyword ? { keyword: params.keyword } : undefined,
      }),
      rawResponseSchema: apiResponseSchema(UnifiedSearchResponseSchema),
      transformResponse: (response: ApiResponse<UnifiedSearchResponse>) => response.data,
      transformErrorResponse: transformApiError,
    }),

    /**
     * Public: Get featured posts
     */
    getFeaturedPosts: builder.query<PageResult<PostDigestResponse>, Pageable>({
      query: ({ page = 0, size = 10 } = {}) => ({
        url: "/api/v1/public/blog/posts/featured",
        params: { page, size },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(PostDigestResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<PostDigestResponse>>) => response.data,
      transformErrorResponse: transformApiError,
    }),

    /**
     * Public: Get related posts
     */
    getRelatedPosts: builder.query<PostDigestResponse[], { slug: string; size?: number } | string>({
      query: (arg) => {
        const slug = typeof arg === "string" ? arg : arg.slug;
        const size = typeof arg === "string" ? undefined : arg.size;
        return {
          url: `/api/v1/public/blog/posts/${encodeURIComponent(slug)}/related`,
          ...(size ? { params: { size } } : {}),
        };
      },
      rawResponseSchema: apiResponseSchema(z.array(PostDigestResponseSchema)),
      transformResponse: (response: ApiResponse<PostDigestResponse[]>) => response.data,
      transformErrorResponse: transformApiError,
    }),

    /**
     * User: Like post
     */
    likePost: builder.mutation<PostInteractionResponse, number>({
      query: (postId) => ({
        url: `/api/v1/public/interactions/posts/${postId}/like`,
        method: "POST",
      }),
      rawResponseSchema: apiResponseSchema(PostInteractionResponseSchema),
      transformResponse: (response: ApiResponse<PostInteractionResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(postId, { dispatch, getState, queryFulfilled }) {
        const state = getState() as Record<string, unknown>;
        const apiState = state.api as
          | Record<string, Record<string, { data?: { id?: number }; originalArgs?: unknown }>>
          | undefined;
        const queries = apiState?.queries;
        const patches = [];
        if (queries) {
          for (const [queryKey, entry] of Object.entries(queries)) {
            if (queryKey.startsWith("getPublicPostBySlug(") && entry.data?.id === postId) {
              const slug = entry.originalArgs as string;
              if (slug) {
                const patch = dispatch(
                  postApi.util.updateQueryData("getPublicPostBySlug", slug, (draft) => {
                    draft.isLiked = true;
                    draft.likesCount = (draft.likesCount ?? 0) + 1;
                  })
                );
                patches.push(patch);
              }
            }
            if (queryKey.startsWith("getAdminPostById(") && entry.data?.id === postId) {
              const id = entry.originalArgs as number;
              if (id) {
                const patch = dispatch(
                  postApi.util.updateQueryData("getAdminPostById", id, (draft) => {
                    draft.isLiked = true;
                    draft.likesCount = (draft.likesCount ?? 0) + 1;
                  })
                );
                patches.push(patch);
              }
            }
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (_result, _error, id) => [{ type: "Post", id }],
    }),

    /**
     * User: Unlike post
     */
    unlikePost: builder.mutation<PostInteractionResponse, number>({
      query: (postId) => ({
        url: `/api/v1/public/interactions/posts/${postId}/unlike`,
        method: "POST",
      }),
      rawResponseSchema: apiResponseSchema(PostInteractionResponseSchema),
      transformResponse: (response: ApiResponse<PostInteractionResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(postId, { dispatch, getState, queryFulfilled }) {
        const state = getState() as Record<string, unknown>;
        const apiState = state.api as
          | Record<string, Record<string, { data?: { id?: number }; originalArgs?: unknown }>>
          | undefined;
        const queries = apiState?.queries;
        const patches = [];
        if (queries) {
          for (const [queryKey, entry] of Object.entries(queries)) {
            if (queryKey.startsWith("getPublicPostBySlug(") && entry.data?.id === postId) {
              const slug = entry.originalArgs as string;
              if (slug) {
                const patch = dispatch(
                  postApi.util.updateQueryData("getPublicPostBySlug", slug, (draft) => {
                    draft.isLiked = false;
                    draft.likesCount = Math.max(0, (draft.likesCount ?? 0) - 1);
                  })
                );
                patches.push(patch);
              }
            }
            if (queryKey.startsWith("getAdminPostById(") && entry.data?.id === postId) {
              const id = entry.originalArgs as number;
              if (id) {
                const patch = dispatch(
                  postApi.util.updateQueryData("getAdminPostById", id, (draft) => {
                    draft.isLiked = false;
                    draft.likesCount = Math.max(0, (draft.likesCount ?? 0) - 1);
                  })
                );
                patches.push(patch);
              }
            }
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
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
      transformErrorResponse: transformApiError,
      async onQueryStarted(postId, { dispatch, getState, queryFulfilled }) {
        const state = getState() as Record<string, unknown>;
        const apiState = state.api as
          | Record<string, Record<string, { data?: { id?: number }; originalArgs?: unknown }>>
          | undefined;
        const queries = apiState?.queries;
        const patches = [];
        if (queries) {
          for (const [queryKey, entry] of Object.entries(queries)) {
            if (queryKey.startsWith("getPublicPostBySlug(") && entry.data?.id === postId) {
              const slug = entry.originalArgs as string;
              if (slug) {
                const patch = dispatch(
                  postApi.util.updateQueryData("getPublicPostBySlug", slug, (draft) => {
                    draft.isFavorited = true;
                    draft.favoritesCount = (draft.favoritesCount ?? 0) + 1;
                  })
                );
                patches.push(patch);
              }
            }
            if (queryKey.startsWith("getAdminPostById(") && entry.data?.id === postId) {
              const id = entry.originalArgs as number;
              if (id) {
                const patch = dispatch(
                  postApi.util.updateQueryData("getAdminPostById", id, (draft) => {
                    draft.isFavorited = true;
                    draft.favoritesCount = (draft.favoritesCount ?? 0) + 1;
                  })
                );
                patches.push(patch);
              }
            }
          }
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (_result, _error, id) => [{ type: "Post", id }],
    }),

    /**
     * Admin: Retrieve revision history for a post
     */
    getPostRevisions: builder.query<PostRevision[], number>({
      query: (id) => `/api/v1/admin/posts/${id}/revisions`,
      rawResponseSchema: apiResponseSchema(z.array(PostRevisionSchema)),
      transformResponse: (response: ApiResponse<PostRevision[]>) => response.data,
      transformErrorResponse: transformApiError,
    }),

    /**
     * Admin: Revert a post to a specific revision
     */
    revertPostRevision: builder.mutation<
      PostResponse,
      { id: number; revisionId: number; expectedRevision: number }
    >({
      query: ({ id, revisionId, expectedRevision }) => ({
        url: `/api/v1/admin/posts/${id}/revisions/${revisionId}/revert`,
        method: "POST",
        headers: { "If-Match": `"revision-${expectedRevision}"` },
      }),
      rawResponseSchema: apiResponseSchema(PostResponseSchema),
      transformResponse: (response: ApiResponse<PostResponse>) => response.data,
      invalidatesTags: (result, _error, { id }) =>
        result
          ? [
              { type: "Post", id },
              { type: "Post", id: "LIST" },
            ]
          : [],
    }),

    getEditorDraft: builder.query<PostEditorDraft | null, string>({
      query: (identifier) => `/api/v1/admin/posts/editor-drafts/${identifier}`,
      rawResponseSchema: apiResponseSchema(PostEditorDraftSchema.nullable()),
      transformResponse: (response: ApiResponse<PostEditorDraft | null>) => response.data,
    }),
    saveEditorDraft: builder.mutation<
      PostEditorDraft,
      {
        identifier: string;
        content: object;
        postData: Partial<PostRequest>;
        revision: string | null;
      }
    >({
      query: ({ identifier, ...body }) => ({
        url: `/api/v1/admin/posts/editor-drafts/${identifier}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: apiResponseSchema(PostEditorDraftSchema),
      transformResponse: (response: ApiResponse<PostEditorDraft>) => response.data,
    }),
    discardEditorDraft: builder.mutation<void, { identifier: string; revision: string | null }>({
      query: ({ identifier, revision }) => ({
        url: `/api/v1/admin/posts/editor-drafts/${identifier}`,
        method: "DELETE",
        params: revision ? { revision } : undefined,
      }),
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useSearchAdminPostsQuery,
  useLazySearchAdminPostsQuery,
  useGetAdminPostByIdQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetPublicPostDigestsQuery,
  useGetPublicPostsQuery,
  useGetPublicPostBySlugQuery,
  useGetFeaturedPostsQuery,
  useGetRelatedPostsQuery,
  useSearchPublicPostsQuery,
  useUnifiedSearchQuery,
  useLikePostMutation,
  useUnlikePostMutation,
  useFavoritePostMutation,
  useGetPostRevisionsQuery,
  useRevertPostRevisionMutation,
  useGetEditorDraftQuery,
  useSaveEditorDraftMutation,
  useDiscardEditorDraftMutation,
} = postApi;
