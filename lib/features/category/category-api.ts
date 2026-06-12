import { ApiResponse } from "@/types";
import { baseApi, transformError, ApiResponseSchema } from "../api/base-api";
import { toast } from "@heroui/react";
import { z } from "zod";

/**
 * --- Zod Schemas for Runtime Validation ---
 */
export const CategoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().default(""),
  icon: z.string().nullable().default(""),
  createdAt: z.string(),
});

/**
 * --- TypeScript Interfaces (Inferred from Schemas) ---
 */
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

export interface CategoryRequest {
  name: string;
  slug: string;
  description?: string;
}

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Retrieve all categories
     */
    getCategories: builder.query<CategoryResponse[], void>({
      query: () => "/api/v1/admin/categories",
      rawResponseSchema: ApiResponseSchema(z.array(CategoryResponseSchema)),
      transformResponse: (response: ApiResponse<CategoryResponse[]>) => response.data,
      transformErrorResponse: transformError,
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
      rawResponseSchema: ApiResponseSchema(z.array(CategoryResponseSchema)),
      transformResponse: (response: ApiResponse<CategoryResponse[]>) => response.data,
      transformErrorResponse: transformError,
      providesTags: [{ type: "Category", id: "LIST" }],
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
      rawResponseSchema: ApiResponseSchema(CategoryResponseSchema),
      transformResponse: (response: ApiResponse<CategoryResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Category created successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to create category");
        }
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
      rawResponseSchema: ApiResponseSchema(CategoryResponseSchema),
      transformResponse: (response: ApiResponse<CategoryResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Category updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update category");
        }
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
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Category deleted successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to delete category");
        }
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
