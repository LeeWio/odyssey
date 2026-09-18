import { describe, expect, it } from "vitest";

import type { CommentResponse } from "@/lib/features/comment";
import type { EnhancedComment } from "../types";
import {
  findRootIndexForComment,
  flattenReplies,
  getCommentDisplayName,
  mergePendingIntoRoots,
  nextCursorFromCommentIds,
  normalizeCommentTree,
  pageResultHasMore,
  sortCommentRoots,
} from "./thread";

function makeComment(
  overrides: Partial<CommentResponse> & Pick<CommentResponse, "id" | "content" | "createdAt">
): CommentResponse {
  return {
    username: "alice",
    nickname: "Alice",
    avatar: "",
    likesCount: 0,
    reportsCount: 0,
    replyCount: 0,
    likedByCurrentUser: false,
    pinned: false,
    featured: false,
    deletedPlaceholder: false,
    parentId: null,
    children: [],
    ...overrides,
  };
}

function asEnhanced(comment: CommentResponse, extra?: Partial<EnhancedComment>): EnhancedComment {
  return {
    ...normalizeCommentTree(comment, { postId: 1 }),
    ...extra,
  };
}

describe("getCommentDisplayName", () => {
  it("prefers nickname then username then Anonymous", () => {
    expect(getCommentDisplayName({ nickname: "Nick", username: "user" })).toBe("Nick");
    expect(getCommentDisplayName({ nickname: null, username: "user" })).toBe("user");
    expect(getCommentDisplayName({ nickname: null, username: null })).toBe("Anonymous");
  });
});

describe("normalizeCommentTree", () => {
  it("defaults optional fields and sorts children by createdAt ascending", () => {
    const root = makeComment({
      id: 1,
      content: "root",
      createdAt: "2026-01-02T00:00:00Z",
      children: [
        makeComment({
          id: 3,
          content: "later",
          createdAt: "2026-01-02T02:00:00Z",
          parentId: 1,
        }),
        makeComment({
          id: 2,
          content: "earlier",
          createdAt: "2026-01-02T01:00:00Z",
          parentId: 1,
        }),
      ],
    });

    const normalized = normalizeCommentTree(root, { postId: 99 });
    expect(normalized.postId).toBe(99);
    expect(normalized.status).toBe("APPROVED");
    expect(normalized.children.map((child) => child.id)).toEqual([2, 3]);
  });

  it("merges lazy reply pages without duplicating embedded children", () => {
    const root = makeComment({
      id: 1,
      content: "root",
      createdAt: "2026-01-01T00:00:00Z",
      children: [
        makeComment({
          id: 2,
          content: "embedded",
          createdAt: "2026-01-01T01:00:00Z",
          parentId: 1,
        }),
      ],
    });

    const normalized = normalizeCommentTree(root, {
      postId: 1,
      replyPages: {
        1: {
          comments: [
            makeComment({
              id: 2,
              content: "embedded-dup",
              createdAt: "2026-01-01T01:00:00Z",
              parentId: 1,
            }),
            makeComment({
              id: 4,
              content: "lazy",
              createdAt: "2026-01-01T03:00:00Z",
              parentId: 1,
            }),
          ],
        },
      },
    });

    expect(normalized.children.map((child) => child.id)).toEqual([2, 4]);
    expect(normalized.children[0]?.content).toBe("embedded");
  });
});

describe("sortCommentRoots", () => {
  const roots = [
    asEnhanced(
      makeComment({
        id: 1,
        content: "a",
        createdAt: "2026-01-01T00:00:00Z",
        likesCount: 1,
      })
    ),
    asEnhanced(
      makeComment({
        id: 2,
        content: "b",
        createdAt: "2026-01-03T00:00:00Z",
        likesCount: 5,
        pinned: true,
      })
    ),
    asEnhanced(
      makeComment({
        id: 3,
        content: "c",
        createdAt: "2026-01-02T00:00:00Z",
        likesCount: 9,
        featured: true,
      })
    ),
  ];

  it("sorts by newest and oldest timestamps", () => {
    expect(sortCommentRoots(roots, "newest").map((c) => c.id)).toEqual([2, 3, 1]);
    expect(sortCommentRoots(roots, "oldest").map((c) => c.id)).toEqual([1, 3, 2]);
  });

  it("sorts likes by pinned then featured then likesCount", () => {
    expect(sortCommentRoots(roots, "likes").map((c) => c.id)).toEqual([2, 3, 1]);
  });
});

