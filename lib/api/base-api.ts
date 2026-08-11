import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

interface AuthState {
  auth: {
    accessToken: string | null;
    refreshToken: string | null;
  };
}

interface RefreshPayload {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  username: string;
  email?: string;
  roles: string[];
}

interface RefreshEnvelope {
  data?: RefreshPayload | null;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  timeout: 15_000,
  paramsSerializer: (params) => {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.set(key, String(value));
      }
    }

    return searchParams.toString();
  },
  prepareHeaders: (headers, { getState, arg }) => {
    const token = (getState() as AuthState).auth.accessToken;
    const requestUrl = typeof arg === "string" ? arg : arg.url;
    if (token && requestUrl !== "/api/v1/auth/refresh") {
      headers.set("authorization", `Bearer ${token}`);
    } else {
      headers.delete("authorization");
    }
    headers.set("accept", "application/json");
    return headers;
  },
});

let refreshPromise: Promise<Awaited<ReturnType<typeof rawBaseQuery>>> | null = null;

const isRefreshPayload = (value: unknown): value is RefreshPayload => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<RefreshPayload>;
  return (
    typeof payload.accessToken === "string" &&
    typeof payload.refreshToken === "string" &&
    typeof payload.tokenType === "string" &&
    typeof payload.username === "string" &&
    Array.isArray(payload.roles)
  );
};

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status !== 401) return result;

  const auth = (api.getState() as AuthState).auth;
  const requestUrl = typeof args === "string" ? args : args.url;
  const canRefresh = Boolean(auth.refreshToken) && requestUrl !== "/api/v1/auth/refresh";

  if (canRefresh) {
    const activeRefresh =
      refreshPromise ??
      Promise.resolve(
        rawBaseQuery(
          {
            url: "/api/v1/auth/refresh",
            method: "POST",
            body: { refreshToken: auth.refreshToken },
          },
          api,
          extraOptions
        )
      ).finally(() => {
        refreshPromise = null;
      });
    refreshPromise = activeRefresh;

    const refreshResult = await activeRefresh;
    const refreshedCredentials = (refreshResult.data as RefreshEnvelope | undefined)?.data;

    if (isRefreshPayload(refreshedCredentials)) {
      api.dispatch({ type: "auth/setCredentials", payload: refreshedCredentials });
      result = await rawBaseQuery(args, api, extraOptions);
      return result;
    }
  }

  const hadSession = Boolean(auth.accessToken || auth.refreshToken);
  api.dispatch({ type: "auth/removeCredentials" });
  if (hadSession) api.dispatch(baseApi.util.resetApiState());
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  refetchOnReconnect: true,
  baseQuery: baseQueryWithReauth,
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
    "File",
    "Notification",
    "Library",
    "OpenApi",
  ],
  endpoints: () => ({}),
});
