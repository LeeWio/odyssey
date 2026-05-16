import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a minimal state interface to break circular dependency with store.ts
interface AuthState {
  auth: { token: string | null };
}

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthState).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    // Global interceptor for 401 Unauthorized errors
    if (result.error && result.error.status === 401) {
      api.dispatch({ type: "auth/logout" });
    }

    return result;
  },
  tagTypes: ["User", "Post", "Moment", "Project"],
  endpoints: () => ({}),
});
