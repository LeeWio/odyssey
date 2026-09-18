import { describe, expect, it } from "vitest";

import { resolveCommentCapabilities } from "./permissions";

describe("resolveCommentCapabilities", () => {
  it("prefers viewerCan* flags from the API", () => {
    expect(
      resolveCommentCapabilities(
        {
          authorUserId: 1,
          username: "alice",
          nickname: "Alice",
          viewerCanEdit: true,
          viewerCanDelete: false,
          deletedPlaceholder: false,
        },
        { isAuthenticated: true, currentUserId: 99, currentUsername: "bob" }
      )
    ).toEqual({ canEdit: true, canDelete: false });
  });

  it("falls back to authorUserId when capability flags are absent", () => {
    expect(
      resolveCommentCapabilities(
        {
          authorUserId: 7,
          username: "alice",
          nickname: "Alice",
          deletedPlaceholder: false,
        },
        { isAuthenticated: true, currentUserId: 7, currentUsername: "alice" }
      )
    ).toEqual({ canEdit: true, canDelete: true });

    expect(
      resolveCommentCapabilities(
        {
          authorUserId: 7,
          username: "alice",
          nickname: "Alice",
          deletedPlaceholder: false,
        },
        { isAuthenticated: true, currentUserId: 8, currentUsername: "alice" }
      )
    ).toEqual({ canEdit: false, canDelete: false });
  });

  it("falls back to username/nickname only when authorUserId is missing", () => {
    expect(
      resolveCommentCapabilities(
        {
          authorUserId: null,
          username: "alice",
          nickname: "Alice",
          deletedPlaceholder: false,
        },
        { isAuthenticated: true, currentUserId: null, currentUsername: "Alice" }
      )
    ).toEqual({ canEdit: true, canDelete: true });
  });

  it("denies manage actions for deleted placeholders", () => {
    expect(
      resolveCommentCapabilities(
        {
          authorUserId: 1,
          username: "alice",
          nickname: "Alice",
          viewerCanEdit: true,
          viewerCanDelete: true,
          deletedPlaceholder: true,
        },
        { isAuthenticated: true, currentUserId: 1, currentUsername: "alice" }
      )
    ).toEqual({ canEdit: false, canDelete: false });
  });
});
