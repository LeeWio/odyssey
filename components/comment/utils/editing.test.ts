import { describe, expect, it } from "vitest";
import { CommentResponseSchema } from "@/lib/features/comment";
import { reconcileCommentEdit } from "./editing";

const editedAt = "2026-09-20T00:00:00Z";
const comment = (id: number, fields: Record<string, unknown> = {}) =>
  CommentResponseSchema.parse({
    id,
    content: `Comment ${id}`,
    username: "author",
    createdAt: "2026-09-01T00:00:00Z",
    ...fields,
  });

describe("confirmed comment edits", () => {
  it("updates a nested reply while preserving siblings, counts, and the original tree", () => {
    const sibling = comment(3);
    const root = comment(1, { replyCount: 1, children: [comment(2, { parentId: 1 })] });
    const [updated, untouched] = reconcileCommentEdit([root, sibling], 2, "Corrected", editedAt);
    expect(updated.children?.[0]).toMatchObject({ id: 2, content: "Corrected", editedAt });
    expect(updated.replyCount).toBe(1);
    expect(updated.content).toBe("Comment 1");
    expect(untouched).toBe(sibling);
    expect(root.children?.[0].content).toBe("Comment 2");
  });

  it("preserves pending state and permissions while updating a flat row", () => {
    const pending = {
      ...comment(2, { parentId: 1, status: "PENDING", viewerCanEdit: true }),
      isPending: false,
      isFailed: false,
    };
    const [updated] = reconcileCommentEdit([pending], 2, "Corrected", editedAt);
    expect(updated).toEqual({ ...pending, content: "Corrected", editedAt });
    expect(pending.content).toBe("Comment 2");
  });

  it("does not overwrite a deletion that completed before the edit response", () => {
    const list = [comment(1, { content: "[deleted]", deletedPlaceholder: true })];
    expect(reconcileCommentEdit(list, 1, "Late edit", editedAt)).toBe(list);
  });

  it("preserves the original list when the edited comment is absent", () => {
    const list = [comment(1, { children: [comment(2)] })];
    expect(reconcileCommentEdit(list, 3, "Elsewhere", editedAt)).toBe(list);
  });
});
