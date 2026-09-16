import { z } from "zod";
import type { ApiResponse, Pageable, PageResult } from "@/lib/api";
import { apiResponseSchema, baseApi, pageResultSchema, transformApiError } from "@/lib/api";
import { notifyMutation } from "@/lib/toast";
import { MomentResponseSchema, type MomentRequest, type MomentResponse } from "./moment-contracts";

type MomentListEndpoint = "getPublicMoments" | "getAllMoments";

function patchMomentLists(
  dispatch: (action: unknown) => { undo: () => void },
  getState: () => unknown,
  mutate: (draft: PageResult<MomentResponse>) => void
) {
  const state = getState() as Record<string, unknown>;
  const apiState = state.api as
    Record<string, Record<string, { originalArgs?: unknown }>> | undefined;
  const queries = apiState?.queries;
  const patches: Array<{ undo: () => void }> = [];
  if (!queries) return patches;

  for (const [queryKey, entry] of Object.entries(queries)) {
    const endpoint = (["getPublicMoments", "getAllMoments"] as const).find((name) =>
      queryKey.startsWith(`${name}(`)
    ) as MomentListEndpoint | undefined;
    if (!endpoint || entry.originalArgs == null) continue;
    patches.push(
      dispatch(
        momentApi.util.updateQueryData(endpoint, entry.originalArgs as Pageable, (draft) => {
          mutate(draft);
        })
      )
    );
  }
  return patches;
}

export const momentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Public: Get published moments timeline
     */
    getPublicMoments: builder.query<PageResult<MomentResponse>, Pageable>({
      query: ({ page = 0, size = 10 }) => ({
        url: "/api/v1/public/moments",
        params: { page, size },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(MomentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<MomentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "Moment" as const, id })),
              { type: "Moment", id: "LIST" },
            ]
          : [{ type: "Moment", id: "LIST" }],
    }),

    /**
     * Public: Like a moment
     */
    likeMoment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/public/moments/${id}/like`,
        method: "POST",
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, { error: "Couldn't update moment reaction." });
      },
      invalidatesTags: (_result, _error, id) => [{ type: "Moment", id }],
    }),

    getLikedMomentIds: builder.query<number[], number[]>({
      query: (ids) => ({
        url: "/api/v1/public/moments/liked",
        params: { ids },
      }),
      rawResponseSchema: apiResponseSchema(z.array(z.number())),
      transformResponse: (response: ApiResponse<number[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, ids) => ids.map((id) => ({ type: "Moment", id })),
    }),

    unlikeMoment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/public/moments/${id}/like`,
        method: "DELETE",
      }),
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, { error: "Couldn't update moment reaction." });
      },
      invalidatesTags: (_result, _error, id) => [{ type: "Moment", id }],
    }),

    /**
     * Admin: Get all moments (paginated)
     */
    getAllMoments: builder.query<PageResult<MomentResponse>, Pageable>({
      query: ({ page = 0, size = 10 }) => ({
        url: "/api/v1/admin/moments",
        params: { page, size },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(MomentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<MomentResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "Moment" as const, id })),
              { type: "Moment", id: "LIST" },
            ]
          : [{ type: "Moment", id: "LIST" }],
    }),

    getMomentById: builder.query<MomentResponse, number>({
      query: (id) => `/api/v1/admin/moments/${id}`,
      rawResponseSchema: apiResponseSchema(MomentResponseSchema),
      transformResponse: (response: ApiResponse<MomentResponse>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, id) => [{ type: "Moment", id }],
    }),

    /**
     * Admin: Create a new moment
     */
    createMoment: builder.mutation<MomentResponse, MomentRequest>({
      query: (body) => ({
        url: "/api/v1/admin/moments",
        method: "POST",
        body,
      }),
      rawResponseSchema: apiResponseSchema(MomentResponseSchema),
      transformResponse: (response: ApiResponse<MomentResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        const notify = notifyMutation(queryFulfilled, {
          error: "Failed to create moment.",
          success: "Moment created successfully.",
        });
        try {
          const { data } = await queryFulfilled;
          patchMomentLists(dispatch, getState, (draft) => {
            if (!draft.list.some((moment) => moment.id === data.id)) {
              draft.list.unshift(data);
              draft.total += 1;
            }
          });
          dispatch(momentApi.util.upsertQueryData("getMomentById", data.id, data));
        } catch {
          // Toast handled by notifyMutation.
        }
        await notify;
      },
      invalidatesTags: [{ type: "Moment", id: "LIST" }],
    }),

    /**
     * Admin: Update a moment
     */
    updateMoment: builder.mutation<MomentResponse, { id: number; body: MomentRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/moments/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: apiResponseSchema(MomentResponseSchema),
      transformResponse: (response: ApiResponse<MomentResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted({ id }, { dispatch, getState, queryFulfilled }) {
        const notify = notifyMutation(queryFulfilled, {
          error: "Failed to update moment.",
          success: "Moment updated successfully.",
        });
        try {
          const { data } = await queryFulfilled;
          patchMomentLists(dispatch, getState, (draft) => {
            const index = draft.list.findIndex((moment) => moment.id === id);
            if (index >= 0) draft.list[index] = data;
          });
          dispatch(momentApi.util.upsertQueryData("getMomentById", id, data));
        } catch {
          // Toast handled by notifyMutation.
        }
        await notify;
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Moment", id },
        { type: "Moment", id: "LIST" },
      ],
    }),

    /**
     * Admin: Delete a moment
     */
    deleteMoment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/moments/${id}`,
        method: "DELETE",
      }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const patches = patchMomentLists(dispatch, getState, (draft) => {
          const index = draft.list.findIndex((moment) => moment.id === id);
          if (index >= 0) {
            draft.list.splice(index, 1);
            draft.total = Math.max(0, draft.total - 1);
          }
        });
        const notify = notifyMutation(queryFulfilled, {
          error: "Failed to delete moment.",
          success: "Moment deleted successfully.",
        });
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
        await notify;
      },
      invalidatesTags: (_result, _error, id) => [
        { type: "Moment", id },
        { type: "Moment", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPublicMomentsQuery,
  useLazyGetPublicMomentsQuery,
  useGetLikedMomentIdsQuery,
  useLikeMomentMutation,
  useUnlikeMomentMutation,
  useGetAllMomentsQuery,
  useGetMomentByIdQuery,
  useCreateMomentMutation,
  useUpdateMomentMutation,
  useDeleteMomentMutation,
} = momentApi;
