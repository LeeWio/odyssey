import { configureStore } from "@reduxjs/toolkit";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost");
});

import { baseApi } from "./base-api";
import { authSlice, removeCredentials, setCredentials } from "../features/auth/auth-slice";

const testApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sessionProbe: builder.query<{ ok: boolean }, string>({
      query: (id) => `/probe/${id}`,
    }),
  }),
});

const credentials = (name: string) => ({
  accessToken: `${name}-access`,
  refreshToken: `${name}-refresh`,
  username: name,
  tokenType: "Bearer",
  roles: ["ROLE_USER"],
});

function createStore(name = "old") {
  const store = configureStore({
    reducer: { auth: authSlice.reducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) => defaults().concat(baseApi.middleware),
  });
  store.dispatch(setCredentials(credentials(name)));
  cleanups.push(() => store.dispatch(baseApi.util.resetApiState()));
  return store;
}

const cleanups: (() => void)[] = [];
const probe = (store: ReturnType<typeof createStore>, id = "one") =>
  store.dispatch(testApi.endpoints.sessionProbe.initiate(id));
const json = (data: unknown, status = 200) => Response.json(data, { status });
const unauthorized = () => json({ message: "Expired" }, 401);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function mockRequests() {
  const requests: { request: Request; resolve: (response: Response) => void }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((request: Request) => {
      const response = deferred<Response>();
      requests.push({ request, resolve: response.resolve });
      return response.promise;
    })
  );
  const next = async (path: string, occurrence = 0) => {
    await vi.waitFor(() => {
      expect(
        requests.filter(({ request }) => new URL(request.url).pathname === path).length
      ).toBeGreaterThan(occurrence);
    });
    return requests.filter(({ request }) => new URL(request.url).pathname === path)[occurrence];
  };
  return { requests, next };
}

async function beginRefresh(
  store: ReturnType<typeof createStore>,
  network: ReturnType<typeof mockRequests>,
  id = "one"
) {
  const result = probe(store, id);
  (await network.next(`/probe/${id}`)).resolve(unauthorized());
  const refresh = await network.next("/api/v1/auth/refresh");
  return { result, refresh };
}

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.unstubAllGlobals();
});

afterAll(() => vi.unstubAllEnvs());

