import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse, CursorPageResult, Pageable, PageResult } from "@/lib/api";
import {
  apiResponseSchema,
  baseApi,
  cursorPageResultSchema,
  getApiErrorMessage,
  pageResultSchema,
  transformApiError,
} from "@/lib/api";
import {
  CommentAnchorContextResponseSchema,
  CommentResponseSchema,
  type CommentAnchorContextResponse,
  type CommentPublishOptions,
  type CommentRequest,
  type CommentResponse,
  type CommentStatus,
  type GuestbookRequest,
} from "./comment-contracts";
import { commentDebug } from "@/lib/comment-debug";

type CommentTag = { type: "Comment"; id: string | number };

const commentTag = (id: string | number): CommentTag => ({ type: "Comment", id });

function collectCommentIds(comments: CommentResponse[]): number[] {
  return comments.flatMap((comment) => [
    comment.id,
    ...(comment.children ? collectCommentIds(comment.children) : []),
  ]);
}

function commentResultTags(
  collectionId: string,
  comments: CommentResponse[] | undefined
): CommentTag[] {
  return [
    commentTag(collectionId),
    ...(comments ? collectCommentIds(comments).map(commentTag) : []),
  ];
}

function pageResultCommentTags(
  collectionId: string,
  result: PageResult<CommentResponse> | undefined
): CommentTag[] {
  return commentResultTags(collectionId, result?.list);
}

