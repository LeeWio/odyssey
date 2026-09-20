import { describe, expect, it } from "vitest";
import { CommentResponseSchema } from "@/lib/features/comment";
import { reconcileCommentDeletion } from "./deletion";

const comment = (id: number, fields: Record<string, unknown> = {}) =>
  CommentResponseSchema.parse({
    id,
    content: `Comment ${id}`,
    username: "author",
    createdAt: "2026-09-01T00:00:00Z",
    ...fields,
  });

describe("confirmed comment deletion", () => {
  it("removes a leaf without mutating the original list or unrelated comments", () => {
    const first = comment(1);
    const second = comment(2);
    const list = [first, second];
    const result = reconcileCommentDeletion(list, 1);
    expect(result).toEqual([second]);
    expect(result[0]).toBe(second);
    expect(list).toEqual([first, second]);
  });

  it("retains a root placeholder and its nested replies", () => {
    const root = comment(1, {
      pinned: true,
      featured: true,
      viewerCanEdit: true,
      children: [comment(2, { parentId: 1 })],
    });
    const [result] = reconcileCommentDeletion([root], 1);
    expect(result).toMatchObject({
      content: "[deleted]",
      deletedPlaceholder: true,
      status: "APPROVED",
      pinned: false,
      featured: false,
      viewerCanEdit: false,
      viewerCanDelete: false,
    });
    expect(result.children).toBe(root.children);
    expect(root.deletedPlaceholder).toBe(false);
  });

  it("retains a placeholder for replies that are not loaded yet", () => {
    const [result] = reconcileCommentDeletion([comment(1, { replyCount: 3 })], 1);
    expect(result.deletedPlaceholder).toBe(true);
    expect(result.replyCount).toBe(3);
  });

  it("recognizes descendants in a flattened reply page", () => {
    const replies = [comment(2, { parentId: 1 }), comment(3, { parentId: 2 })];
    const result = reconcileCommentDeletion(replies, 2);
    expect(result).toHaveLength(2);
    expect(result[0].deletedPlaceholder).toBe(true);
    expect(result[1]).toBe(replies[1]);
  });

  it("removes a nested leaf and decrements only its direct parent's count", () => {
    const root = comment(1, {
      replyCount: 1,
      children: [
        comment(2, { parentId: 1, replyCount: 1, children: [comment(3, { parentId: 2 })] }),
      ],
    });
    const [result] = reconcileCommentDeletion([root], 3);
    expect(result.replyCount).toBe(1);
    expect(result.children?.[0].replyCount).toBe(0);
    expect(result.children?.[0].children).toEqual([]);
    expect(root.children?.[0].children).toHaveLength(1);
  });

  it("updates direct-parent counts in flat pages and never makes counts negative", () => {
    const replies = [comment(2, { parentId: 1, replyCount: 0 }), comment(3, { parentId: 2 })];
    const result = reconcileCommentDeletion(replies, 3);
    expect(result).toHaveLength(1);
    expect(result[0].replyCount).toBe(0);
  });

  it("keeps the list reference when the target is absent", () => {
    const list = [comment(1)];
    expect(reconcileCommentDeletion(list, 100)).toBe(list);
  });
});
