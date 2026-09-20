import { configureStore } from "@reduxjs/toolkit";
import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";

vi.hoisted(() => vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost"));
vi.mock("@/lib/toast", () => ({
  notifyMutation: async (request: Promise<unknown>) => {
    await request.catch(() => {});
  },
}));

import { baseApi } from "@/lib/api/base-api";
import { authSlice, setCredentials, setPermissions } from "../auth/auth-slice";
import { notificationApi } from "./notification-api";

const initial = {
  commentNotificationsEnabled: true,
  categoryPostNotificationsEnabled: true,
  systemNotificationsEnabled: true,
  commentEmailNotificationsEnabled: false,
  categoryPostEmailNotificationsEnabled: false,
  systemEmailNotificationsEnabled: false,
};
const response = (data: unknown) => Response.json({ code: 200, message: "OK", data });
const credentials = (username: string) => ({
  username,
  accessToken: username,
  roles: ["ROLE_USER"],
});
const createStore = () =>
  configureStore({
    reducer: { auth: authSlice.reducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) => defaults().concat(baseApi.middleware),
  });
let store: ReturnType<typeof createStore>;
const query = notificationApi.endpoints.getMyNotificationPreferences;
const mutation = notificationApi.endpoints.updateMyNotificationPreferences;
const cached = () => query.select()(store.getState());

beforeEach(() => {
  store = createStore();
  store.dispatch(setCredentials(credentials("first")));
});
afterEach(() => {
  store.dispatch(baseApi.util.resetApiState());
  vi.unstubAllGlobals();
});
afterAll(() => vi.unstubAllEnvs());

it("retains the canonical save response through permission updates and refresh failure", async () => {
  let updated = false;
  const submitted = { ...initial, commentEmailNotificationsEnabled: true };
  const accepted = { ...submitted, systemNotificationsEnabled: false };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      if (request.method === "PUT") {
        updated = true;
        store.dispatch(setPermissions(["notification:read"]));
        return response(accepted);
      }
      return updated
        ? Response.json({ message: "Unavailable" }, { status: 503 })
        : response(initial);
    })
  );
  await store.dispatch(query.initiate()).unwrap();
  await store.dispatch(mutation.initiate(submitted)).unwrap();
  await vi.waitFor(() => expect(cached().isError).toBe(true));
  expect(cached().data).toEqual(accepted);
});

it("does not patch a new session's cache with a previous session's save response", async () => {
  const savedResponse = Promise.withResolvers<Response>();
  const refreshResponse = Promise.withResolvers<Response>();
  const secondUser = { ...initial, systemEmailNotificationsEnabled: true };
  let reads = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn((request: Request) => {
      if (request.method === "PUT") return savedResponse.promise;
      reads += 1;
      return reads === 1
        ? Promise.resolve(response(initial))
        : reads === 2
          ? Promise.resolve(response(secondUser))
          : refreshResponse.promise;
    })
  );
  await store.dispatch(query.initiate()).unwrap();
  const pending = store.dispatch(
    mutation.initiate({ ...initial, commentEmailNotificationsEnabled: true })
  );
  store.dispatch(setCredentials(credentials("second")));
  await store.dispatch(query.initiate(undefined, { forceRefetch: true })).unwrap();
  try {
    savedResponse.resolve(response({ ...initial, commentEmailNotificationsEnabled: true }));
    await pending.unwrap();
    await vi.waitFor(() => expect(reads).toBe(3));
    expect(cached().data).toEqual(secondUser);
  } finally {
    refreshResponse.resolve(response(secondUser));
  }
});

it("leaves the cached settings and query untouched when saving fails", async () => {
  let reads = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      if (request.method === "PUT")
        return Response.json({ message: "Unavailable" }, { status: 503 });
      reads += 1;
      return response(initial);
    })
  );
  await store.dispatch(query.initiate()).unwrap();
  const result = await store.dispatch(
    mutation.initiate({ ...initial, commentEmailNotificationsEnabled: true })
  );
  expect(result.error).toBeDefined();
  expect(cached().data).toEqual(initial);
  expect(reads).toBe(1);
});
