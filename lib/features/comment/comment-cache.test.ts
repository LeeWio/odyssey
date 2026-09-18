import { describe, expect, it } from "vitest";

import type { CommentResponse } from "./comment-contracts";
import {
  applyInteractionOverrides,
  applyLikeToCommentList,
  applyLikeToCommentTree,
  nextLikePatch,
} from "./comment-cache";

function comment(
  overrides: Partial<CommentResponse> & Pick<CommentResponse, "id">
): CommentResponse {
  return {
    content: "c",
    createdAt: "2026-01-01T00:00:00Z",
    username: "a",
    nickname: "A",
    avatar: "",
    likesCount: 0,
    reportsCount: 0,
    replyCount: 0,
    likedByCurrentUser: false,
    pinned: false,
    featured: false,
    deletedPlaceholder: false,
    children: [],
    ...overrides,
  };
}

describe("applyLikeToCommentTree", () => {
  it("toggles like on a nested reply and adjusts count", () => {
    const root = comment({
      id: 1,
      children: [comment({ id: 2, likesCount: 4, likedByCurrentUser: false })],
    });

    expect(applyLikeToCommentTree(root, 2, true)).toBe(true);
    expect(root.children?.[0]?.likedByCurrentUser).toBe(true);
    expect(root.children?.[0]?.likesCount).toBe(5);

    expect(applyLikeToCommentTree(root, 2, false)).toBe(true);
    expect(root.children?.[0]?.likedByCurrentUser).toBe(false);
    expect(root.children?.[0]?.likesCount).toBe(4);
  });

  it("is a no-op when the like state already matches", () => {
    const root = comment({ id: 1, likesCount: 2, likedByCurrentUser: true });
    applyLikeToCommentTree(root, 1, true);
    expect(root.likesCount).toBe(2);
  });
});

describe("applyLikeToCommentList", () => {
  it("returns false for empty lists", () => {
    expect(applyLikeToCommentList(undefined, 1, true)).toBe(false);
    expect(applyLikeToCommentList([], 1, true)).toBe(false);
  });
});

describe("nextLikePatch", () => {
  it("computes the next like snapshot", () => {
    expect(nextLikePatch(false, 1, true)).toEqual({
      likedByCurrentUser: true,
      likesCount: 2,
    });
    expect(nextLikePatch(true, 1, false)).toEqual({
      likedByCurrentUser: false,
      likesCount: 0,
    });
  });
});

describe("applyInteractionOverrides", () => {
  it("applies overrides through nested children without dropping siblings", () => {
    const root = comment({
      id: 1,
      children: [comment({ id: 2, likesCount: 1 }), comment({ id: 3, likesCount: 0 })],
    });

    const patched = applyInteractionOverrides(root, {
      2: { likedByCurrentUser: true, likesCount: 9 },
    });

    expect(patched.children?.[0]).toMatchObject({
      id: 2,
      likedByCurrentUser: true,
      likesCount: 9,
    });
    expect(patched.children?.[1]?.id).toBe(3);
  });
});
