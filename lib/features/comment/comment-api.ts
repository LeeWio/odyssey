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
  CommentGovernanceOverviewResponseSchema,
  CommentModerationLogResponseSchema,
  CommentPublishResponseSchema,
  CommentReportResponseSchema,
  CommentResponseSchema,
  CommentInteractionResponseSchema,
  CommentRiskResponseSchema,
  type AdminCommentListParams,
  type CommentAnchorContextResponse,
  type CommentGovernanceOverviewResponse,
  type CommentInteractionResponse,
  type CommentModerationAction,
  type CommentModerationLogResponse,
  type CommentPublishOptions,
  type CommentPublishResponse,
  type CommentReportResolutionRequest,
  type CommentReportResponse,
  type CommentReportStatus,
  type CommentRequest,
  type CommentResponse,
  type CommentRiskResponse,
  type CommentStatus,
  type GuestbookRequest,
  type MomentCommentRequest,
} from "./comment-contracts";
import { applyLikeToCommentList, applyLikeToCommentTree } from "./comment-cache";
import { commentDebug } from "@/lib/comment-debug";
import { notifyMutation } from "@/lib/toast";

type CommentTag = { type: "Comment"; id: string | number };

const commentTag = (id: string | number): CommentTag => ({ type: "Comment", id });

export function publishedCommentTags(postId: number, parentId?: number): CommentTag[] {
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
  return tags;
}

export function publishedMomentCommentTags(
  momentId: number,
  parentId?: number
): Array<CommentTag | { type: "Moment"; id: string | number }> {
  const tags: Array<CommentTag | { type: "Moment"; id: string | number }> = [
    commentTag("ADMIN_LIST"),
    commentTag("MY_COMMENTS"),
    commentTag(`MOMENT_${momentId}`),
    commentTag(`MOMENT_${momentId}_ROOTS`),
    commentTag(`MOMENT_${momentId}_HOT_ROOTS`),
    commentTag(`MOMENT_${momentId}_NEW`),
    commentTag(`MOMENT_${momentId}_NEW_COUNT`),
    { type: "Moment", id: momentId },
    { type: "Moment", id: "LIST" },
  ];
  if (parentId) tags.push(commentTag(`REPLIES_${parentId}`));
  return tags;
}

export const publishedGuestbookCommentTags: CommentTag[] = [
  commentTag("GUESTBOOK"),
  commentTag("GUESTBOOK_NEW"),
  commentTag("GUESTBOOK_NEW_COUNT"),
  commentTag("ADMIN_LIST"),
  commentTag("MY_COMMENTS"),
];

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

const COMMENT_LIST_ENDPOINTS = [
  "getPostCommentRoots",
  "getHotPostCommentRoots",
  "getPostCommentRootsCursor",
  "getNewPostCommentRoots",
  "getMomentCommentRoots",
  "getHotMomentCommentRoots",
  "getMomentCommentRootsCursor",
  "getNewMomentCommentRoots",
  "getCommentReplies",
  "getCommentRepliesCursor",
  "getGuestbookRoots",
  "getHotGuestbookRoots",
  "getGuestbookRootsCursor",
  "getNewGuestbookRoots",
  "getAdminComments",
  "getPendingComments",
  "getMyComments",
] as const;

const COMMENT_TREE_ENDPOINTS = ["getPostComments", "getGuestbookEntries"] as const;

function patchCachedCommentLikes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: any) => { undo: () => void },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState: () => any,
  commentId: number,
  liked: boolean
) {
  const patches: Array<{ undo: () => void }> = [];

  for (const endpoint of COMMENT_LIST_ENDPOINTS) {
    for (const args of commentApi.util.selectCachedArgsForQuery(getState(), endpoint)) {
      patches.push(
        dispatch(
          commentApi.util.updateQueryData(endpoint, args, (draft) => {
            applyLikeToCommentList(draft.list, commentId, liked);
          })
        )
      );
    }
  }

  for (const endpoint of COMMENT_TREE_ENDPOINTS) {
    for (const args of commentApi.util.selectCachedArgsForQuery(getState(), endpoint)) {
      patches.push(
        dispatch(
          commentApi.util.updateQueryData(endpoint, args, (draft) => {
            applyLikeToCommentList(draft, commentId, liked);
          })
        )
      );
    }
  }

  for (const args of commentApi.util.selectCachedArgsForQuery(
    getState(),
    "getCommentAnchorContext"
  )) {
    patches.push(
      dispatch(
        commentApi.util.updateQueryData("getCommentAnchorContext", args, (draft) => {
          applyLikeToCommentTree(draft.rootComment, commentId, liked);
          applyLikeToCommentTree(draft.targetComment, commentId, liked);
          applyLikeToCommentList(draft.repliesWindow.list, commentId, liked);
        })
      )
    );
  }

  return patches;
}

