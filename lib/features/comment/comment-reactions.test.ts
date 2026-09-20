import { configureStore } from "@reduxjs/toolkit";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost"));

import { baseApi } from "@/lib/api/base-api";
import { authSlice } from "../auth/auth-slice";
import { commentApi } from "./comment-api";
import { CommentResponseSchema } from "./comment-contracts";

const createStore = () =>
  configureStore({
    reducer: { auth: authSlice.reducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) => defaults().concat(baseApi.middleware),
  });
let store: ReturnType<typeof createStore>;
const args = { momentId: 1 };

async function seedCaches(liked: boolean) {
  const list = [100, 101].map((id) =>
    CommentResponseSchema.parse({
      id,
      content: `Comment ${id}`,
      username: "reader",
      createdAt: "2026-09-01T00:00:00Z",
      likedByCurrentUser: liked,
      likesCount: 4,
    })
  );
  const page = { list, total: 2, page: 0, size: 20, totalPages: 1 };
  const cursor = { list, total: 2, nextCursor: null, hasMore: false };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      const path = new URL(request.url).pathname;
      const data = path.endsWith("/cursor") || path.endsWith("/new") ? cursor : page;
      return Response.json({ code: 200, message: "OK", data });
    })
  );
  await Promise.all([
    store.dispatch(commentApi.endpoints.getMomentCommentRoots.initiate(args)).unwrap(),
    store.dispatch(commentApi.endpoints.getHotMomentCommentRoots.initiate(args)).unwrap(),
    store.dispatch(commentApi.endpoints.getMomentCommentRootsCursor.initiate(args)).unwrap(),
    store.dispatch(commentApi.endpoints.getNewMomentCommentRoots.initiate(args)).unwrap(),
  ]);
}

function cachedComments() {
  const state = store.getState();
  return [
    commentApi.endpoints.getMomentCommentRoots.select(args)(state).data!.list,
    commentApi.endpoints.getHotMomentCommentRoots.select(args)(state).data!.list,
    commentApi.endpoints.getMomentCommentRootsCursor.select(args)(state).data!.list,
    commentApi.endpoints.getNewMomentCommentRoots.select(args)(state).data!.list,
  ];
}

beforeEach(() => {
  store = createStore();
});
afterEach(() => {
  store.dispatch(baseApi.util.resetApiState());
  vi.unstubAllGlobals();
});
afterAll(() => vi.unstubAllEnvs());

describe.each([true, false])("moment comment reactions (liked=%s)", (liked) => {
  it("updates all moment lists optimistically and reconciles the server count", async () => {
    await seedCaches(!liked);
    const response = Promise.withResolvers<Response>();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => response.promise)
    );
    const mutation = store.dispatch(
      (liked ? commentApi.endpoints.likeComment : commentApi.endpoints.unlikeComment).initiate(100)
    );
    try {
      for (const list of cachedComments()) {
        expect(list[0]).toMatchObject({ likedByCurrentUser: liked, likesCount: liked ? 5 : 3 });
        expect(list[1]).toMatchObject({ likedByCurrentUser: !liked, likesCount: 4 });
      }
    } finally {
      response.resolve(
        Response.json({ code: 200, message: "OK", data: { commentId: 100, liked, likesCount: 12 } })
      );
      await mutation.unwrap();
    }
    for (const list of cachedComments()) {
      expect(list[0]).toMatchObject({ likedByCurrentUser: liked, likesCount: 12 });
      expect(list[1]).toMatchObject({ likedByCurrentUser: !liked, likesCount: 4 });
    }
  });

  it("rolls back every moment list when the request fails", async () => {
    await seedCaches(!liked);
    const response = Promise.withResolvers<Response>();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => response.promise)
    );
    const mutation = store.dispatch(
      (liked ? commentApi.endpoints.likeComment : commentApi.endpoints.unlikeComment).initiate(100)
    );
    response.resolve(Response.json({ message: "Unavailable" }, { status: 503 }));
    await mutation;
    for (const list of cachedComments()) {
      expect(list[0]).toMatchObject({ likedByCurrentUser: !liked, likesCount: 4 });
      expect(list[1]).toMatchObject({ likedByCurrentUser: !liked, likesCount: 4 });
    }
  });
});
