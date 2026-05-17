import { ApiResponse } from "@/types";
import { baseApi, transformError, ApiResponseSchema } from "../api/base-api";
import { setCredentials, setPermissions } from "./auth-slice";
import { toast } from "@heroui/react";
import { z } from "zod";
import { permissionApi } from "../permission/permission-api";

/**
 * --- Zod Schemas for Runtime Validation ---
 */
const AuthResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.string(),
  username: z.string(),
  email: z.string().optional(),
  roles: z.array(z.string()),
});

/**
 * --- TypeScript Interfaces (Inferred from Schemas) ---
 */
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Authenticate user and receive access token.
     */
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/api/v1/auth/login",
        method: "POST",
        body: credentials,
      }),
      // @ts-ignore
      rawResponseSchema: ApiResponseSchema(AuthResponseSchema),
      transformResponse: (response: ApiResponse<AuthResponse>) => response.data,
      transformErrorResponse: transformError,

      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));

          // Trigger menu/permission fetch immediately after login
          const menuResult = await dispatch(
            permissionApi.endpoints.getCurrentUserMenus.initiate()
          ).unwrap();

          // Recursively extract permission codes from menu tree
          const extractPermissions = (menus: any[]): string[] => {
            let codes: string[] = [];
            menus.forEach((m) => {
              if (m.permission) codes.push(m.permission);
              if (m.children) codes = [...codes, ...extractPermissions(m.children)];
            });
            return Array.from(new Set(codes));
          };

          const permissions = extractPermissions(menuResult);
          dispatch(setPermissions(permissions));

          toast.success(`Welcome back!`);
        } catch (error: any) {
          // In onQueryStarted, if queryFulfilled rejects, the error object
          // contains the value returned by transformErrorResponse in its 'error' property.
          const errorMessage = error?.error || "Login failed";
          toast.danger(typeof errorMessage === "string" ? errorMessage : "Login failed");
        }
      },
      invalidatesTags: ["User", "Post", "Moment", "Project", "Menu", "Dashboard"],
    }),

    /**
     * Register a new user account.
     */
    register: builder.mutation<void, RegisterRequest>({
      query: (userData) => ({
        url: "/api/v1/auth/register",
        method: "POST",
        body: userData,
      }),
      // @ts-ignore
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Account created successfully!");
        } catch (error) {
          if (typeof error === "string") {
            toast.danger(error);
          } else {
            toast.danger("Registration failed");
          }
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation, useRegisterMutation } = authApi;
