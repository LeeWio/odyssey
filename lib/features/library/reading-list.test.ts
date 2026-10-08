import { configureStore } from "@reduxjs/toolkit";
import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";

vi.hoisted(() => vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost"));
vi.mock("@/lib/toast", () => ({
  notifyMutation: async (request: Promise<unknown>) => {
    await request.catch(() => {});
  },
}));

import { baseApi } from "@/lib/api/base-api";
import { authSlice, setCredentials } from "../auth/auth-slice";
import { postApi } from "../post/post-api";
import { libraryApi } from "./library-api";

const response = (data: unknown) => Response.json({ code: 200, message: "OK", data });
const createStore = () =>
  configureStore({
    reducer: { auth: authSlice.reducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) => defaults().concat(baseApi.middleware),
  });
let store: ReturnType<typeof createStore>;
const article = (saved: boolean) => ({
  id: 123,
  title: "Reading list",
  slug: "reading-list",
  status: "PUBLISHED",
  isFeatured: false,
  views: 10,
  likesCount: 0,
  favoritesCount: 0,
  isInReadingList: saved,
  category: null,
  series: null,
  seriesOrder: null,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
});
const listQuery = postApi.endpoints.getPublicPosts;
const detailQuery = postApi.endpoints.getPublicPostBySlug;

beforeEach(() => {
  store = createStore();
  store.dispatch(
    setCredentials({ username: "reader", accessToken: "reader", roles: ["ROLE_USER"] })
  );
});
afterEach(() => {
  store.dispatch(baseApi.util.resetApiState());
  vi.unstubAllGlobals();
});
afterAll(() => vi.unstubAllEnvs());

it("refreshes subscribed article lists and details after both save and remove", async () => {
  let saved = false;
  const writes: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/library/reading-list/123")) {
        writes.push(request.method);
        saved = request.method === "PUT";
        return response(null);
      }
      if (url.pathname.endsWith("/posts/reading-list")) return response(article(saved));
      return response({ list: [article(saved)], page: 0, size: 8, total: 1, totalPages: 1 });
    })
  );
  await store.dispatch(listQuery.initiate({ size: 8 })).unwrap();
  await store.dispatch(detailQuery.initiate("reading-list")).unwrap();
  const expectSaved = async (value: boolean) =>
    vi.waitFor(() => {
      expect(listQuery.select({ size: 8 })(store.getState()).data?.list[0].isInReadingList).toBe(
        value
      );
      expect(detailQuery.select("reading-list")(store.getState()).data?.isInReadingList).toBe(
        value
      );
    });
  await store.dispatch(libraryApi.endpoints.addToReadingList.initiate(123)).unwrap();
  await expectSaved(true);
  await store.dispatch(libraryApi.endpoints.removeFromReadingList.initiate(123)).unwrap();
  await expectSaved(false);
  expect(writes).toEqual(["PUT", "DELETE"]);
});

it("retains article state and does not refetch on a failed save", async () => {
  let reads = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      if (request.method === "PUT")
        return Response.json({ message: "Unavailable" }, { status: 503 });
      reads += 1;
      return response(article(false));
    })
  );
  await store.dispatch(detailQuery.initiate("reading-list")).unwrap();
  await expect(
    store.dispatch(libraryApi.endpoints.addToReadingList.initiate(123)).unwrap()
  ).rejects.toBeDefined();
  expect(detailQuery.select("reading-list")(store.getState()).data?.isInReadingList).toBe(false);
  expect(reads).toBe(1);
});
