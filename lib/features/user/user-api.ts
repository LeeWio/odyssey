import { z } from "zod";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import { notifyMutation } from "@/lib/toast";
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
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to update profile.",
          success: "Profile updated.",
        });
      },
      invalidatesTags: [{ type: "User", id: "CURRENT" }],
    }),

    changePassword: builder.mutation<void, PasswordChangeRequest>({
      query: (body) => ({ url: "/api/v1/user/password", method: "PUT", body }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to change password.",
          success: "Password changed.",
        });
      },
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
      UserResponse | null,
      { id: number; status: "ACTIVE" | "INACTIVE" | "PENDING" | "BANNED" | "DELETED" }
    >({
      query: ({ id, status }) => ({
        url: `/api/v1/admin/users/${id}/status?status=${status}`,
        method: "PATCH",
      }),
      rawResponseSchema: apiResponseSchema(UserResponseSchema.nullable()),
      transformResponse: (response: ApiResponse<UserResponse | null>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to update user status.",
          success: "User status updated successfully.",
        });
      },
      invalidatesTags: ["User"],
    }),

    /**
     * Update user roles
     */
    updateUserRoles: builder.mutation<void, { id: number; roleIds: number[] }>({
      query: ({ id, roleIds }) => ({
        url: `/api/v1/admin/users/${id}/roles`,
        method: "PUT",
        body: { roleIds },
      }),
      rawResponseSchema: apiResponseSchema(z.null()),
      transformResponse: () => undefined,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to update user roles.",
          success: "User roles updated successfully.",
        });
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
