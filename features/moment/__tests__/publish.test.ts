import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MomentResponse } from "@/lib/features/moment";
import { useMomentPublish } from "../hooks/use-moment-publish";

const api = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), upload: vi.fn() }));
vi.mock("@/lib/features/moment", () => ({
  useCreateMomentMutation: () => [api.create],
  useUpdateMomentMutation: () => [api.update],
}));
vi.mock("@/lib/features/file/file-api", () => ({ useUploadFileMutation: () => [api.upload] }));

const original: MomentResponse = {
  id: 42,
  content: "Existing text",
  visibility: "followers",
  stockSymbol: "AAPL",
  likesCount: 7,
  createdAt: "2026-09-16",
  updatedAt: "2026-09-16",
  topics: [{ id: 1, slug: "research" }],
  images: [
    {
      id: 9,
      fileId: 90,
      originalName: "photo.jpg",
      fileUrl: "https://media.example/photo.jpg",
      thumbnailUrl: null,
      width: 800,
      height: 600,
      altText: "A photo",
      sortOrder: 0,
    },
  ],
};
let root: ReturnType<typeof createRoot> | undefined;
let state: ReturnType<typeof useMomentPublish>;
function setup(moment?: MomentResponse) {
  const success = vi.fn();
  function Harness() {
    state = useMomentPublish(success, moment);
    return null;
  }
  const container = document.createElement("div");
  root = createRoot(container);
  // Avoid JSX so this test follows the repository's .test.ts convention.
  act(() => root!.render(createElement(Harness)));
  return success;
}

beforeEach(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));

afterEach(() => {
  act(() => root?.unmount());
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("moment publishing", () => {
  it("edits the selected ID and preserves attachments, topics, visibility and stock", async () => {
    api.update.mockReturnValue({ unwrap: () => Promise.resolve() });
    const success = setup(original);
    expect(state.editorValue?.content?.[0].content?.[0].text).toBe("Existing text");
    await act(async () => state.publishMoment());
    expect(api.create).not.toHaveBeenCalled();
    expect(api.update).toHaveBeenCalledWith({
      id: 42,
      body: expect.objectContaining({
        visibility: "followers",
        stockSymbol: "AAPL",
        topicSlugs: ["research"],
        images: [{ fileId: 90, altText: "A photo" }],
      }),
    });
    expect(success).toHaveBeenCalledOnce();
  });

  it("removes only the selected existing image without uploading it again", async () => {
    api.update.mockReturnValue({ unwrap: () => Promise.resolve() });
    setup(original);
    act(() => state.removeExistingImage(0));
    await act(async () => state.publishMoment());
    expect(api.update.mock.calls[0][0].body.images).toEqual([]);
    expect(api.upload).not.toHaveBeenCalled();
  });

  it("retains the draft and keeps the dialog open on failure", async () => {
    api.update.mockReturnValue({ unwrap: () => Promise.reject(new Error("Unavailable")) });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const success = setup(original);
    await act(async () => state.publishMoment());
    expect(success).not.toHaveBeenCalled();
    expect(state.existingImages).toEqual(original.images);
    expect(state.isSubmitting).toBe(false);
    log.mockRestore();
  });

  it("creates a new moment without invoking update", async () => {
    api.create.mockReturnValue({ unwrap: () => Promise.resolve() });
    setup();
    act(() => state.setAttachedStockSymbol("AAPL"));
    await act(async () => state.publishMoment());
    expect(api.create).toHaveBeenCalledOnce();
    expect(api.update).not.toHaveBeenCalled();
  });
});
