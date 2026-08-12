import { z } from "zod";

import type { ApiResponse, Pageable, PageResult } from "@/lib/api";
import { apiResponseSchema, baseApi, pageResultSchema, transformApiError } from "@/lib/api";
import { PostDigestResponseSchema, type PostDigestResponse } from "@/lib/features/post";
import { notifyMutation } from "@/lib/toast";
import {
  CollectionPostResponseSchema,
  ContentPreferenceResponseSchema,
  FavoritePostResponseSchema,
  PersonalLibraryOverviewResponseSchema,
  PostCollectionResponseSchema,
  ReadingHistoryResponseSchema,
  type CollectionPostResponse,
  type ContentPreferenceResponse,
  type FavoritePostResponse,
  type PersonalLibraryOverviewResponse,
  type PostCollectionRequest,
  type PostCollectionResponse,
  type ReadingHistoryResponse,
  type ReadingProgressRequest,
} from "./library-contracts";

const overviewTag = { type: "Library" as const, id: "OVERVIEW" };
const emptySchema = apiResponseSchema(z.unknown());

export const libraryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLibraryOverview: builder.query<PersonalLibraryOverviewResponse, void>({
      query: () => "/api/v1/user/library/overview",
      rawResponseSchema: apiResponseSchema(PersonalLibraryOverviewResponseSchema),
      transformResponse: (response: ApiResponse<PersonalLibraryOverviewResponse>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [overviewTag],
    }),
    getContentPreferences: builder.query<ContentPreferenceResponse, void>({
      query: () => "/api/v1/user/library/preferences",
      rawResponseSchema: apiResponseSchema(ContentPreferenceResponseSchema),
      transformResponse: (response: ApiResponse<ContentPreferenceResponse>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Library", id: "PREFERENCES" }],
    }),
    getReadingHistory: builder.query<PageResult<ReadingHistoryResponse>, Pageable>({
      query: ({ page = 0, size = 20, sort }) => ({
        url: "/api/v1/user/library/history",
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(ReadingHistoryResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<ReadingHistoryResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Library", id: "HISTORY" }],
    }),
    getFollowingFeed: builder.query<PageResult<PostDigestResponse>, Pageable>({
      query: ({ page = 0, size = 20, sort }) => ({
        url: "/api/v1/user/library/following",
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(PostDigestResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<PostDigestResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Library", id: "FOLLOWING" }],
    }),
    getFavoritePosts: builder.query<PageResult<FavoritePostResponse>, Pageable>({
      query: ({ page = 0, size = 20, sort }) => ({
        url: "/api/v1/user/library/favorites",
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(FavoritePostResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<FavoritePostResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Library", id: "FAVORITES" }],
    }),
    getPostCollections: builder.query<PostCollectionResponse[], void>({
      query: () => "/api/v1/user/library/collections",
      rawResponseSchema: apiResponseSchema(z.array(PostCollectionResponseSchema)),
      transformResponse: (response: ApiResponse<PostCollectionResponse[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Library" as const, id: `COLLECTION_${id}` })),
              { type: "Library", id: "COLLECTIONS" },
            ]
          : [{ type: "Library", id: "COLLECTIONS" }],
    }),
    getCollectionPosts: builder.query<
      PageResult<CollectionPostResponse>,
      Pageable & { collectionId: number }
    >({
      query: ({ collectionId, page = 0, size = 20, sort }) => ({
        url: `/api/v1/user/library/collections/${collectionId}/posts`,
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CollectionPostResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CollectionPostResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, { collectionId }) => [
        { type: "Library", id: `COLLECTION_${collectionId}` },
      ],
    }),
    recordReadingProgress: builder.mutation<
      ReadingHistoryResponse,
      { postId: number; body: ReadingProgressRequest }
    >({
      query: ({ postId, body }) => ({
        url: `/api/v1/user/library/posts/${postId}/progress`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: apiResponseSchema(ReadingHistoryResponseSchema),
      transformResponse: (response: ApiResponse<ReadingHistoryResponse>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: [overviewTag, { type: "Library", id: "HISTORY" }],
    }),
    createPostCollection: builder.mutation<PostCollectionResponse, PostCollectionRequest>({
      query: (body) => ({ url: "/api/v1/user/library/collections", method: "POST", body }),
      rawResponseSchema: apiResponseSchema(PostCollectionResponseSchema),
      transformResponse: (response: ApiResponse<PostCollectionResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to create collection.",
          success: "Collection created.",
        });
      },
      invalidatesTags: [overviewTag, { type: "Library", id: "COLLECTIONS" }],
    }),
    updatePostCollection: builder.mutation<
      PostCollectionResponse,
      { collectionId: number; body: PostCollectionRequest }
    >({
      query: ({ collectionId, body }) => ({
        url: `/api/v1/user/library/collections/${collectionId}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: apiResponseSchema(PostCollectionResponseSchema),
      transformResponse: (response: ApiResponse<PostCollectionResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to update collection.",
          success: "Collection updated.",
        });
      },
      invalidatesTags: (_result, _error, { collectionId }) => [
        overviewTag,
        { type: "Library", id: "COLLECTIONS" },
        { type: "Library", id: `COLLECTION_${collectionId}` },
      ],
    }),
    deletePostCollection: builder.mutation<void, number>({
      query: (collectionId) => ({
        url: `/api/v1/user/library/collections/${collectionId}`,
        method: "DELETE",
      }),
      rawResponseSchema: emptySchema,
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to delete collection.",
          success: "Collection deleted.",
        });
      },
      invalidatesTags: (_result, _error, collectionId) => [
        overviewTag,
        { type: "Library", id: "COLLECTIONS" },
        { type: "Library", id: `COLLECTION_${collectionId}` },
      ],
    }),
    addPostToCollection: builder.mutation<void, { collectionId: number; postId: number }>({
      query: ({ collectionId, postId }) => ({
        url: `/api/v1/user/library/collections/${collectionId}/posts/${postId}`,
        method: "POST",
      }),
      rawResponseSchema: emptySchema,
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to save post to collection.",
          success: "Saved to collection.",
        });
      },
      invalidatesTags: (_result, _error, { collectionId }) => [
        overviewTag,
        { type: "Library", id: "COLLECTIONS" },
        { type: "Library", id: `COLLECTION_${collectionId}` },
      ],
    }),
    removePostFromCollection: builder.mutation<void, { collectionId: number; postId: number }>({
      query: ({ collectionId, postId }) => ({
        url: `/api/v1/user/library/collections/${collectionId}/posts/${postId}`,
        method: "DELETE",
      }),
      rawResponseSchema: emptySchema,
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to remove post from collection.",
          success: "Removed from collection.",
        });
      },
      invalidatesTags: (_result, _error, { collectionId }) => [
        overviewTag,
        { type: "Library", id: "COLLECTIONS" },
        { type: "Library", id: `COLLECTION_${collectionId}` },
      ],
    }),
    followCategory: builder.mutation<void, number>({
      query: (categoryId) => ({
        url: `/api/v1/user/library/preferences/categories/${categoryId}`,
        method: "PUT",
      }),
      rawResponseSchema: emptySchema,
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to follow category.",
          success: "Category followed.",
        });
      },
      invalidatesTags: [overviewTag, { type: "Library", id: "PREFERENCES" }],
    }),
    unfollowCategory: builder.mutation<void, number>({
      query: (categoryId) => ({
        url: `/api/v1/user/library/preferences/categories/${categoryId}`,
        method: "DELETE",
      }),
      rawResponseSchema: emptySchema,
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to unfollow category.",
          success: "Category unfollowed.",
        });
      },
      invalidatesTags: [overviewTag, { type: "Library", id: "PREFERENCES" }],
    }),
    hideRecommendation: builder.mutation<void, number>({
      query: (postId) => ({
        url: `/api/v1/user/library/preferences/hidden-posts/${postId}`,
        method: "PUT",
      }),
      rawResponseSchema: emptySchema,
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to hide recommendation.",
          success: "Recommendation hidden.",
        });
      },
      invalidatesTags: [overviewTag, { type: "Library", id: "PREFERENCES" }],
    }),
    restoreRecommendation: builder.mutation<void, number>({
      query: (postId) => ({
        url: `/api/v1/user/library/preferences/hidden-posts/${postId}`,
        method: "DELETE",
      }),
      rawResponseSchema: emptySchema,
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to restore recommendation.",
          success: "Recommendation restored.",
        });
      },
      invalidatesTags: [overviewTag, { type: "Library", id: "PREFERENCES" }],
    }),
    clearHiddenRecommendations: builder.mutation<void, void>({
      query: () => ({
        url: "/api/v1/user/library/preferences/hidden-posts",
        method: "DELETE",
      }),
      rawResponseSchema: emptySchema,
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to clear hidden recommendations.",
          success: "Hidden recommendations cleared.",
        });
      },
      invalidatesTags: [overviewTag, { type: "Library", id: "PREFERENCES" }],
    }),
    deleteReadingHistory: builder.mutation<void, number>({
      query: (postId) => ({
        url: `/api/v1/user/library/history/${postId}`,
        method: "DELETE",
      }),
      rawResponseSchema: emptySchema,
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to remove reading history entry.",
          success: "Reading history entry removed.",
        });
      },
      invalidatesTags: [overviewTag, { type: "Library", id: "HISTORY" }],
    }),
    clearReadingHistory: builder.mutation<void, void>({
      query: () => ({ url: "/api/v1/user/library/history", method: "DELETE" }),
      rawResponseSchema: emptySchema,
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to clear reading history.",
          success: "Reading history cleared.",
        });
      },
      invalidatesTags: [overviewTag, { type: "Library", id: "HISTORY" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLibraryOverviewQuery,
  useGetContentPreferencesQuery,
  useGetReadingHistoryQuery,
  useGetFollowingFeedQuery,
  useGetFavoritePostsQuery,
  useGetPostCollectionsQuery,
  useGetCollectionPostsQuery,
  useRecordReadingProgressMutation,
  useCreatePostCollectionMutation,
  useUpdatePostCollectionMutation,
  useDeletePostCollectionMutation,
  useAddPostToCollectionMutation,
  useRemovePostFromCollectionMutation,
  useFollowCategoryMutation,
  useUnfollowCategoryMutation,
  useHideRecommendationMutation,
  useRestoreRecommendationMutation,
  useClearHiddenRecommendationsMutation,
  useDeleteReadingHistoryMutation,
  useClearReadingHistoryMutation,
} = libraryApi;
