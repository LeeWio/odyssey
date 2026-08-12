import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
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
        try {
          await queryFulfilled;
          toast.success("Column created successfully.");
        } catch {
          toast.danger("Failed to create column.");
        }
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
        try {
          await queryFulfilled;
          toast.success("Column updated successfully.");
        } catch {
          toast.danger("Failed to update column.");
        }
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
        try {
          await queryFulfilled;
          toast.success("Column deleted successfully.");
        } catch {
          toast.danger("Failed to delete column.");
        }
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
