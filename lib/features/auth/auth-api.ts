import { toast } from "@heroui/react";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, getApiErrorMessage, transformApiError } from "@/lib/api";
import { type MenuResponse, permissionApi } from "../permission";
import {
  AuthResponseSchema,
  EmptyAuthResponseSchema,
  type AuthResponse,
  type LoginRequest,
  type OtpLoginRequest,
  type OtpSendRequest,
  type RefreshTokenRequest,
  type RegisterRequest,
} from "./auth-contracts";
import { removeCredentials, setCredentials, setPermissions } from "./auth-slice";

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
      rawResponseSchema: apiResponseSchema(AuthResponseSchema),
      transformResponse: (response: ApiResponse<AuthResponse>) => response.data,
      transformErrorResponse: transformApiError,

      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
          toast.success(`Welcome back!`);
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Login failed"));
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
      rawResponseSchema: apiResponseSchema(EmptyAuthResponseSchema),
      transformResponse: (response: ApiResponse<void>) => response,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Verification code sent successfully");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Failed to send verification code"));
        }
      },
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
      rawResponseSchema: apiResponseSchema(AuthResponseSchema),
      transformResponse: (response: ApiResponse<AuthResponse>) => response.data,
      transformErrorResponse: transformApiError,
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
          toast.danger(getApiErrorMessage(error, "Login failed"));
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
      rawResponseSchema: apiResponseSchema(EmptyAuthResponseSchema),
      transformResponse: (response: ApiResponse<void>) => response,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          toast.success(data.message || "Account created successfully!");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Registration failed"));
        }
      },
    }),

    refreshSession: builder.mutation<AuthResponse, RefreshTokenRequest>({
      query: (body) => ({
        url: "/api/v1/auth/refresh",
        method: "POST",
        body,
      }),
      rawResponseSchema: apiResponseSchema(AuthResponseSchema),
      transformResponse: (response: ApiResponse<AuthResponse>) => response.data!,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials(data));
      },
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/api/v1/auth/logout",
        method: "POST",
      }),
      transformResponse: () => undefined,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(removeCredentials());
          dispatch(baseApi.util.resetApiState());
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
  useRefreshSessionMutation,
  useLogoutMutation,
} = authApi;
