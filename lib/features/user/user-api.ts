import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import {
  UserInfoResponseSchema,
  UserResponseSchema,
  type PasswordChangeRequest,
  type UserInfoResponse,
  type UserProfileRequest,
  type UserResponse,
} from "./user-contracts";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query<UserInfoResponse, void>({
      query: () => "/api/v1/user/me",
      rawResponseSchema: apiResponseSchema(UserInfoResponseSchema),
      transformResponse: (response: ApiResponse<UserInfoResponse>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "User", id: "CURRENT" }],
    }),

    updateProfile: builder.mutation<void, UserProfileRequest>({
      query: (body) => ({ url: "/api/v1/user/profile", method: "PUT", body }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: [{ type: "User", id: "CURRENT" }],
    }),

    changePassword: builder.mutation<void, PasswordChangeRequest>({
      query: (body) => ({ url: "/api/v1/user/password", method: "PUT", body }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
    }),

    /**
     * Get all users
     */
    getAllUsers: builder.query<UserResponse[], void>({
      query: () => ({
        url: "/api/v1/admin/users",
        method: "GET",
      }),
      rawResponseSchema: apiResponseSchema(z.array(UserResponseSchema)),
      transformResponse: (response: ApiResponse<UserResponse[]>) => response.data || [],
      transformErrorResponse: transformApiError,
      providesTags: ["User"],
    }),

    /**
     * Update user status (e.g. ban / activate)
     */
    updateUserStatus: builder.mutation<
      UserResponse,
      { id: number; status: "ACTIVE" | "INACTIVE" | "PENDING" | "BANNED" | "DELETED" }
    >({
      query: ({ id, status }) => ({
        url: `/api/v1/admin/users/${id}/status?status=${status}`,
        method: "PATCH",
      }),
      rawResponseSchema: apiResponseSchema(UserResponseSchema),
      transformResponse: (response: ApiResponse<UserResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("User status updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update status");
        }
      },
      invalidatesTags: ["User"],
    }),

    /**
     * Update user roles
     */
    updateUserRoles: builder.mutation<UserResponse, { id: number; roleIds: number[] }>({
      query: ({ id, roleIds }) => ({
        url: `/api/v1/admin/users/${id}/roles`,
        method: "PUT",
        body: { roleIds },
      }),
      rawResponseSchema: apiResponseSchema(UserResponseSchema),
      transformResponse: (response: ApiResponse<UserResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("User roles updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update roles");
        }
      },
      invalidatesTags: ["User"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetAllUsersQuery,
  useUpdateUserStatusMutation,
  useUpdateUserRolesMutation,
} = userApi;
