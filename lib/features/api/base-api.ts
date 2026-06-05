import { createApi, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { z } from "zod";

// Define a minimal state interface to break circular dependency with store.ts
interface AuthState {
  auth: { accessToken: string | null };
}

/**
 * --- Common Zod Schemas ---
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number(),
    message: z.string(),
    data: dataSchema.nullable(),
  });

export const PageResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    list: z.array(itemSchema).nullable().default([]),
    total: z.number(),
    page: z.number(),
    size: z.number(),
    totalPages: z.number(),
  });

/**
 * Global Error Transformer Helper
 * Strictly types the RTK Query error response and handles specific status codes.
 */
export const transformError = (error: FetchBaseQueryError): string => {
  if ("data" in error && error.data && typeof error.data === "object") {
    const data = error.data as Record<string, unknown>;
    if (data.message) return data.message as string;
  }

  // Fallback messages based on status codes
  if ("status" in error) {
    switch (error.status) {
      case 403:
        return "Access denied. Action not permitted.";
      case 413:
        return "File too large. Please upload a smaller file.";
      case 429:
        return "Too many requests. Please slow down and try again later.";
      case "FETCH_ERROR":
        return "Network error. Please check your connection.";
      case "PARSING_ERROR":
        return "Invalid server response.";
      case "TIMEOUT_ERROR":
        return "Request timed out. Please try again.";
      case "CUSTOM_ERROR":
        return error.error || "Request failed.";
    }
  }

  return "An unexpected error occurred";
};

export const getRtkQueryErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const value = error as {
      error?: unknown;
      message?: unknown;
      data?: { message?: unknown };
    };

    if (typeof value.error === "string") return value.error;
    if (typeof value.data?.message === "string") return value.data.message;
    if (typeof value.message === "string") return value.message;
  }

  return fallback;
};

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthState).auth.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "api",
  refetchOnReconnect: true,
  baseQuery: async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    // Global interceptor for 401 Unauthorized errors
    if (result.error && result.error.status === 401) {
      api.dispatch({ type: "auth/removeCredentials" });
      // Reset the entire API state to clear cache for security
      // Note: Calling resetApiState() here causes an infinite loop for mounted components.
      // api.dispatch(baseApi.util.resetApiState());
    }

    return result;
  },
  tagTypes: [
    "User",
    "Post",
    "Moment",
    "Project",
    "FriendLink",
    "Role",
    "Category",
    "Tag",
    "Comment",
    "Dashboard",
    "Menu",
  ],
  endpoints: () => ({}),
});
