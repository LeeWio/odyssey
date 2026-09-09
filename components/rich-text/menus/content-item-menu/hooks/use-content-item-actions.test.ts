import type { Node } from "@tiptap/pm/model";
import type { JSONContent } from "@tiptap/react";
import { describe, expect, it } from "vitest";
import { canDuplicateNode } from "./use-content-item-actions";

function nodeFromJSON(content: JSONContent) {
  return { toJSON: () => content } as unknown as Node;
}

describe("canDuplicateNode", () => {
  it("rejects nodes with a transient upload id", () => {
    expect(
      canDuplicateNode(nodeFromJSON({ type: "image", attrs: { uploadId: "image-upload-1" } }))
    ).toBe(false);
  });

  it("rejects containers with a pending nested upload", () => {
    expect(
      canDuplicateNode(
        nodeFromJSON({
          type: "columns",
          content: [
            { type: "column", content: [{ type: "image", attrs: { uploadId: "pending" } }] },
          ],
        })
      )
    ).toBe(false);
  });

  it("allows persisted nodes without a transient upload", () => {
    expect(canDuplicateNode(nodeFromJSON({ type: "image", attrs: { src: "/image.png" } }))).toBe(
      true
    );
  });
});
