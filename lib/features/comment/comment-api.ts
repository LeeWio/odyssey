import { ApiResponse, Pageable, PageResult } from "@/types";
import {
  baseApi,
  transformError,
  ApiResponseSchema,
  PageResultSchema,
  getRtkQueryErrorMessage,
} from "../api/base-api";
import { toast } from "@heroui/react";
import { z } from "zod";

/**
 * --- Zod Schemas for Runtime Validation ---
 */

// Define basic fields first to avoid circular dependency issues during lazy evaluation
const baseCommentFields = {
  id: z.number(),
  content: z.string(),
  username: z.string().nullable().default("Anonymous"),
  avatar: z.string().nullable().default(""),
  createdAt: z.string(),
  likesCount: z.number().nullable().default(0),
  likedByCurrentUser: z.boolean().nullable().default(false),
};

// Recursive Comment Response Schema
export type CommentResponse = z.infer<typeof baseSchema> & {
  children?: CommentResponse[];
};

const baseSchema = z.object(baseCommentFields);

export const CommentResponseSchema: z.ZodType<CommentResponse> = baseSchema.extend({
  children: z
    .lazy(() => z.array(CommentResponseSchema))
    .nullable()
    .optional()
    .transform((children) => children ?? []),
});

/**
 * --- TypeScript Interfaces ---
 */
export interface CommentRequest {
  content: string;
  postId?: number;
  parentId?: number;
}

export interface GuestbookRequest {
  content: string;
  parentId?: number;
}

export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED" | "SPAM";

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
      rawResponseSchema: ApiResponseSchema(z.array(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<CommentResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: (result, _error, { postId }) =>
        result
          ? [
              "Comment",
              ...result.map(({ id }) => ({ type: "Comment" as const, id })),
              { type: "Comment", id: `POST_${postId}` },
            ]
          : ["Comment", { type: "Comment", id: `POST_${postId}` }],
    }),

    /**
     * Public: Publish a new comment
     */
    publishComment: builder.mutation<void, CommentRequest>({
      query: (body) => ({
        url: "/api/v1/public/comments",
        method: "POST",
        body,
      }),
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Comment published successfully!");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Failed to publish comment"));
        }
      },
      invalidatesTags: (_result, _error, { postId }) =>
        postId
          ? [
              { type: "Comment", id: `POST_${postId}` },
              { type: "Comment", id: "ADMIN_LIST" },
            ]
          : ["Comment", { type: "Comment", id: "ADMIN_LIST" }],
    }),

    /**
     * Admin: Search all comments (Management)
     */
    getAdminComments: builder.query<PageResult<CommentResponse>, Pageable>({
      query: ({ page = 0, size = 10 }) => ({
        url: "/api/v1/admin/comments",
        params: { page, size },
      }),
      rawResponseSchema: ApiResponseSchema(PageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformError,
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
      rawResponseSchema: ApiResponseSchema(PageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformError,
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
      rawResponseSchema: ApiResponseSchema(z.array(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<CommentResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              "Comment",
              ...result.map(({ id }) => ({ type: "Comment" as const, id })),
              { type: "Comment", id: "GUESTBOOK" },
            ]
          : ["Comment", { type: "Comment", id: "GUESTBOOK" }],
    }),

    /**
     * Public: Submit a new guestbook entry (requires login)
     */
    postGuestbookEntry: builder.mutation<void, GuestbookRequest>({
      query: (body) => ({
        url: "/api/v1/public/guestbook",
        method: "POST",
        body,
      }),
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Guestbook entry posted successfully!");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Failed to post entry"));
        }
      },
      invalidatesTags: [
        "Comment",
        { type: "Comment", id: "GUESTBOOK" },
        { type: "Comment", id: "ADMIN_LIST" },
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
      transformErrorResponse: transformError,
      async onQueryStarted({ status }, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success(`Comment status updated to ${status}`);
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Moderation failed"));
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        "Comment",
        { type: "Comment", id },
        { type: "Comment", id: "ADMIN_LIST" },
      ],
    }),

    /**
     * Admin: Hard delete a comment
     */
    deleteComment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/comments/${id}`,
        method: "DELETE",
      }),
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Comment deleted permanently");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Deletion failed"));
        }
      },
      invalidatesTags: (_result, _error, id) => [
        "Comment",
        { type: "Comment", id },
        { type: "Comment", id: "ADMIN_LIST" },
      ],
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
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Comment updated successfully!");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Update failed"));
        }
      },
      invalidatesTags: (_result, _error, { id }) => ["Comment", { type: "Comment", id }],
    }),

    /**
     * User: Delete my own comment
     */
    deleteMyComment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/user/comments/${id}`,
        method: "DELETE",
      }),
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Comment retracted successfully!");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Retraction failed"));
        }
      },
      invalidatesTags: (_result, _error, id) => ["Comment", { type: "Comment", id }],
    }),

    /**
     * Public: Like a comment
     */
    likeComment: builder.mutation<void, number>({
      query: (commentId) => ({
        url: `/api/v1/public/interactions/comments/${commentId}/like`,
        method: "POST",
      }),
      transformErrorResponse: transformError,
      invalidatesTags: (_result, _error, commentId) => [
        "Comment",
        { type: "Comment", id: commentId },
      ],
    }),

    /**
     * Public: Unlike a comment
     */
    unlikeComment: builder.mutation<void, number>({
      query: (commentId) => ({
        url: `/api/v1/public/interactions/comments/${commentId}/unlike`,
        method: "POST",
      }),
      transformErrorResponse: transformError,
      invalidatesTags: (_result, _error, commentId) => [
        "Comment",
        { type: "Comment", id: commentId },
      ],
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
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Thank you. Comment has been flagged for moderation.");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Report submission failed"));
        }
      },
      invalidatesTags: (_result, _error, { id }) => ["Comment", { type: "Comment", id }],
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
      transformErrorResponse: transformError,
      async onQueryStarted({ status }, { queryFulfilled }) {
        try {
          const { data: count } = await queryFulfilled;
          toast.success(`Batch moderated ${count} comments to ${status}`);
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Batch moderation failed"));
        }
      },
      invalidatesTags: ["Comment", { type: "Comment", id: "ADMIN_LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPostCommentsQuery,
  usePublishCommentMutation,
  useGetAdminCommentsQuery,
  useGetPendingCommentsQuery,
  useGetGuestbookEntriesQuery,
  usePostGuestbookEntryMutation,
  useModerateCommentMutation,
  useDeleteCommentMutation,
  useEditMyCommentMutation,
  useDeleteMyCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
  useReportCommentMutation,
  useBatchModerateCommentsMutation,
} = commentApi;
