import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useMomentLike } from "./use-moment-like";

const mocks = vi.hoisted(() => ({
  authenticated: true,
  username: "reader",
  likedIds: [] as number[],
  dispatch: vi.fn(),
  like: vi.fn(),
  unlike: vi.fn(),
  query: vi.fn(),
}));
vi.mock("@/lib/hooks", () => ({
  useAppDispatch: () => mocks.dispatch,
  useAppSelector: (selector: () => unknown) => selector(),
}));
vi.mock("@/lib/features/auth", () => ({
  selectIsAuthenticated: () => mocks.authenticated,
  selectCurrentUser: () => mocks.username,
}));
vi.mock("@/lib/features/ui", () => ({
  setLoginOpen: (value: boolean) => ({ type: "login", payload: value }),
}));
vi.mock("@/lib/features/moment", () => ({
  useLikeMomentMutation: () => [mocks.like],
  useUnlikeMomentMutation: () => [mocks.unlike],
  useGetLikedMomentIdsQuery: (...args: unknown[]) => {
    mocks.query(...args);
    return { data: mocks.likedIds };
  },
}));
let root: Root;
let value: ReturnType<typeof useMomentLike>;
let options: { id?: number; count: number; known?: number[] };
function Harness() {
  const next = useMomentLike(options.id, options.count, options.known);
  useLayoutEffect(() => {
    value = next;
  });
  return null;
}
async function render(next: Partial<typeof options> = {}) {
  options = { ...options, ...next };
  await act(async () => root.render(createElement(Harness)));
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.authenticated = true;
  mocks.username = "reader";
  mocks.likedIds = [];
  vi.clearAllMocks();
  mocks.like.mockImplementation(() => ({ unwrap: () => Promise.resolve() }));
  mocks.unlike.mockImplementation(() => ({ unwrap: () => Promise.resolve() }));
  options = { id: 12, count: 8, known: [] };
  root = createRoot(document.createElement("div"));
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});
it("rejects guests and missing moments without sending writes", async () => {
  mocks.authenticated = false;
  await render();
  expect(value.toggleLike()).toBe(false);
  expect(mocks.dispatch).toHaveBeenCalledWith({ type: "login", payload: true });
  expect(mocks.like).not.toHaveBeenCalled();
  mocks.authenticated = true;
  await render({ id: undefined });
  expect(value.toggleLike()).toBe(false);
  expect(mocks.like).not.toHaveBeenCalled();
});
it("accepts synchronously, owns optimism and rejects same-tick duplicates", async () => {
  const response = Promise.withResolvers<void>();
  mocks.like.mockReturnValue({ unwrap: () => response.promise });
  await render();
  await act(async () => {
    expect(value.toggleLike()).toBe(true);
    expect(value.toggleLike()).toBe(false);
  });
  expect(value).toMatchObject({ isLiked: true, likesCount: 9, isLiking: true });
  expect(mocks.like).toHaveBeenCalledExactlyOnceWith(12);
  await act(async () => response.resolve());
  expect(value).toMatchObject({ isLiked: true, likesCount: 9, isLiking: false });
});
it("rolls back failed likes and permits retry", async () => {
  const response = Promise.withResolvers<void>();
  mocks.like.mockReturnValueOnce({ unwrap: () => response.promise });
  await render();
  await act(async () => {
    value.toggleLike();
  });
  await act(async () => response.reject(new Error("Offline")));
  expect(value).toMatchObject({ isLiked: false, likesCount: 8, isLiking: false });
  await act(async () => {
    expect(value.toggleLike()).toBe(true);
  });
  expect(value).toMatchObject({ isLiked: true, likesCount: 9 });
});
it("restores the last accepted state after a failed unlike, not the stale server baseline", async () => {
  await render();
  await act(async () => {
    value.toggleLike();
  });
  const response = Promise.withResolvers<void>();
  mocks.unlike.mockReturnValueOnce({ unwrap: () => response.promise });
  await act(async () => {
    value.toggleLike();
  });
  expect(value).toMatchObject({ isLiked: false, likesCount: 8 });
  await act(async () => response.reject(new Error("Offline")));
  expect(value).toMatchObject({ isLiked: true, likesCount: 9, isLiking: false });
});
it("uses batched IDs and never produces a negative count", async () => {
  await render({ count: 0, known: [12] });
  expect(mocks.query).toHaveBeenLastCalledWith([12], { skip: true });
  await act(async () => {
    value.toggleLike();
  });
  expect(value.likesCount).toBe(0);
  expect(mocks.unlike).toHaveBeenCalledExactlyOnceWith(12);
});
it("does not let a previous moment's failed request overwrite a new reaction", async () => {
  const first = Promise.withResolvers<void>();
  mocks.like.mockReturnValueOnce({ unwrap: () => first.promise });
  await render();
  await act(async () => {
    value.toggleLike();
  });
  await render({ id: 13, count: 20 });
  expect(value).toMatchObject({ isLiked: false, likesCount: 20, isLiking: false });
  await act(async () => {
    value.toggleLike();
  });
  await act(async () => first.reject(new Error("Offline")));
  expect(value).toMatchObject({ isLiked: true, likesCount: 21, isLiking: false });
});
it("does not reuse another account's optimistic state", async () => {
  await render();
  await act(async () => {
    value.toggleLike();
  });
  mocks.username = "another-reader";
  await render();
  expect(value).toMatchObject({ isLiked: false, likesCount: 8, isLiking: false });
});