describe("mergePendingIntoRoots", () => {
  it("keeps pending roots until the server id appears, and injects pending replies", () => {
    const serverRoot = asEnhanced(
      makeComment({
        id: 10,
        content: "server",
        createdAt: "2026-01-01T00:00:00Z",
      })
    );
    const pendingRoot = asEnhanced(
      makeComment({
        id: -1,
        content: "pending root",
        createdAt: "2026-01-02T00:00:00Z",
      }),
      { isPending: true }
    );
    const pendingReply = asEnhanced(
      makeComment({
        id: -2,
        content: "pending reply",
        createdAt: "2026-01-01T01:00:00Z",
        parentId: 10,
      }),
      { isPending: true, parentId: 10 }
    );

    const merged = mergePendingIntoRoots([serverRoot], [pendingRoot, pendingReply], "newest");

    expect(merged.map((c) => c.id)).toEqual([-1, 10]);
    expect(merged[1]?.children.map((c) => c.id)).toEqual([-2]);
  });

  it("drops reconciled pending roots once the server list contains the same id", () => {
    const serverRoot = asEnhanced(
      makeComment({
        id: 42,
        content: "live",
        createdAt: "2026-01-01T00:00:00Z",
        status: "APPROVED",
      })
    );
    const reconciled = asEnhanced(
      makeComment({
        id: 42,
        content: "live",
        createdAt: "2026-01-01T00:00:00Z",
      })
    );

    const merged = mergePendingIntoRoots([serverRoot], [reconciled], "newest");
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe(42);
  });

  it("drops a submitted temp pending row when the server returns the same body", () => {
    const serverRoot = asEnhanced(
      makeComment({
        id: 99,
        content: "Hello Odyssey",
        createdAt: "2026-01-01T00:00:00Z",
        username: "alice",
        status: "APPROVED",
      })
    );
    const orphanedTemp = asEnhanced(
      makeComment({
        id: -5,
        content: "Hello Odyssey",
        createdAt: "2026-01-01T00:00:00Z",
        username: "alice",
        status: "PENDING",
      }),
      { isPending: false }
    );

    const merged = mergePendingIntoRoots([serverRoot], [orphanedTemp], "newest");
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe(99);
    expect(merged[0]?.status).toBe("APPROVED");
  });
});

describe("flattenReplies", () => {
  it("flattens nested children into reply rows with parent display names", () => {
    const root = asEnhanced(
      makeComment({
        id: 1,
        content: "root",
        createdAt: "2026-01-01T00:00:00Z",
        nickname: "Root",
        children: [
          makeComment({
            id: 2,
            content: "child",
            createdAt: "2026-01-01T01:00:00Z",
            parentId: 1,
            nickname: "Child",
            children: [
              makeComment({
                id: 3,
                content: "grandchild",
                createdAt: "2026-01-01T02:00:00Z",
                parentId: 2,
                nickname: "Grand",
              }),
            ],
          }),
        ],
      })
    );

    expect(flattenReplies(root)).toEqual([
      { comment: expect.objectContaining({ id: 2 }), replyTo: "Root", replyToId: 1 },
      { comment: expect.objectContaining({ id: 3 }), replyTo: "Child", replyToId: 2 },
    ]);
  });
});

describe("pageResultHasMore", () => {
  it("treats Nexus page numbers as 1-based", () => {
    expect(pageResultHasMore(1, 2)).toBe(true);
    expect(pageResultHasMore(2, 2)).toBe(false);
    expect(pageResultHasMore(1, 1)).toBe(false);
  });
});

describe("nextCursorFromCommentIds", () => {
  it("returns the max id for ascending cursor continuation", () => {
    expect(nextCursorFromCommentIds([{ id: 3 }, { id: 9 }, { id: 4 }])).toBe(9);
    expect(nextCursorFromCommentIds([])).toBeNull();
  });
});

describe("findRootIndexForComment", () => {
  it("finds the root that contains a nested comment id", () => {
    const roots = [
      asEnhanced(
        makeComment({
          id: 1,
          content: "a",
          createdAt: "2026-01-01T00:00:00Z",
        })
      ),
      asEnhanced(
        makeComment({
          id: 2,
          content: "b",
          createdAt: "2026-01-02T00:00:00Z",
          children: [
            makeComment({
              id: 9,
              content: "nested",
              createdAt: "2026-01-02T01:00:00Z",
              parentId: 2,
            }),
          ],
        })
      ),
    ];

    expect(findRootIndexForComment(roots, 9)).toBe(1);
    expect(findRootIndexForComment(roots, 1)).toBe(0);
    expect(findRootIndexForComment(roots, 404)).toBe(-1);
    expect(findRootIndexForComment(roots, null)).toBe(-1);
  });
});
