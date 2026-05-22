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

export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED" | "SPAM";

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Public: Retrieve hierarchical comments for a post
     */
    getPostComments: builder.query<PageResult<CommentResponse>, { postId: number } & Pageable>({
      query: ({ postId, page = 0, size = 10 }) => ({
        url: `/api/v1/public/comments/post/${postId}`,
        params: { page, size },
      }),
      rawResponseSchema: ApiResponseSchema(PageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformError,
      providesTags: (result, _error, { postId }) =>
        result
          ? [
              "Comment",
              ...result.list.map(({ id }) => ({ type: "Comment" as const, id })),
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
  }),
  overrideExisting: false,
});

export const {
  useGetPostCommentsQuery,
  usePublishCommentMutation,
  useGetAdminCommentsQuery,
  useModerateCommentMutation,
  useDeleteCommentMutation,
} = commentApi;
