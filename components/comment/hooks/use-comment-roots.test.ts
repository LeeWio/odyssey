import { configureStore } from "@reduxjs/toolkit";
import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Provider, type ProviderProps } from "react-redux";
import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";

vi.hoisted(() => vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost"));

import { baseApi } from "@/lib/api/base-api";
import { authSlice } from "@/lib/features/auth/auth-slice";
import { CommentResponseSchema } from "@/lib/features/comment";
import type { SortOrder } from "../context/comment-context";
import { useCommentRoots } from "./use-comment-roots";

const createStore = () =>
  configureStore({
    reducer: { auth: authSlice.reducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) => defaults().concat(baseApi.middleware),
  });

let store: ReturnType<typeof createStore>;
let root: Root;
let roots: ReturnType<typeof useCommentRoots>;

function Harness({ postId, sortOrder }: { postId: number; sortOrder: SortOrder }) {
  const value = useCommentRoots({
    postId,
    momentId: 0,
    isGuestbook: false,
    isMoment: false,
    sortOrder,
  });
  useLayoutEffect(() => {
    roots = value;
  });
  return null;
}

async function render(postId: number, sortOrder: SortOrder = "newest") {
  await act(async () => {
    // Provider's type requires children in props; createElement supplies them below.
    root.render(
      createElement(
        Provider,
        { store } as ProviderProps,
        createElement(Harness, { postId, sortOrder })
      )
    );
  });
}

const response = (id: number, total: number, nextCursor: number | null) =>
  Response.json({
    code: 200,
    message: "OK",
    data: {
      list: [{ id, content: `Post ${id}`, username: "reader", createdAt: "2026-09-01T00:00:00Z" }],
      nextCursor,
      hasMore: nextCursor !== null,
      total,
      page: 0,
      size: 20,
      totalPages: 1,
    },
  });

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  store = createStore();
  root = createRoot(document.createElement("div"));
});

it("reconciles edits across stored sorts in the originating thread after switching targets", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(response(100, 1, null)))
  );
  const stored = CommentResponseSchema.parse({
    id: 90,
    content: "Older comment",
    username: "reader",
    createdAt: "2026-09-01T00:00:00Z",
  });
  await render(1);
  await act(async () => roots.prependRoots([stored]));
  await render(1, "oldest");
  await act(async () => roots.ensureRoot(stored));
  const editOriginalThread = roots.editStoredComment;

  await render(2);
  // Reuse the id to make accidental writes to the active thread observable.
  await act(async () => roots.prependRoots([stored]));
  await act(async () => editOriginalThread(90, "Corrected", "2026-09-20T00:00:00Z"));
  expect(roots.rawCommentsList.find((comment) => comment.id === 90)?.content).toBe("Older comment");

  for (const sort of ["newest", "oldest"] as const) {
    await render(1, sort);
    expect(roots.rawCommentsList.find((comment) => comment.id === 90)).toMatchObject({
      content: "Corrected",
      editedAt: "2026-09-20T00:00:00Z",
    });
  }
});

afterEach(async () => {
  await act(async () => root.unmount());
  store.dispatch(baseApi.util.resetApiState());
  vi.unstubAllGlobals();
});
afterAll(() => vi.unstubAllEnvs());

it("does not expose the previous post's comments, count, or cursor while the next post loads", async () => {
  const nextPost = Promise.withResolvers<Response>();
  const fetch = vi.fn((request: Request) =>
    request.url.includes("/post/1/") ? Promise.resolve(response(100, 40, 90)) : nextPost.promise
  );
  vi.stubGlobal("fetch", fetch);
  await render(1);
  await vi.waitFor(async () => {
    await act(async () => {});
    expect(roots.rawCommentsList.map((comment) => comment.id)).toEqual([100]);
  });
  expect(roots.remoteTotal).toBe(40);
  expect(roots.hasMore).toBe(true);

  await render(2);
  expect(roots.rawCommentsList).toEqual([]);
  expect(roots.remoteTotal).toBeUndefined();
  expect(roots.newestSeenId).toBeUndefined();
  expect(roots.hasMore).toBe(false);
  expect(roots.isLoading).toBe(true);
  await act(async () => {
    await roots.loadMore();
  });
  expect(
    fetch.mock.calls.every(([request]) => !new URL(request.url).searchParams.has("cursor"))
  ).toBe(true);

  await act(async () => {
    nextPost.resolve(response(200, 1, null));
  });
  await vi.waitFor(async () => {
    await act(async () => {});
    expect(roots.rawCommentsList.map((comment) => comment.id)).toEqual([200]);
  });
  expect(roots.remoteTotal).toBe(1);
  expect(roots.isLoading).toBe(false);
});
