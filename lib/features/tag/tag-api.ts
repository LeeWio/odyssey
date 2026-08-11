import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import { TagResponseSchema, type TagRequest, type TagResponse } from "./tag-contracts";

export const tagApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Retrieve all tags
     */
    getAllTags: builder.query<TagResponse[], void>({
      query: () => "/api/v1/admin/tags",
      rawResponseSchema: apiResponseSchema(z.array(TagResponseSchema)),
      transformResponse: (response: ApiResponse<TagResponse[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Tag" as const, id })), { type: "Tag", id: "LIST" }]
          : [{ type: "Tag", id: "LIST" }],
    }),

    /**
     * Public: Retrieve all tags
     */
    getPublicTags: builder.query<TagResponse[], void>({
      query: () => "/api/v1/public/tags",
      rawResponseSchema: apiResponseSchema(z.array(TagResponseSchema)),
      transformResponse: (response: ApiResponse<TagResponse[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Tag", id: "LIST" }],
    }),

    /**
     * Create a new tag
     */
    createTag: builder.mutation<TagResponse, TagRequest>({
      query: (body) => ({
        url: "/api/v1/admin/tags",
        method: "POST",
        body,
      }),
      rawResponseSchema: apiResponseSchema(TagResponseSchema),
      transformResponse: (response: ApiResponse<TagResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Tag created successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to create tag");
        }
      },
      invalidatesTags: [{ type: "Tag", id: "LIST" }],
    }),

    /**
     * Update an existing tag
     */
    updateTag: builder.mutation<TagResponse, { id: number; body: TagRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/tags/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: apiResponseSchema(TagResponseSchema),
      transformResponse: (response: ApiResponse<TagResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Tag updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update tag");
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Tag", id },
        { type: "Tag", id: "LIST" },
      ],
    }),

    /**
     * Delete a tag
     */
    deleteTag: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/tags/${id}`,
        method: "DELETE",
      }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Tag deleted successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to delete tag");
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: "Tag", id },
        { type: "Tag", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllTagsQuery,
  useGetPublicTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = tagApi;
