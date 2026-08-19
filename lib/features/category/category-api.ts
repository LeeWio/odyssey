import { z } from "zod";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import { notifyMutation } from "@/lib/toast";
import {
  CategoryResponseSchema,
  type CategoryRequest,
  type CategoryResponse,
} from "./category-contracts";

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Retrieve all categories
     */
    getCategories: builder.query<CategoryResponse[], void>({
      query: () => "/api/v1/admin/categories",
      rawResponseSchema: apiResponseSchema(z.array(CategoryResponseSchema)),
      transformResponse: (response: ApiResponse<CategoryResponse[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Category" as const, id })),
              { type: "Category", id: "LIST" },
            ]
          : [{ type: "Category", id: "LIST" }],
    }),

    /**
     * Public: Retrieve all categories
     */
    getPublicCategories: builder.query<CategoryResponse[], void>({
      query: () => "/api/v1/public/categories",
      rawResponseSchema: apiResponseSchema(z.array(CategoryResponseSchema)),
      transformResponse: (response: ApiResponse<CategoryResponse[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Category", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),

    /**
     * Create a new category
     */
    createCategory: builder.mutation<CategoryResponse, CategoryRequest>({
      query: (body) => ({
        url: "/api/v1/admin/categories",
        method: "POST",
        body,
      }),
      rawResponseSchema: apiResponseSchema(CategoryResponseSchema),
      transformResponse: (response: ApiResponse<CategoryResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to create category.",
          success: "Category created successfully.",
        });
      },
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    /**
     * Update an existing category
     */
    updateCategory: builder.mutation<CategoryResponse, { id: number; body: CategoryRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/categories/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: apiResponseSchema(CategoryResponseSchema),
      transformResponse: (response: ApiResponse<CategoryResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to update category.",
          success: "Category updated successfully.",
        });
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),

    /**
     * Delete a category
     */
    deleteCategory: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/categories/${id}`,
        method: "DELETE",
      }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to delete category.",
          success: "Category deleted successfully.",
        });
      },
      invalidatesTags: (_result, _error, id) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCategoriesQuery,
  useGetPublicCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