function applyLikeSnapshotToCommentTree(
  comment: CommentResponse,
  commentId: number,
  liked: boolean,
  likesCount: number
): boolean {
  if (comment.id === commentId) {
    comment.likedByCurrentUser = liked;
    comment.likesCount = likesCount;
    return true;
  }
  for (const child of comment.children ?? []) {
    if (applyLikeSnapshotToCommentTree(child, commentId, liked, likesCount)) return true;
  }
  return false;
}

function applyLikeSnapshotToCommentList(
  list: CommentResponse[] | undefined,
  commentId: number,
  liked: boolean,
  likesCount: number
) {
  if (!list) return;
  for (const comment of list) {
    applyLikeSnapshotToCommentTree(comment, commentId, liked, likesCount);
  }
}

function patchCachedCommentLikeSnapshot(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: any) => unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState: () => any,
  commentId: number,
  liked: boolean,
  likesCount: number
) {
  for (const endpoint of COMMENT_LIST_ENDPOINTS) {
    for (const args of commentApi.util.selectCachedArgsForQuery(getState(), endpoint)) {
      dispatch(
        commentApi.util.updateQueryData(endpoint, args, (draft) => {
          applyLikeSnapshotToCommentList(draft.list, commentId, liked, likesCount);
        })
      );
    }
  }

  for (const endpoint of COMMENT_TREE_ENDPOINTS) {
    for (const args of commentApi.util.selectCachedArgsForQuery(getState(), endpoint)) {
      dispatch(
        commentApi.util.updateQueryData(endpoint, args, (draft) => {
          applyLikeSnapshotToCommentList(draft, commentId, liked, likesCount);
        })
      );
    }
  }

  for (const args of commentApi.util.selectCachedArgsForQuery(
    getState(),
    "getCommentAnchorContext"
  )) {
    dispatch(
      commentApi.util.updateQueryData("getCommentAnchorContext", args, (draft) => {
        applyLikeSnapshotToCommentTree(draft.rootComment, commentId, liked, likesCount);
        applyLikeSnapshotToCommentTree(draft.targetComment, commentId, liked, likesCount);
        applyLikeSnapshotToCommentList(draft.repliesWindow.list, commentId, liked, likesCount);
      })
    );
  }
}

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Public: Retrieve hierarchical comments for a post.
     * @deprecated Prefer roots + replies cursor endpoints used by CommentSystem.
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

    getMomentCommentRoots: builder.query<
      PageResult<CommentResponse>,
      { momentId: number } & Pageable
    >({
      query: ({ momentId, page = 0, size = 20, sort }) => ({
        url: `/api/v1/public/comments/moment/${momentId}/roots`,
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { momentId }) =>
        pageResultCommentTags(`MOMENT_${momentId}_ROOTS`, result),
    }),

    getHotMomentCommentRoots: builder.query<
      PageResult<CommentResponse>,
      { momentId: number } & Pageable
    >({
      query: ({ momentId, page = 0, size = 20, sort }) => ({
        url: `/api/v1/public/comments/moment/${momentId}/roots/hot`,
        params: { page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { momentId }) =>
        pageResultCommentTags(`MOMENT_${momentId}_HOT_ROOTS`, result),
    }),

    getMomentCommentRootsCursor: builder.query<
      CursorPageResult<CommentResponse>,
      { momentId: number; cursor?: number; size?: number }
    >({
      query: ({ momentId, cursor, size = 20 }) => ({
        url: `/api/v1/public/comments/moment/${momentId}/roots/cursor`,
        params: { cursor, size },
      }),
      rawResponseSchema: apiResponseSchema(cursorPageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<CursorPageResult<CommentResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { momentId }) =>
        cursorResultCommentTags(`MOMENT_${momentId}_ROOTS`, result),
    }),

    getNewMomentCommentRoots: builder.query<
      CursorPageResult<CommentResponse>,
      { momentId: number; afterId?: number; size?: number }
    >({
      query: ({ momentId, afterId, size = 20 }) => ({
        url: `/api/v1/public/comments/moment/${momentId}/new`,
        params: { afterId, size },
      }),
      rawResponseSchema: apiResponseSchema(cursorPageResultSchema(CommentResponseSchema)),
      transformResponse: (response: ApiResponse<CursorPageResult<CommentResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result, _error, { momentId }) =>
        cursorResultCommentTags(`MOMENT_${momentId}_NEW`, result),
    }),

    getNewMomentCommentRootsCount: builder.query<number, { momentId: number; afterId?: number }>({
      query: ({ momentId, afterId }) => ({
        url: `/api/v1/public/comments/moment/${momentId}/new-count`,
        params: { afterId },
      }),
      rawResponseSchema: apiResponseSchema(z.number()),
      transformResponse: (response: ApiResponse<number>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, { momentId }) => [commentTag(`MOMENT_${momentId}_NEW_COUNT`)],
    }),

    publishMomentComment: builder.mutation<
      CommentPublishResponse | null,
      MomentCommentRequest & CommentPublishOptions
    >({
      query: ({ idempotencyKey, deferInvalidation, ...body }) => {
        void deferInvalidation;
        return {
          url: "/api/v1/public/comments/moment",
          method: "POST",
          headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
          body,
        };
      },
      rawResponseSchema: apiResponseSchema(CommentPublishResponseSchema.nullable()),
      transformResponse: (response: ApiResponse<CommentPublishResponse | null>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: (_result, error, { momentId, parentId, deferInvalidation }) => {
        if (error || deferInvalidation) return [];
        return publishedMomentCommentTags(momentId, parentId);
      },
    }),

    /** @deprecated Prefer `getCommentRepliesCursor` (used by CommentSystem). */
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
    publishComment: builder.mutation<
      CommentPublishResponse | null,
      CommentRequest & CommentPublishOptions
    >({
      query: ({ idempotencyKey, deferInvalidation, ...body }) => {
        void deferInvalidation;
        return {
          url: "/api/v1/public/comments",
          method: "POST",
          headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
          body,
        };
      },
      rawResponseSchema: apiResponseSchema(CommentPublishResponseSchema.nullable()),
      transformResponse: (response: ApiResponse<CommentPublishResponse | null>) => response.data,
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
      invalidatesTags: (_result, error, { postId, parentId, deferInvalidation }) => {
        if (error || deferInvalidation) return [];
        const tags = [
          ...publishedCommentTags(postId, parentId),
          { type: "Post" as const, id: postId },
        ];
        commentDebug("api:publish-invalidates", { postId, parentId, tags });
        return tags;
      },
    }),

    /**
     * Admin: Search all comments (Management)
     */
    getAdminComments: builder.query<PageResult<CommentResponse>, Pageable & AdminCommentListParams>(
      {
        query: ({
          page = 0,
          size = 10,
          sort,
          status,
          postId,
          featuredOnly,
          username,
          keyword,
        }) => ({
          url: "/api/v1/admin/comments",
          params: { page, size, sort, status, postId, featuredOnly, username, keyword },
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
      }
    ),

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
    postGuestbookEntry: builder.mutation<
      CommentPublishResponse | null,
      GuestbookRequest & CommentPublishOptions
    >({
      query: ({ idempotencyKey, deferInvalidation, ...body }) => {
        void deferInvalidation;
        return {
          url: "/api/v1/public/guestbook",
          method: "POST",
          headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
          body,
        };
      },
      rawResponseSchema: apiResponseSchema(CommentPublishResponseSchema.nullable()),
      transformResponse: (response: ApiResponse<CommentPublishResponse | null>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Guestbook entry posted successfully!");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Failed to post entry"));
        }
      },
      invalidatesTags: (_result, error, { deferInvalidation }) =>
        error || deferInvalidation ? [] : publishedGuestbookCommentTags,
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
        error
          ? []
          : [
              commentTag(id),
              commentTag("ADMIN_LIST"),
              commentTag("ADMIN_OVERVIEW"),
              commentTag("ADMIN_LOGS"),
              commentTag("ADMIN_HIGH_RISK"),
              "Comment",
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
        error
          ? []
          : [
              commentTag(id),
              commentTag("ADMIN_LIST"),
              commentTag("ADMIN_OVERVIEW"),
              commentTag("ADMIN_LOGS"),
              commentTag("ADMIN_HIGH_RISK"),
              "Comment",
            ],
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
    likeComment: builder.mutation<CommentInteractionResponse, number>({
      query: (commentId) => ({
        url: `/api/v1/public/interactions/comments/${commentId}/like`,
        method: "POST",
      }),
      rawResponseSchema: apiResponseSchema(CommentInteractionResponseSchema),
      transformResponse: (response: ApiResponse<CommentInteractionResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(commentId, { dispatch, getState, queryFulfilled }) {
        const patches = patchCachedCommentLikes(dispatch, getState, commentId, true);
        try {
          const { data } = await queryFulfilled;
          patchCachedCommentLikeSnapshot(
            dispatch,
            getState,
            data.commentId,
            data.liked,
            data.likesCount
          );
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
    }),

    /**
     * Public: Unlike a comment
     */
    unlikeComment: builder.mutation<CommentInteractionResponse, number>({
      query: (commentId) => ({
        url: `/api/v1/public/interactions/comments/${commentId}/unlike`,
        method: "POST",
      }),
      rawResponseSchema: apiResponseSchema(CommentInteractionResponseSchema),
      transformResponse: (response: ApiResponse<CommentInteractionResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(commentId, { dispatch, getState, queryFulfilled }) {
        const patches = patchCachedCommentLikes(dispatch, getState, commentId, false);
        try {
          const { data } = await queryFulfilled;
          patchCachedCommentLikeSnapshot(
            dispatch,
            getState,
            data.commentId,
            data.liked,
            data.likesCount
          );
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
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
        error
          ? []
          : [
              commentTag(id),
              commentTag("ADMIN_LIST"),
              commentTag("ADMIN_REPORTS"),
              commentTag("ADMIN_HIGH_RISK"),
              commentTag("ADMIN_OVERVIEW"),
            ],
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
      rawResponseSchema: apiResponseSchema(z.number()),
      transformResponse: (response: ApiResponse<number>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted({ status }, { queryFulfilled }) {
        try {
          const { data: count } = await queryFulfilled;
          toast.success(`Batch moderated ${count} comments to ${status}`);
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Batch moderation failed"));
        }
      },
      invalidatesTags: (_result, error) =>
        error
          ? []
          : [
              "Comment",
              commentTag("ADMIN_LIST"),
              commentTag("ADMIN_OVERVIEW"),
              commentTag("ADMIN_REPORTS"),
              commentTag("ADMIN_HIGH_RISK"),
              commentTag("ADMIN_LOGS"),
            ],
    }),

    pinComment: builder.mutation<void, { id: number; pinned: boolean }>({
      query: ({ id, pinned }) => ({
        url: `/api/v1/admin/comments/${id}/pin`,
        method: "PATCH",
        params: { pinned },
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted({ pinned }, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          success: pinned ? "Comment pinned" : "Comment unpinned",
          error: "Failed to update pin state",
        });
      },
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [commentTag(id), commentTag("ADMIN_LIST"), "Comment"],
    }),

    featureComment: builder.mutation<void, { id: number; featured: boolean }>({
      query: ({ id, featured }) => ({
        url: `/api/v1/admin/comments/${id}/feature`,
        method: "PATCH",
        params: { featured },
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted({ featured }, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          success: featured ? "Comment featured" : "Comment unfeatured",
          error: "Failed to update featured state",
        });
      },
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [commentTag(id), commentTag("ADMIN_LIST"), "Comment"],
    }),

    repairCommentCounters: builder.mutation<number, void>({
      query: () => ({
        url: "/api/v1/admin/comments/repair-counters",
        method: "POST",
      }),
      rawResponseSchema: apiResponseSchema(z.number()),
      transformResponse: (response: ApiResponse<number>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data: count } = await queryFulfilled;
          toast.success(`Repaired ${count} comment counters`);
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Failed to repair comment counters"));
        }
      },
      invalidatesTags: (_result, error) =>
        error ? [] : ["Comment", commentTag("ADMIN_LIST"), commentTag("ADMIN_OVERVIEW")],
    }),

    getCommentGovernanceOverview: builder.query<CommentGovernanceOverviewResponse, void>({
      query: () => "/api/v1/admin/comments/overview",
      rawResponseSchema: apiResponseSchema(CommentGovernanceOverviewResponseSchema),
      transformResponse: (response: ApiResponse<CommentGovernanceOverviewResponse>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: [commentTag("ADMIN_OVERVIEW")],
    }),

    getCommentReports: builder.query<
      PageResult<CommentReportResponse>,
      Pageable & { status?: CommentReportStatus; commentId?: number }
    >({
      query: ({ page = 0, size = 20, sort, status, commentId }) => ({
        url: "/api/v1/admin/comments/reports",
        params: { page, size, sort, status, commentId },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentReportResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentReportResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: [commentTag("ADMIN_REPORTS")],
    }),

    getCommentModerationLogs: builder.query<
      PageResult<CommentModerationLogResponse>,
      Pageable & { commentId?: number; action?: CommentModerationAction }
    >({
      query: ({ page = 0, size = 20, sort, commentId, action }) => ({
        url: "/api/v1/admin/comments/moderation-logs",
        params: { page, size, sort, commentId, action },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentModerationLogResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentModerationLogResponse>>) =>
        response.data,
      transformErrorResponse: transformApiError,
      providesTags: [commentTag("ADMIN_LOGS")],
    }),

    getHighRiskComments: builder.query<
      PageResult<CommentRiskResponse>,
      Pageable & { minOpenReports?: number }
    >({
      query: ({ page = 0, size = 20, sort, minOpenReports }) => ({
        url: "/api/v1/admin/comments/high-risk",
        params: { page, size, sort, minOpenReports },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(CommentRiskResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<CommentRiskResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [commentTag("ADMIN_HIGH_RISK")],
    }),

    resolveCommentReport: builder.mutation<
      void,
      { commentId: number; reporterId: number } & CommentReportResolutionRequest
    >({
      query: ({ commentId, reporterId, status, resolutionNote }) => ({
        url: `/api/v1/admin/comments/reports/${commentId}/${reporterId}`,
        method: "PATCH",
        body: { status, resolutionNote },
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted({ status }, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          success: status === "DISMISSED" ? "Report dismissed" : "Report marked actioned",
          error: "Failed to resolve comment report",
        });
      },
      invalidatesTags: (_result, error) =>
        error
          ? []
          : [
              commentTag("ADMIN_REPORTS"),
              commentTag("ADMIN_HIGH_RISK"),
              commentTag("ADMIN_OVERVIEW"),
              commentTag("ADMIN_LIST"),
            ],
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
  useLazyGetCommentAnchorContextQuery,
  useLazyGetNewPostCommentRootsQuery,
  useLazyGetNewGuestbookRootsQuery,
  useGetMomentCommentRootsQuery,
  useLazyGetMomentCommentRootsQuery,
  useGetHotMomentCommentRootsQuery,
  useLazyGetHotMomentCommentRootsQuery,
  useGetMomentCommentRootsCursorQuery,
  useLazyGetMomentCommentRootsCursorQuery,
  useGetNewMomentCommentRootsQuery,
  useLazyGetNewMomentCommentRootsQuery,
  useGetNewMomentCommentRootsCountQuery,
  usePublishMomentCommentMutation,
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
  usePinCommentMutation,
  useFeatureCommentMutation,
  useRepairCommentCountersMutation,
  useGetCommentGovernanceOverviewQuery,
  useGetCommentReportsQuery,
  useGetCommentModerationLogsQuery,
  useGetHighRiskCommentsQuery,
  useResolveCommentReportMutation,
} = commentApi;
