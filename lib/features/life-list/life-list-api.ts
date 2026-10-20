import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import { notifyMutation } from "@/lib/toast";
import { z } from "zod";

import {
  LifeListCategoryResponseSchema,
  LifeListItemResponseSchema,
  LifeListMemoryResponseSchema,
  LifeListPageResponseSchema,
  type LifeListCategoryResponse,
  type LifeListItemRequest,
  type LifeListItemResponse,
  type LifeListMemoryRequest,
  type LifeListMemoryResponse,
  type LifeListPageResponse,
  type LifeListQuery,
  type LifeListStatusRequest,
} from "./life-list-contracts";

const categoryListSchema = z.array(LifeListCategoryResponseSchema);

export const lifeListApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicLifeList: builder.query<LifeListPageResponse, LifeListQuery | void>({
      query: (args) => ({
        url: "/api/v1/public/life-list",
        params: {
          category: args?.category,
          status: args?.status,
          page: args?.page ?? 0,
          size: args?.size ?? 100,
        },
      }),
      rawResponseSchema: apiResponseSchema(LifeListPageResponseSchema),
      transformResponse: (response: ApiResponse<LifeListPageResponse>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "LifeList" as const, id })),
              { type: "LifeList", id: "PUBLIC" },
            ]
          : [{ type: "LifeList", id: "PUBLIC" }],
    }),

    getPublicLifeListCategories: builder.query<LifeListCategoryResponse[], void>({
      query: () => "/api/v1/public/life-list/categories",
      rawResponseSchema: apiResponseSchema(categoryListSchema),
      transformResponse: (response: ApiResponse<LifeListCategoryResponse[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "LifeList", id: "CATEGORIES" }],
    }),

    getPublicLifeListItem: builder.query<LifeListItemResponse, number>({
      query: (number) => `/api/v1/public/life-list/${number}`,
      rawResponseSchema: apiResponseSchema(LifeListItemResponseSchema),
      transformResponse: (response: ApiResponse<LifeListItemResponse>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) => (result ? [{ type: "LifeList", id: result.id }] : []),
    }),

    getAdminLifeList: builder.query<LifeListPageResponse, LifeListQuery | void>({
      query: (args) => ({
        url: "/api/v1/admin/life-list/items",
        params: {
          category: args?.category,
          status: args?.status,
          archived: args?.archived,
          page: args?.page ?? 0,
          size: args?.size ?? 100,
        },
      }),
      rawResponseSchema: apiResponseSchema(LifeListPageResponseSchema),
      transformResponse: (response: ApiResponse<LifeListPageResponse>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "LifeList" as const, id })),
              { type: "LifeList", id: "ADMIN" },
            ]
          : [{ type: "LifeList", id: "ADMIN" }],
    }),

    getAdminLifeListCategories: builder.query<LifeListCategoryResponse[], void>({
      query: () => "/api/v1/admin/life-list/categories",
      rawResponseSchema: apiResponseSchema(categoryListSchema),
      transformResponse: (response: ApiResponse<LifeListCategoryResponse[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "LifeList", id: "CATEGORIES" }],
    }),

    createLifeListItem: builder.mutation<LifeListItemResponse, LifeListItemRequest>({
      query: (body) => ({ url: "/api/v1/admin/life-list/items", method: "POST", body }),
      rawResponseSchema: apiResponseSchema(LifeListItemResponseSchema),
      transformResponse: (response: ApiResponse<LifeListItemResponse>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: [
        { type: "LifeList", id: "ADMIN" },
        { type: "LifeList", id: "PUBLIC" },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          success: "Wish saved.",
          error: "Couldn't save this wish.",
        });
      },
    }),

    updateLifeListItem: builder.mutation<
      LifeListItemResponse,
      { id: number; body: LifeListItemRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/life-list/items/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: apiResponseSchema(LifeListItemResponseSchema),
      transformResponse: (response: ApiResponse<LifeListItemResponse>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "LifeList", id },
        { type: "LifeList", id: "ADMIN" },
        { type: "LifeList", id: "PUBLIC" },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          success: "Wish updated.",
          error: "Couldn't update this wish.",
        });
      },
    }),

    changeLifeListStatus: builder.mutation<
      LifeListItemResponse,
      { id: number; body: LifeListStatusRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/life-list/items/${id}/status`,
        method: "PATCH",
        body,
      }),
      rawResponseSchema: apiResponseSchema(LifeListItemResponseSchema),
      transformResponse: (response: ApiResponse<LifeListItemResponse>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "LifeList", id },
        { type: "LifeList", id: "ADMIN" },
        { type: "LifeList", id: "PUBLIC" },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          success: "Status updated.",
          error: "Couldn't update the status.",
        });
      },
    }),

    archiveLifeListItem: builder.mutation<LifeListItemResponse, number>({
      query: (id) => ({ url: `/api/v1/admin/life-list/items/${id}/archive`, method: "POST" }),
      rawResponseSchema: apiResponseSchema(LifeListItemResponseSchema),
      transformResponse: (response: ApiResponse<LifeListItemResponse>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: [
        { type: "LifeList", id: "ADMIN" },
        { type: "LifeList", id: "PUBLIC" },
      ],
    }),

    restoreLifeListItem: builder.mutation<LifeListItemResponse, number>({
      query: (id) => ({ url: `/api/v1/admin/life-list/items/${id}/restore`, method: "POST" }),
      rawResponseSchema: apiResponseSchema(LifeListItemResponseSchema),
      transformResponse: (response: ApiResponse<LifeListItemResponse>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: [
        { type: "LifeList", id: "ADMIN" },
        { type: "LifeList", id: "PUBLIC" },
      ],
    }),

    deleteLifeListItem: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/admin/life-list/items/${id}`, method: "DELETE" }),
      transformErrorResponse: transformApiError,
      invalidatesTags: [
        { type: "LifeList", id: "ADMIN" },
        { type: "LifeList", id: "PUBLIC" },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          success: "Wish removed.",
          error: "Couldn't remove this wish.",
        });
      },
    }),

    createLifeListMemory: builder.mutation<
      LifeListMemoryResponse,
      { itemId: number; body: LifeListMemoryRequest }
    >({
      query: ({ itemId, body }) => ({
        url: `/api/v1/admin/life-list/items/${itemId}/memories`,
        method: "POST",
        body,
      }),
      rawResponseSchema: apiResponseSchema(LifeListMemoryResponseSchema),
      transformResponse: (response: ApiResponse<LifeListMemoryResponse>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: "LifeList", id: itemId },
        { type: "LifeList", id: "ADMIN" },
        { type: "LifeList", id: "PUBLIC" },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          success: "Memory saved.",
          error: "Couldn't save this memory.",
        });
      },
    }),

    updateLifeListMemory: builder.mutation<
      LifeListMemoryResponse,
      { id: number; itemId: number; body: LifeListMemoryRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/life-list/memories/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: apiResponseSchema(LifeListMemoryResponseSchema),
      transformResponse: (response: ApiResponse<LifeListMemoryResponse>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: "LifeList", id: itemId },
        { type: "LifeList", id: "ADMIN" },
        { type: "LifeList", id: "PUBLIC" },
      ],
    }),

    deleteLifeListMemory: builder.mutation<void, { id: number; itemId: number }>({
      query: ({ id }) => ({ url: `/api/v1/admin/life-list/memories/${id}`, method: "DELETE" }),
      transformErrorResponse: transformApiError,
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: "LifeList", id: itemId },
        { type: "LifeList", id: "ADMIN" },
        { type: "LifeList", id: "PUBLIC" },
      ],
    }),
  }),
});

export const {
  useGetPublicLifeListQuery,
  useGetPublicLifeListCategoriesQuery,
  useGetPublicLifeListItemQuery,
  useGetAdminLifeListQuery,
  useGetAdminLifeListCategoriesQuery,
  useCreateLifeListItemMutation,
  useUpdateLifeListItemMutation,
  useChangeLifeListStatusMutation,
  useArchiveLifeListItemMutation,
  useRestoreLifeListItemMutation,
  useDeleteLifeListItemMutation,
  useCreateLifeListMemoryMutation,
  useUpdateLifeListMemoryMutation,
  useDeleteLifeListMemoryMutation,
} = lifeListApi;
