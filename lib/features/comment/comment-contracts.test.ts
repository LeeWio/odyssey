import { describe, expect, it } from "vitest";

import {
  CommentAnchorContextResponseSchema,
  CommentGovernanceOverviewResponseSchema,
  CommentPublishResponseSchema,
  CommentReportResponseSchema,
  CommentResponseSchema,
  CommentRiskResponseSchema,
  CommentStatusSchema,
} from "./comment-contracts";

const baseComment = {
  id: 1,
  content: "Hello Odyssey",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("CommentStatusSchema", () => {
  it("accepts known moderation statuses", () => {
    expect(CommentStatusSchema.parse("PENDING")).toBe("PENDING");
    expect(CommentStatusSchema.parse("APPROVED")).toBe("APPROVED");
    expect(CommentStatusSchema.parse("REJECTED")).toBe("REJECTED");
    expect(CommentStatusSchema.parse("SPAM")).toBe("SPAM");
  });
});

describe("CommentResponseSchema", () => {
  it("defaults interaction fields and empty children", () => {
    const parsed = CommentResponseSchema.parse(baseComment);
    expect(parsed.username).toBe("Anonymous");
    expect(parsed.avatar).toBe("");
    expect(parsed.likesCount).toBe(0);
    expect(parsed.reportsCount).toBe(0);
    expect(parsed.replyCount).toBe(0);
    expect(parsed.likedByCurrentUser).toBe(false);
    expect(parsed.authorUserId).toBeUndefined();
    expect(parsed.viewerCanEdit).toBeUndefined();
    expect(parsed.viewerCanDelete).toBeUndefined();
    expect(parsed.pinned).toBe(false);
    expect(parsed.featured).toBe(false);
    expect(parsed.deletedPlaceholder).toBe(false);
    expect(parsed.children).toEqual([]);
  });

  it("preserves authorship and capability fields when provided", () => {
    const parsed = CommentResponseSchema.parse({
      ...baseComment,
      authorUserId: 42,
      viewerCanEdit: true,
      viewerCanDelete: false,
    });
    expect(parsed.authorUserId).toBe(42);
    expect(parsed.viewerCanEdit).toBe(true);
    expect(parsed.viewerCanDelete).toBe(false);
  });

  it("preserves nested children recursively", () => {
    const parsed = CommentResponseSchema.parse({
      ...baseComment,
      likesCount: 3,
      likedByCurrentUser: true,
      children: [
        {
          id: 2,
          content: "Reply",
          createdAt: "2026-01-01T01:00:00Z",
          parentId: 1,
        },
      ],
    });

    expect(parsed.likesCount).toBe(3);
    expect(parsed.likedByCurrentUser).toBe(true);
    expect(parsed.children).toHaveLength(1);
    expect(parsed.children?.[0]?.id).toBe(2);
    expect(parsed.children?.[0]?.children).toEqual([]);
  });
});

describe("CommentPublishResponseSchema", () => {
  it("requires id and status from the publish endpoint", () => {
    expect(CommentPublishResponseSchema.parse({ id: 9, status: "PENDING" })).toEqual({
      id: 9,
      status: "PENDING",
    });
  });
});

describe("CommentAnchorContextResponseSchema", () => {
  it("parses root, target, and replies window", () => {
    const parsed = CommentAnchorContextResponseSchema.parse({
      rootCommentId: 1,
      rootComment: baseComment,
      targetComment: {
        id: 2,
        content: "Target",
        createdAt: "2026-01-01T01:00:00Z",
        parentId: 1,
      },
      repliesWindow: {
        list: [
          {
            id: 2,
            content: "Target",
            createdAt: "2026-01-01T01:00:00Z",
            parentId: 1,
          },
        ],
        total: 1,
        page: 0,
        size: 20,
        totalPages: 1,
      },
    });

    expect(parsed.rootCommentId).toBe(1);
    expect(parsed.targetComment.id).toBe(2);
    expect(parsed.repliesWindow.list).toHaveLength(1);
  });
});

describe("Comment governance schemas", () => {
  it("defaults overview counters to zero", () => {
    const parsed = CommentGovernanceOverviewResponseSchema.parse({});
    expect(parsed.totalComments).toBe(0);
    expect(parsed.openReports).toBe(0);
  });

  it("defaults report and risk optional fields", () => {
    const report = CommentReportResponseSchema.parse({});
    expect(report.status).toBe("OPEN");
    expect(report.reason).toBe("");

    const risk = CommentRiskResponseSchema.parse({ id: 9 });
    expect(risk.openReports).toBe(0);
    expect(risk.username).toBe("Anonymous");
  });
});
