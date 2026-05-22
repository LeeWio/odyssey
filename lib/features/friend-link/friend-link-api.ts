import { ApiResponse, Pageable, PageResult } from "@/types";
import { baseApi, transformError, ApiResponseSchema, PageResultSchema } from "../api/base-api";
import { toast } from "@heroui/react";
import { z } from "zod";

/**
 * --- Zod Schemas for Runtime Validation ---
 */
export const FriendLinkStatusSchema = z.enum(["APPLYING", "APPROVED", "REJECTED"]);

export const FriendLinkResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  avatar: z.string().nullable().default(""),
  description: z.string().nullable().default(""),
  email: z.string().nullable().default(""),
  status: FriendLinkStatusSchema,
  sortOrder: z.number(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * --- TypeScript Interfaces (Inferred from Schemas) ---
 */
export type FriendLinkStatus = z.infer<typeof FriendLinkStatusSchema>;
export type FriendLinkResponse = z.infer<typeof FriendLinkResponseSchema>;

export interface FriendLinkRequest {
  name: string;
  url: string;
  avatar?: string;
  description?: string;
  email?: string;
  sortOrder?: number;
  isPublished?: boolean;
  status?: FriendLinkStatus;
}

export const friendLinkApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Retrieve all approved friend links (Public)
     */
    getPublicFriendLinks: builder.query<FriendLinkResponse[], void>({
      query: () => "/api/v1/public/friend-links",
      rawResponseSchema: ApiResponseSchema(z.array(FriendLinkResponseSchema)),
      transformResponse: (response: ApiResponse<FriendLinkResponse[]>) => response.data,
      transformErrorResponse: transformError,
      providesTags: ["FriendLink"],
    }),

    /**
     * Apply for a new friend link exchange (Public)
     */
    applyFriendLink: builder.mutation<void, FriendLinkRequest>({
      query: (body) => ({
        url: "/api/v1/public/friend-links/apply",
        method: "POST",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Application submitted successfully!");
        } catch (error) {
          if (typeof error === "string") {
            toast.danger(error);
          } else {
            toast.danger("Application failed");
          }
        }
      },
      invalidatesTags: ["FriendLink"],
    }),

    /**
     * Search all friend links (Admin)
     */
    getAdminFriendLinks: builder.query<PageResult<FriendLinkResponse>, Pageable>({
      query: ({ page = 0, size = 10, sort }) => ({
        url: "/api/v1/admin/friend-links",
        params: {
          page,
          size,
          ...(sort && { sort: sort.join(",") }),
        },
      }),
      rawResponseSchema: ApiResponseSchema(PageResultSchema(FriendLinkResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<FriendLinkResponse>>) => response.data,
      transformErrorResponse: transformError,
      providesTags: ["FriendLink"],
    }),

    /**
     * Retrieve friend link by ID (Admin)
     */
    getAdminFriendLinkById: builder.query<FriendLinkResponse, number>({
      query: (id) => `/api/v1/admin/friend-links/${id}`,
      rawResponseSchema: ApiResponseSchema(FriendLinkResponseSchema),
      transformResponse: (response: ApiResponse<FriendLinkResponse>) => response.data,
      transformErrorResponse: transformError,
      providesTags: (_result, _error, id) => [{ type: "FriendLink", id }],
    }),

    /**
     * Create a new friend link directly (Admin)
     */
    createFriendLink: builder.mutation<FriendLinkResponse, FriendLinkRequest>({
      query: (body) => ({
        url: "/api/v1/admin/friend-links",
        method: "POST",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(FriendLinkResponseSchema),
      transformResponse: (response: ApiResponse<FriendLinkResponse>) => response.data,
      transformErrorResponse: transformError,
      invalidatesTags: ["FriendLink"],
    }),

    /**
     * Update friend link details (Admin)
     */
    updateFriendLink: builder.mutation<FriendLinkResponse, { id: number; body: FriendLinkRequest }>(
      {
        query: ({ id, body }) => ({
          url: `/api/v1/admin/friend-links/${id}`,
          method: "PUT",
          body,
        }),
        rawResponseSchema: ApiResponseSchema(FriendLinkResponseSchema),
        transformResponse: (response: ApiResponse<FriendLinkResponse>) => response.data,
        transformErrorResponse: transformError,
        invalidatesTags: (_result, _error, { id }) => ["FriendLink", { type: "FriendLink", id }],
      }
    ),

    /**
     * Moderate friend link application status (Admin)
     */
    moderateFriendLink: builder.mutation<void, { id: number; status: FriendLinkStatus }>({
      query: ({ id, status }) => ({
        url: `/api/v1/admin/friend-links/${id}/status`,
        method: "PATCH",
        params: { status },
      }),
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted({ status }, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success(`Friend link status updated to ${status}.`);
        } catch (error) {
          if (typeof error === "string") {
            toast.danger(error);
          } else {
            toast.danger("Moderation failed");
          }
        }
      },
      invalidatesTags: (_result, _error, { id }) => ["FriendLink", { type: "FriendLink", id }],
    }),

    /**
     * Delete a friend link (Admin)
     */
    deleteFriendLink: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/friend-links/${id}`,
        method: "DELETE",
      }),
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      invalidatesTags: (_result, _error, id) => ["FriendLink", { type: "FriendLink", id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPublicFriendLinksQuery,
  useApplyFriendLinkMutation,
  useGetAdminFriendLinksQuery,
  useGetAdminFriendLinkByIdQuery,
  useCreateFriendLinkMutation,
  useUpdateFriendLinkMutation,
  useModerateFriendLinkMutation,
  useDeleteFriendLinkMutation,
} = friendLinkApi;