describe("automatic session refresh", () => {
  it("shares a refresh for concurrent 401s and replays requests with the new token", async () => {
    const network = mockRequests();
    const store = createStore();
    const first = await beginRefresh(store, network);
    const second = probe(store, "two");
    (await network.next("/probe/two")).resolve(unauthorized());
    expect(first.refresh.request.headers.has("authorization")).toBe(false);
    expect(await first.refresh.request.json()).toEqual({ refreshToken: "old-refresh" });
    first.refresh.resolve(json({ data: credentials("renewed") }));
    for (const id of ["one", "two"]) {
      const retry = await network.next(`/probe/${id}`, 1);
      expect(retry.request.headers.get("authorization")).toBe("Bearer renewed-access");
      retry.resolve(json({ ok: true }));
    }
    expect((await first.result).data).toEqual({ ok: true });
    expect((await second).data).toEqual({ ok: true });
    expect(
      network.requests.filter(({ request }) => request.url.endsWith("/auth/refresh"))
    ).toHaveLength(1);
  });

  it("reuses a completed refresh when another expired request returns a late 401", async () => {
    const network = mockRequests();
    const store = createStore();
    const first = await beginRefresh(store, network);
    const second = probe(store, "two");
    const delayed = await network.next("/probe/two");
    first.refresh.resolve(json({ data: credentials("renewed") }));
    (await network.next("/probe/one", 1)).resolve(json({ ok: true }));
    await first.result;
    delayed.resolve(unauthorized());
    (await network.next("/probe/two", 1)).resolve(json({ ok: true }));
    expect((await second).data).toEqual({ ok: true });
    expect(network.requests).toHaveLength(5);
  });

  it("isolates simultaneous refreshes from separate stores", async () => {
    const network = mockRequests();
    const firstStore = createStore("alice");
    const secondStore = createStore("bob");
    const first = await beginRefresh(firstStore, network);
    const second = probe(secondStore, "two");
    (await network.next("/probe/two")).resolve(unauthorized());
    const secondRefresh = await network.next("/api/v1/auth/refresh", 1);
    expect(await secondRefresh.request.json()).toEqual({ refreshToken: "bob-refresh" });
    first.refresh.resolve(json({ data: credentials("alice-new") }));
    secondRefresh.resolve(json({ data: credentials("bob-new") }));
    for (const id of ["one", "two"]) {
      (await network.next(`/probe/${id}`, 1)).resolve(json({ ok: true }));
    }
    await Promise.all([first.result, second]);
    expect(firstStore.getState().auth.username).toBe("alice-new");
    expect(secondStore.getState().auth.username).toBe("bob-new");
  });

  it.each(["logout", "switch"])(
    "does not restore old credentials after %s during refresh",
    async (action) => {
      const network = mockRequests();
      const store = createStore();
      const { result, refresh } = await beginRefresh(store, network);
      store.dispatch(
        action === "logout" ? removeCredentials() : setCredentials(credentials("new-account"))
      );
      refresh.resolve(json({ data: credentials("renewed") }));
      await result;
      expect(store.getState().auth.accessToken).toBe(
        action === "logout" ? null : "new-account-access"
      );
      expect(network.requests).toHaveLength(2);
    }
  );

  it.each([401, 403])(
    "does not clear a new login when an old refresh fails with %s",
    async (status) => {
      const network = mockRequests();
      const store = createStore();
      const { result, refresh } = await beginRefresh(store, network);
      store.dispatch(setCredentials(credentials("new-account")));
      refresh.resolve(json({ message: "Invalid refresh token" }, status));
      await result;
      expect(store.getState().auth.accessToken).toBe("new-account-access");
      expect(network.requests).toHaveLength(2);
    }
  );

  it("ignores an old 401 received after switching accounts", async () => {
    const network = mockRequests();
    const store = createStore();
    const result = probe(store);
    const initial = await network.next("/probe/one");
    store.dispatch(setCredentials(credentials("new-account")));
    initial.resolve(unauthorized());
    await result;
    expect(store.getState().auth.accessToken).toBe("new-account-access");
    expect(network.requests).toHaveLength(1);
  });

  it.each([401, 403])(
    "clears the expired session and cached data on refresh rejection %s",
    async (status) => {
      const network = mockRequests();
      const store = createStore();
      const cached = probe(store, "cached");
      (await network.next("/probe/cached")).resolve(json({ ok: true }));
      await cached;
      const { result, refresh } = await beginRefresh(store, network);
      refresh.resolve(json({ message: "Invalid refresh token" }, status));
      await result;
      expect(store.getState().auth.isAuthenticated).toBe(false);
      expect(store.getState().api.queries).toEqual({});
    }
  );

  it("preserves the session on a temporary refresh failure and allows another attempt", async () => {
    const network = mockRequests();
    const store = createStore();
    const first = await beginRefresh(store, network);
    first.refresh.resolve(json({ message: "Unavailable" }, 503));
    expect((await first.result).error).toMatchObject({ status: 503 });
    expect(store.getState().auth.accessToken).toBe("old-access");
    const second = probe(store, "two");
    (await network.next("/probe/two")).resolve(unauthorized());
    (await network.next("/api/v1/auth/refresh", 1)).resolve(json({ data: credentials("renewed") }));
    (await network.next("/probe/two", 1)).resolve(json({ ok: true }));
    expect((await second).data).toEqual({ ok: true });
  });

  it("rejects malformed refresh credentials", async () => {
    const network = mockRequests();
    const store = createStore();
    const { result, refresh } = await beginRefresh(store, network);
    refresh.resolve(json({ data: { ...credentials("renewed"), roles: [123] } }));
    await result;
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(network.requests).toHaveLength(2);
  });

  it("preserves credentials when the refresh request encounters a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: Request) => {
        if (request.url.endsWith("/auth/refresh")) throw new TypeError("Failed to fetch");
        return unauthorized();
      })
    );
    const store = createStore();
    expect((await probe(store)).error).toMatchObject({ status: "FETCH_ERROR" });
    expect(store.getState().auth.accessToken).toBe("old-access");
  });

  it("clears an expired session that has no refresh token without attempting refresh", async () => {
    const network = mockRequests();
    const store = createStore();
    store.dispatch(removeCredentials());
    store.dispatch(setCredentials({ ...credentials("legacy"), refreshToken: undefined }));
    const result = probe(store);
    (await network.next("/probe/one")).resolve(unauthorized());
    await result;
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(network.requests).toHaveLength(1);
  });
});
