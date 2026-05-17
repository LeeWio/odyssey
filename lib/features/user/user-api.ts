import { ApiResponse } from "@/types";
import { baseApi, ApiResponseSchema, transformError } from "../api/base-api";
import { z } from "zod";

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
  }),
  overrideExisting: false,
});

export const { useGetAllUsersQuery } = userApi;
