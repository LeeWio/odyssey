import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse, Pageable, PageResult } from "@/types";
import { ApiResponseSchema, baseApi, PageResultSchema, transformError } from "../api/base-api";

/**
 * --- Zod Schemas for Runtime Validation ---
 */
export const MomentResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  likesCount: z.number(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * --- TypeScript Interfaces ---
 */
export type MomentResponse = z.infer<typeof MomentResponseSchema>;

export interface MomentRequest {
  content: string;
  isPublished: boolean;
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
      rawResponseSchema: ApiResponseSchema(PageResultSchema(MomentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<MomentResponse>>) => response.data,
      transformErrorResponse: transformError,
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
      transformErrorResponse: transformError,
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
      rawResponseSchema: ApiResponseSchema(PageResultSchema(MomentResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<MomentResponse>>) => response.data,
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "Moment" as const, id })),
              { type: "Moment", id: "LIST" },
            ]
          : [{ type: "Moment", id: "LIST" }],
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
      rawResponseSchema: ApiResponseSchema(MomentResponseSchema),
      transformResponse: (response: ApiResponse<MomentResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Moment created successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to create moment");
        }
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
      rawResponseSchema: ApiResponseSchema(MomentResponseSchema),
      transformResponse: (response: ApiResponse<MomentResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Moment updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update moment");
        }
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
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Moment deleted successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to delete moment");
        }
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
  useCreateMomentMutation,
  useUpdateMomentMutation,
  useDeleteMomentMutation,
} = momentApi;