function cursorResultCommentTags(
  collectionId: string,
  result: CursorPageResult<CommentResponse> | undefined
): CommentTag[] {
  return commentResultTags(collectionId, result?.list);
}

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Public: Retrieve hierarchical comments for a post
     */
    getPostComments: builder.query<CommentResponse[], { postId: number } & Pageable>({
      query: ({ postId, page = 0, size = 10 }) => ({
        url: `/api/v1/public/comments/post/${postId}`,
        params: { page, size },
      }),
      rawResponseSchema: apiResponseSchema(
        z
          .array(CommentResponseSchema)
          .nullable()
          .transform((comments) => comments ?? [])
      ),
      transformResponse: (response: ApiResponse<CommentResponse[]>) => response.data || [],
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { postId }) => commentResultTags(`POST_${postId}`, result),
    }),

    getPostCommentRoots: builder.query<PageResult<CommentResponse>, { postId: number } & Pageable>({
      query: ({ postId, page = 0, size = 20, sort }) => ({
        url: `/api/v1/public/comments/post/${postId}/roots`,
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { postId }) =>
        pageResultCommentTags(`POST_${postId}_ROOTS`, result),
    }),

    getHotPostCommentRoots: builder.query<
      PageResult<CommentResponse>,
      { postId: number } & Pageable
    >({
      query: ({ postId, page = 0, size = 20, sort }) => ({
        url: `/api/v1/public/comments/post/${postId}/roots/hot`,
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { postId }) =>
        pageResultCommentTags(`POST_${postId}_HOT_ROOTS`, result),
    }),

    getPostCommentRootsCursor: builder.query<
      CursorPageResult<CommentResponse>,
      { postId: number; cursor?: number; size?: number }
    >({
      query: ({ postId, cursor, size = 20 }) => ({
        url: `/api/v1/public/comments/post/${postId}/roots/cursor`,
        params: { cursor, size },
      }),
      rawResponseSchema: apiResponseSchema(cursorPageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<CursorPageResult<CommentResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { postId }) =>
        cursorResultCommentTags(`POST_${postId}_ROOTS`, result),
    }),

    getNewPostCommentRoots: builder.query<
      CursorPageResult<CommentResponse>,
      { postId: number; afterId?: number; size?: number }
    >({
      query: ({ postId, afterId, size = 20 }) => ({
        url: `/api/v1/public/comments/post/${postId}/new`,
        params: { afterId, size },
      }),
      rawResponseSchema: apiResponseSchema(cursorPageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<CursorPageResult<CommentResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { postId }) =>
        cursorResultCommentTags(`POST_${postId}_NEW`, result),
    }),

    getNewPostCommentRootsCount: builder.query<number, { postId: number; afterId?: number }>({
      query: ({ postId, afterId }) => ({
        url: `/api/v1/public/comments/post/${postId}/new-count`,
        params: { afterId },
      }),
      rawResponseSchema: apiResponseSchema(z.number()),
      transformResponse: (response: ApiResponse<number>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, { postId }) => [commentTag(`POST_${postId}_NEW_COUNT`)],
    }),

    getCommentReplies: builder.query<PageResult<CommentResponse>, { parentId: number } & Pageable>({
      query: ({ parentId, page = 0, size = 20, sort }) => ({
        url: `/api/v1/public/comments/${parentId}/replies`,
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { parentId }) =>
        pageResultCommentTags(`REPLIES_${parentId}`, result),
    }),

    getCommentRepliesCursor: builder.query<
      CursorPageResult<CommentResponse>,
      { parentId: number; cursor?: number; size?: number }
    >({
      query: ({ parentId, cursor, size = 20 }) => ({
        url: `/api/v1/public/comments/${parentId}/replies/cursor`,
        params: { cursor, size },
      }),
      rawResponseSchema: apiResponseSchema(cursorPageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<CursorPageResult<CommentResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { parentId }) =>
        cursorResultCommentTags(`REPLIES_${parentId}`, result),
    }),

    getCommentAnchorContext: builder.query<
      CommentAnchorContextResponse,
      { commentId: number; size?: number }
    >({
      query: ({ commentId, size = 20 }) => ({
        url: `/api/v1/public/comments/${commentId}/context`,
        params: { size },
      }),
      rawResponseSchema: apiResponseSchema(CommentAnchorContextResponseSchema),
      transformResponse: (response: ApiResponse<CommentAnchorContextResponse>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, { commentId }) => [commentTag(commentId)],
    }),

    /**
     * Public: Publish a new comment
     */
    publishComment: builder.mutation<void, CommentRequest & CommentPublishOptions>({
      query: ({ idempotencyKey, ...body }) => ({
        url: "/api/v1/public/comments",
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
        body,
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted({ parentId, postId }, { queryFulfilled }) {
        commentDebug("api:publish-start", { postId, parentId });
        try {
          await queryFulfilled;
          commentDebug("api:publish-fulfilled", { postId, parentId });
          toast.success("Comment published successfully!");
        } catch (error: unknown) {
          commentDebug("api:publish-rejected", {
            postId,
            parentId,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.danger(getApiErrorMessage(error, "Failed to publish comment"));
        }
      },
      invalidatesTags: (_result, error, { postId, parentId }) => {
        if (error) return [];
        const tags: CommentTag[] = [
          commentTag("ADMIN_LIST"),
          commentTag("MY_COMMENTS"),
          commentTag(`POST_${postId}`),
          commentTag(`POST_${postId}_ROOTS`),
          commentTag(`POST_${postId}_HOT_ROOTS`),
          commentTag(`POST_${postId}_NEW`),
          commentTag(`POST_${postId}_NEW_COUNT`),
        ];
        if (parentId) tags.push(commentTag(`REPLIES_${parentId}`));
        commentDebug("api:publish-invalidates", { postId, parentId, tags });
        return tags;
      },
    }),

    /**
     * Admin: Search all comments (Management)
     */
    getAdminComments: builder.query<PageResult<CommentResponse>, Pageable>({
      query: ({ page = 0, size = 10 }) => ({
        url: "/api/v1/admin/comments",
        params: { page, size },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "Comment" as const, id })),
              { type: "Comment", id: "ADMIN_LIST" },
            ]
          : [{ type: "Comment", id: "ADMIN_LIST" }],
    }),

    /**
     * Admin: Retrieve pending comments awaiting moderator approval
     */
    getPendingComments: builder.query<PageResult<CommentResponse>, Pageable>({
      query: ({ page = 0, size = 10 }) => ({
        url: "/api/v1/admin/comments/pending",
        params: { page, size },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "Comment" as const, id })),
              { type: "Comment", id: "ADMIN_LIST" },
            ]
          : [{ type: "Comment", id: "ADMIN_LIST" }],
    }),

    /**
     * Public: Retrieve complete guestbook message tree
     */
    getGuestbookEntries: builder.query<CommentResponse[], void>({
      query: () => "/api/v1/public/guestbook",
      rawResponseSchema: apiResponseSchema(
        z
          .array(CommentResponseSchema)
          .nullable()
          .transform((comments) => comments ?? [])
      ),
      transformResponse: (response: ApiResponse<CommentResponse[]>) => response.data || [],
      transformErrorResponse: transformApiError,
      providesTags: (result) => commentResultTags("GUESTBOOK", result),
    }),

    getGuestbookRoots: builder.query<PageResult<CommentResponse>, Pageable>({
      query: ({ page = 0, size = 20, sort }) => ({
        url: "/api/v1/public/guestbook/roots",
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) => pageResultCommentTags("GUESTBOOK", result),
    }),

    getHotGuestbookRoots: builder.query<PageResult<CommentResponse>, Pageable>({
      query: ({ page = 0, size = 20, sort }) => ({
        url: "/api/v1/public/guestbook/roots/hot",
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) => pageResultCommentTags("GUESTBOOK", result),
    }),

    getGuestbookRootsCursor: builder.query<
      CursorPageResult<CommentResponse>,
      { cursor?: number; size?: number }
    >({
      query: ({ cursor, size = 20 }) => ({
        url: "/api/v1/public/guestbook/roots/cursor",
        params: { cursor, size },
      }),
      rawResponseSchema: apiResponseSchema(cursorPageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<CursorPageResult<CommentResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) => cursorResultCommentTags("GUESTBOOK", result),
    }),

    getNewGuestbookRoots: builder.query<
      CursorPageResult<CommentResponse>,
      { afterId?: number; size?: number }
    >({
      query: ({ afterId, size = 20 }) => ({
        url: "/api/v1/public/guestbook/new",
        params: { afterId, size },
      }),
      rawResponseSchema: apiResponseSchema(cursorPageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<CursorPageResult<CommentResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Comment", id: "GUESTBOOK_NEW" }],
    }),

    getNewGuestbookRootsCount: builder.query<number, { afterId?: number }>({
      query: ({ afterId }) => ({
        url: "/api/v1/public/guestbook/new-count",
        params: { afterId },
      }),
      rawResponseSchema: apiResponseSchema(z.number()),
      transformResponse: (response: ApiResponse<number>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Comment", id: "GUESTBOOK_NEW_COUNT" }],
    }),

    /**
     * Public: Submit a new guestbook entry (requires login)
     */
    postGuestbookEntry: builder.mutation<void, GuestbookRequest & CommentPublishOptions>({
      query: ({ idempotencyKey, ...body }) => ({
        url: "/api/v1/public/guestbook",
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
        body,
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Guestbook entry posted successfully!");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Failed to post entry"));
        }
      },
      invalidatesTags: (_result, error) =>
        error
          ? []
          : [
              commentTag("GUESTBOOK"),
              commentTag("GUESTBOOK_NEW"),
              commentTag("GUESTBOOK_NEW_COUNT"),
              commentTag("ADMIN_LIST"),
              commentTag("MY_COMMENTS"),
            ],
    }),

    /**
     * Admin: Moderate a comment status
     */
    moderateComment: builder.mutation<void, { id: number; status: CommentStatus }>({
      query: ({ id, status }) => ({
        url: `/api/v1/admin/comments/${id}/status`,
        method: "PATCH",
        params: { status },
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted({ status }, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success(`Comment status updated to ${status}`);
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Moderation failed"));
        }
      },
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [commentTag(id), commentTag("ADMIN_LIST"), "Comment"],
    }),

    /**
     * Admin: Hard delete a comment
     */
    deleteComment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/comments/${id}`,
        method: "DELETE",
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Comment deleted permanently");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Deletion failed"));
        }
      },
      invalidatesTags: (_result, error, id) =>
        error ? [] : [commentTag(id), commentTag("ADMIN_LIST"), "Comment"],
    }),

    getMyComments: builder.query<
      PageResult<CommentResponse>,
      Pageable & { status?: CommentStatus }
    >({
      query: ({ status, page = 0, size = 20, sort }) => ({
        url: "/api/v1/user/comments",
        params: { status, page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Comment", id: "MY_COMMENTS" }],
    }),

    /**
     * User: Edit my own comment
     */
    editMyComment: builder.mutation<void, { id: number; content: string }>({
      query: ({ id, content }) => ({
        url: `/api/v1/user/comments/${id}`,
        method: "PUT",
        body: { content },
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Comment updated successfully!");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Update failed"));
        }
      },
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [commentTag(id), commentTag("MY_COMMENTS")],
    }),

    /**
     * User: Delete my own comment
     */
    deleteMyComment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/user/comments/${id}`,
        method: "DELETE",
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Comment retracted successfully!");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Retraction failed"));
        }
      },
      invalidatesTags: (_result, error, id) =>
        error ? [] : [commentTag(id), commentTag("MY_COMMENTS")],
    }),

    /**
     * Public: Like a comment
     */
    likeComment: builder.mutation<void, number>({
      query: (commentId) => ({
        url: `/api/v1/public/interactions/comments/${commentId}/like`,
        method: "POST",
      }),
      transformErrorResponse: transformApiError,
      invalidatesTags: (_result, error, commentId) => (error ? [] : [commentTag(commentId)]),
    }),

    /**
     * Public: Unlike a comment
     */
    unlikeComment: builder.mutation<void, number>({
      query: (commentId) => ({
        url: `/api/v1/public/interactions/comments/${commentId}/unlike`,
        method: "POST",
      }),
      transformErrorResponse: transformApiError,
      invalidatesTags: (_result, error, commentId) => (error ? [] : [commentTag(commentId)]),
    }),

    /**
     * Public: Report a comment
     */
    reportComment: builder.mutation<void, { id: number; reason: string; description?: string }>({
      query: ({ id, reason, description }) => ({
        url: `/api/v1/public/comments/${id}/report`,
        method: "POST",
        body: { reason, description },
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Thank you. Comment has been flagged for moderation.");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Report submission failed"));
        }
      },
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [commentTag(id), commentTag("ADMIN_LIST")],
    }),

    /**
     * Admin: Batch moderate comments
     */
    batchModerateComments: builder.mutation<number, { ids: number[]; status: CommentStatus }>({
      query: (body) => ({
        url: "/api/v1/admin/comments/batch/status",
        method: "POST",
        body,
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted({ status }, { queryFulfilled }) {
        try {
          const { data: count } = await queryFulfilled;
          toast.success(`Batch moderated ${count} comments to ${status}`);
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Batch moderation failed"));
        }
      },
      invalidatesTags: (_result, error) => (error ? [] : ["Comment", commentTag("ADMIN_LIST")]),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPostCommentsQuery,
  useGetPostCommentRootsQuery,
  useLazyGetPostCommentRootsQuery,
  useGetHotPostCommentRootsQuery,
  useLazyGetHotPostCommentRootsQuery,
  useGetPostCommentRootsCursorQuery,
  useLazyGetPostCommentRootsCursorQuery,
  useGetNewPostCommentRootsQuery,
  useGetNewPostCommentRootsCountQuery,
  useGetCommentRepliesQuery,
  useGetCommentRepliesCursorQuery,
  useLazyGetCommentRepliesCursorQuery,
  useGetCommentAnchorContextQuery,
  usePublishCommentMutation,
  useGetAdminCommentsQuery,
  useGetPendingCommentsQuery,
  useGetGuestbookEntriesQuery,
  useGetGuestbookRootsQuery,
  useLazyGetGuestbookRootsQuery,
  useGetHotGuestbookRootsQuery,
  useLazyGetHotGuestbookRootsQuery,
  useGetGuestbookRootsCursorQuery,
  useLazyGetGuestbookRootsCursorQuery,
  useGetNewGuestbookRootsQuery,
  useGetNewGuestbookRootsCountQuery,
  usePostGuestbookEntryMutation,
  useModerateCommentMutation,
  useDeleteCommentMutation,
  useGetMyCommentsQuery,
  useEditMyCommentMutation,
  useDeleteMyCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
  useReportCommentMutation,
  useBatchModerateCommentsMutation,
} = commentApi;
