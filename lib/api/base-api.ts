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
      if (key === "pageable" && typeof value === "object" && !Array.isArray(value)) {
        for (const [pageableKey, pageableValue] of Object.entries(value)) {
          if (pageableValue === undefined || pageableValue === null || pageableValue === "")
            continue;
          if (Array.isArray(pageableValue)) {
            pageableValue.forEach((item) => searchParams.append(pageableKey, String(item)));
          } else {
            searchParams.set(pageableKey, String(pageableValue));
          }
        }
        continue;
      }
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

type Credentials = AuthState["auth"];
type QueryResult = Awaited<ReturnType<typeof rawBaseQuery>>;

interface RefreshAttempt {
  credentials: Credentials;
  promise: Promise<QueryResult>;
}

// getState is stable per store. Retain the latest successful attempt so a late
// 401 from the same expired token can reuse it without rotating tokens again.
const refreshAttempts = new WeakMap<() => unknown, RefreshAttempt>();

const hasSameCredentials = (left: Credentials, right: Credentials) =>
  left.accessToken === right.accessToken && left.refreshToken === right.refreshToken;

const isRefreshPayload = (value: unknown): value is RefreshPayload => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<RefreshPayload>;
  return (
    typeof payload.accessToken === "string" &&
    typeof payload.refreshToken === "string" &&
    typeof payload.tokenType === "string" &&
    typeof payload.username === "string" &&
    Array.isArray(payload.roles) &&
    payload.roles.every((role) => typeof role === "string")
  );
};

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const requestCredentials = (api.getState() as AuthState).auth;
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status !== 401) return result;

  const requestUrl = typeof args === "string" ? args : args.url;
  const currentCredentials = () => (api.getState() as AuthState).auth;
  const clearRequestSession = () => {
    if (!hasSameCredentials(currentCredentials(), requestCredentials)) return;
    const hadSession = Boolean(requestCredentials.accessToken || requestCredentials.refreshToken);
    api.dispatch({ type: "auth/removeCredentials" });
    if (hadSession) api.dispatch(baseApi.util.resetApiState());
  };

  if (requestCredentials.refreshToken && requestUrl !== "/api/v1/auth/refresh") {
    let attempt = refreshAttempts.get(api.getState);
    if (!attempt || !hasSameCredentials(attempt.credentials, requestCredentials)) {
      // An old session's response must not refresh or clear a new session.
      if (!hasSameCredentials(currentCredentials(), requestCredentials)) return result;

      const newAttempt: RefreshAttempt = {
        credentials: requestCredentials,
        promise: Promise.resolve(
          rawBaseQuery(
            {
              url: "/api/v1/auth/refresh",
              method: "POST",
              body: { refreshToken: requestCredentials.refreshToken },
            },
            api,
            extraOptions
          )
        ).then((refreshResult) => {
          const credentials = (refreshResult.data as RefreshEnvelope | undefined)?.data;
          if (isRefreshPayload(credentials)) {
            if (hasSameCredentials(currentCredentials(), requestCredentials)) {
              api.dispatch({ type: "auth/setCredentials", payload: credentials });
            }
          } else {
            if (refreshAttempts.get(api.getState) === newAttempt) {
              refreshAttempts.delete(api.getState);
            }
            // Temporary transport/server failures should allow a later retry.
            if (
              !refreshResult.error ||
              refreshResult.error.status === 401 ||
              refreshResult.error.status === 403
            ) {
              clearRequestSession();
            }
          }
          return refreshResult;
        }),
      };
      refreshAttempts.set(api.getState, newAttempt);
      attempt = newAttempt;
    }

    const refreshResult = await attempt.promise;
    const refreshedCredentials = (refreshResult.data as RefreshEnvelope | undefined)?.data;

    if (isRefreshPayload(refreshedCredentials)) {
      if (hasSameCredentials(currentCredentials(), refreshedCredentials) && !api.signal.aborted) {
        return rawBaseQuery(args, api, extraOptions);
      }
    } else if (
      refreshResult.error &&
      hasSameCredentials(currentCredentials(), requestCredentials)
    ) {
      return refreshResult;
    }
    return result;
  }

  clearRequestSession();
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
    "Column",
    "Kanban",
  ],
  endpoints: () => ({}),
});
