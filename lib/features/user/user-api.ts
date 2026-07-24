import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse } from "@/types";
import { ApiResponseSchema, baseApi, transformError } from "../api/base-api";

export const UserResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  nickname: z.string().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BANNED", "DELETED"]),
  createdAt: z.string(),
  roles: z.array(z.string()),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all users
     */
    getAllUsers: builder.query<UserResponse[], void>({
      query: () => ({
        url: "/api/v1/admin/users",
        method: "GET",
      }),
      rawResponseSchema: ApiResponseSchema(z.array(UserResponseSchema)),
      transformResponse: (response: ApiResponse<UserResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
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
      rawResponseSchema: ApiResponseSchema(UserResponseSchema),
      transformResponse: (response: ApiResponse<UserResponse>) => response.data,
      transformErrorResponse: transformError,
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
      rawResponseSchema: ApiResponseSchema(UserResponseSchema),
      transformResponse: (response: ApiResponse<UserResponse>) => response.data,
      transformErrorResponse: transformError,
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

export const { useGetAllUsersQuery, useUpdateUserStatusMutation, useUpdateUserRolesMutation } =
  userApi;
