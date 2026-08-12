import { z } from "zod";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import { notifyMutation } from "@/lib/toast";
import { ColumnResponseSchema, type ColumnRequest, type ColumnResponse } from "./column-contracts";

export const columnApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicColumns: builder.query<ColumnResponse[], void>({
      query: () => "/api/v1/public/columns",
      rawResponseSchema: apiResponseSchema(z.array(ColumnResponseSchema).nullable().default([])),
      transformResponse: (response: ApiResponse<ColumnResponse[]>) => response.data || [],
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Column", id: "LIST" }],
    }),
    getPublicColumnBySlug: builder.query<ColumnResponse, string>({
      query: (slug) => `/api/v1/public/columns/${slug}`,
      rawResponseSchema: apiResponseSchema(ColumnResponseSchema),
      transformResponse: (response: ApiResponse<ColumnResponse>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, slug) => [{ type: "Column", id: slug }],
    }),
    getColumns: builder.query<ColumnResponse[], void>({
      query: () => "/api/v1/admin/columns",
      rawResponseSchema: apiResponseSchema(z.array(ColumnResponseSchema).nullable().default([])),
      transformResponse: (response: ApiResponse<ColumnResponse[]>) => response.data || [],
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Column", id: "ADMIN_LIST" }],
    }),
    createEditorialColumn: builder.mutation<ColumnResponse, ColumnRequest>({
      query: (body) => ({ url: "/api/v1/admin/columns", method: "POST", body }),
      rawResponseSchema: apiResponseSchema(ColumnResponseSchema),
      transformResponse: (response: ApiResponse<ColumnResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to create column.",
          success: "Column created successfully.",
        });
      },
      invalidatesTags: [
        { type: "Column", id: "LIST" },
        { type: "Column", id: "ADMIN_LIST" },
      ],
    }),
    updateEditorialColumn: builder.mutation<ColumnResponse, { id: number; body: ColumnRequest }>({
      query: ({ id, body }) => ({ url: `/api/v1/admin/columns/${id}`, method: "PUT", body }),
      rawResponseSchema: apiResponseSchema(ColumnResponseSchema),
      transformResponse: (response: ApiResponse<ColumnResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to update column.",
          success: "Column updated successfully.",
        });
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Column", id },
        { type: "Column", id: "LIST" },
        { type: "Column", id: "ADMIN_LIST" },
      ],
    }),
    deleteEditorialColumn: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/admin/columns/${id}`, method: "DELETE" }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to delete column.",
          success: "Column deleted successfully.",
        });
      },
      invalidatesTags: [
        { type: "Column", id: "LIST" },
        { type: "Column", id: "ADMIN_LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPublicColumnsQuery,
  useGetPublicColumnBySlugQuery,
  useGetColumnsQuery,
  useCreateEditorialColumnMutation,
  useUpdateEditorialColumnMutation,
  useDeleteEditorialColumnMutation,
} = columnApi;
