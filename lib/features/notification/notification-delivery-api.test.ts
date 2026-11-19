import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost"));

import { baseApi } from "@/lib/api/base-api";
import { authSlice, setCredentials } from "../auth/auth-slice";
import { notificationDeliveryApi } from "./notification-delivery-api";

const response = (data: unknown) => Response.json({ code: 200, message: "OK", data });
const createStore = () =>
  configureStore({
    reducer: { auth: authSlice.reducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) => defaults().concat(baseApi.middleware),
  });

describe("notification delivery overview API", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.dispatch(
      setCredentials({
        username: "admin",
        accessToken: "admin-token",
        roles: ["ROLE_ADMIN"],
      })
    );
  });

  afterEach(() => {
    store.dispatch(baseApi.util.resetApiState());
    vi.unstubAllGlobals();
  });

  it("parses delivery counts and sends the admin endpoint with credentials", async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      expect(request.url).toContain("/api/v1/admin/notifications/deliveries/overview");
      expect(request.headers.get("authorization")).toBe("Bearer admin-token");
      return response({
        counts: { QUEUED: 2, SENDING: 1, FAILED: 3, DELIVERED: 42, ABANDONED: 1 },
        pending: 3,
        overdue: 2,
        oldestPendingAt: "2026-10-09T08:00:00Z",
        observedAt: "2026-10-09T09:00:00Z",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await store.dispatch(
      notificationDeliveryApi.endpoints.getNotificationDeliveryOverview.initiate()
    );

    expect(result.data).toEqual({
      counts: { QUEUED: 2, SENDING: 1, FAILED: 3, DELIVERED: 42, ABANDONED: 1 },
      pending: 3,
      overdue: 2,
      oldestPendingAt: "2026-10-09T08:00:00Z",
      observedAt: "2026-10-09T09:00:00Z",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects malformed operational data instead of rendering partial status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response({
          counts: { QUEUED: "two" },
          pending: 1,
          overdue: 0,
          oldestPendingAt: null,
          observedAt: "2026-10-09T09:00:00Z",
        })
      )
    );

    const result = await store.dispatch(
      notificationDeliveryApi.endpoints.getNotificationDeliveryOverview.initiate()
    );

    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });
});

describe("notification delivery operations API", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.dispatch(
      setCredentials({
        username: "admin",
        accessToken: "admin-token",
        roles: ["ROLE_ADMIN"],
      })
    );
  });

  afterEach(() => {
    store.dispatch(baseApi.util.resetApiState());
    vi.unstubAllGlobals();
  });

  it("loads a filtered page and retries with the audited request payload", async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      if (request.method === "GET") {
        return response({
          list: [
            {
              id: 7,
              notificationId: 4,
              channel: "EMAIL",
              status: "FAILED",
              attempts: 2,
              maxAttempts: 5,
              lastError: "timeout",
              nextAttemptAt: null,
              deliveredAt: null,
              createdAt: "2026-10-09T08:00:00Z",
              retryable: true,
              context: null,
            },
          ],
          total: 1,
          page: 1,
          size: 20,
          totalPages: 1,
        });
      }
      expect(request.url).toContain("/api/v1/admin/notifications/deliveries/7/retry");
      expect(await request.json()).toEqual({
        requestId: "00000000-0000-0000-0000-000000000007",
        reason: "Operator verified the provider is available.",
      });
      return response({
        id: 7,
        notificationId: 4,
        channel: "EMAIL",
        status: "QUEUED",
        attempts: 2,
        maxAttempts: 5,
        lastError: null,
        nextAttemptAt: "2026-10-09T08:01:00Z",
        deliveredAt: null,
        createdAt: "2026-10-09T08:00:00Z",
        retryable: false,
        context: null,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const page = await store.dispatch(
      notificationDeliveryApi.endpoints.listNotificationDeliveries.initiate({
        page: 0,
        status: "FAILED",
      })
    );
    expect(page.data?.list[0]?.status).toBe("FAILED");

    const retry = await store.dispatch(
      notificationDeliveryApi.endpoints.retryNotificationDelivery.initiate({
        id: 7,
        requestId: "00000000-0000-0000-0000-000000000007",
        reason: "Operator verified the provider is available.",
      })
    );
    expect(retry.data?.status).toBe("QUEUED");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
