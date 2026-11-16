import { describe, expect, it } from "vitest";
import type { PageResult } from "@/lib/api";
import type { MomentResponse } from "./moment-contracts";
import { reconcileMomentPage } from "./moment-pages";

const saved = {
  id: 1,
  content: "Edited",
  visibility: "public",
  topics: [{ id: 1, slug: "daily" }],
} as MomentResponse;
const page: PageResult<MomentResponse> = {
  list: [saved],
  total: 13,
  totalPages: 2,
  page: 2,
  size: 12,
};

describe("saved moment reconciliation", () => {
  it("replaces the same ID without moving it", () => {
    expect(reconcileMomentPage(page, { ...saved, content: "New" }).list[0].content).toBe("New");
  });
  it("does not insert an edit into pages that did not contain it", () => {
    expect(reconcileMomentPage(page, { ...saved, id: 2 })).toBe(page);
  });
  it("removes nonpublic results and reduces the last page count once", () => {
    const privateMoment = { ...saved, visibility: "private" as const };
    const next = reconcileMomentPage(page, privateMoment);
    expect(next).toMatchObject({ list: [], total: 12, totalPages: 1 });
    expect(reconcileMomentPage(next, privateMoment)).toBe(next);
  });
  it("removes an edit from old topics but retains it in matching ones", () => {
    expect(reconcileMomentPage(page, saved, { topic: "old" }).list).toEqual([]);
    expect(reconcileMomentPage(page, saved, { topic: "daily" }).list).toEqual([saved]);
  });
  it("retains private edits in admin results", () => {
    expect(
      reconcileMomentPage(page, { ...saved, visibility: "private" }, {}, false).list
    ).toHaveLength(1);
  });
});
