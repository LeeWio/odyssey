import { ApiResponse } from "@/types";
import {
  baseApi,
  transformError,
  ApiResponseSchema,
  getRtkQueryErrorMessage,
} from "../api/base-api";
import { setCredentials, setPermissions } from "./auth-slice";
import { toast } from "@heroui/react";
import { z } from "zod";
import { permissionApi } from "../permission/permission-api";
import type { MenuResponse } from "../permission/permission-api";

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

export const OtpSendRequestSchema = z.object({
  email: z.string().email(),
});

export const OtpLoginRequestSchema = z.object({
  email: z.string().email(),
  code: z.string().min(1),
});

/**
 * --- TypeScript Interfaces (Inferred from Schemas) ---
 */
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type OtpSendRequest = z.infer<typeof OtpSendRequestSchema>;
export type OtpLoginRequest = z.infer<typeof OtpLoginRequestSchema>;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

const extractPermissions = (menus: MenuResponse[]): string[] => {
  const permissions = new Set<string>();

  const visit = (items: MenuResponse[]) => {
    for (const item of items) {
      if (item.permission) {
        permissions.add(item.permission);
      }
      if (item.children?.length) {
        visit(item.children);
      }
    }
  };

  visit(menus);
  return Array.from(permissions);
};

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
      rawResponseSchema: ApiResponseSchema(AuthResponseSchema),
      transformResponse: (response: ApiResponse<AuthResponse>) => response.data,
      transformErrorResponse: transformError,

      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
          toast.success(`Welcome back!`);
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Login failed"));
        }
      },
      invalidatesTags: ["User", "Post", "Moment", "Project", "Menu", "Dashboard"],
    }),

    /**
     * Send OTP to Email.
     */
    sendOtp: builder.mutation<ApiResponse<void>, OtpSendRequest>({
      query: (body) => ({
        url: "/api/v1/auth/otp/send",
        method: "POST",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response,
      transformErrorResponse: transformError,
    }),

    /**
     * Login with OTP.
     */
    loginWithOtp: builder.mutation<AuthResponse, OtpLoginRequest>({
      query: (body) => ({
        url: "/api/v1/auth/otp/login",
        method: "POST",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(AuthResponseSchema),
      transformResponse: (response: ApiResponse<AuthResponse>) => response.data,
      transformErrorResponse: transformError,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));

          // Trigger menu/permission fetch
          const menuResult = await dispatch(
            permissionApi.endpoints.getCurrentUserMenus.initiate()
          ).unwrap();

          const permissions = extractPermissions(menuResult);
          dispatch(setPermissions(permissions));

          toast.success(`Welcome back!`);
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Login failed"));
        }
      },
      invalidatesTags: ["User", "Post", "Moment", "Project", "Menu", "Dashboard"],
    }),

    /**
     * Register a new user account.
     */
    register: builder.mutation<ApiResponse<void>, RegisterRequest>({
      query: (userData) => ({
        url: "/api/v1/auth/register",
        method: "POST",
        body: userData,
      }),
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          toast.success(data.message || "Account created successfully!");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Registration failed"));
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useSendOtpMutation,
  useLoginWithOtpMutation,
} = authApi;
