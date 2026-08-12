import { z } from "zod";
import type { ApiResponse, Pageable, PageResult } from "@/lib/api";
import { apiResponseSchema, baseApi, pageResultSchema, transformApiError } from "@/lib/api";
import { notifyMutation } from "@/lib/toast";
import { MomentResponseSchema, type MomentRequest, type MomentResponse } from "./moment-contracts";

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
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to create moment.",
          success: "Moment created successfully.",
        });
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
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to update moment.",
          success: "Moment updated successfully.",
        });
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
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to delete moment.",
          success: "Moment deleted successfully.",
        });
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
  useLikeMomentMutation,
  useGetAllMomentsQuery,
  useGetMomentByIdQuery,
  useCreateMomentMutation,
  useUpdateMomentMutation,
  useDeleteMomentMutation,
} = momentApi;
