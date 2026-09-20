import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MomentResponse } from "@/lib/features/moment";
import { useMomentPublish } from "../hooks/use-moment-publish";
import { MOMENT_MAX_IMAGES } from "../utils/media-limits";

const api = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), upload: vi.fn() }));
const toast = vi.hoisted(() => ({
  warning: vi.fn(),
  danger: vi.fn(),
  success: vi.fn(),
}));

vi.mock("@/lib/features/moment", () => ({
  useCreateMomentMutation: () => [api.create],
  useUpdateMomentMutation: () => [api.update],
}));
vi.mock("@/lib/features/file/file-api", () => ({ useUploadFileMutation: () => [api.upload] }));
vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual<typeof import("@heroui/react")>("@heroui/react");
  return { ...actual, toast };
});

const original: MomentResponse = {
  id: 42,
  content: "Existing text",
  visibility: "followers",
  stockSymbol: "AAPL",
  likesCount: 7,
  commentsCount: 0,
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
  act(() => root!.render(createElement(Harness)));
  return success;
}

function makeFile(name: string, type: string, size = 1024) {
  const file = new File(["x".repeat(Math.min(size, 16))], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function asFileList(files: File[]) {
  return {
    ...Object.fromEntries(files.map((file, index) => [String(index), file])),
    length: files.length,
    item: (index: number) => files[index] ?? null,
    [Symbol.iterator]: function* () {
      yield* files;
    },
  } as unknown as FileList;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:preview"),
    revokeObjectURL: vi.fn(),
  });
  api.upload.mockImplementation(() => ({
    abort: vi.fn(),
    unwrap: () => Promise.resolve({ id: 91 }),
  }));
});

afterEach(() => {
  act(() => root?.unmount());
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("moment publishing", () => {
  it("counts hard breaks consistently with Tiptap CharacterCount when opening an edit", () => {
    setup({
      ...original,
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "A" },
              { type: "hardBreak" },
              { type: "text", text: "B" },
            ],
          },
        ],
      }),
    });
    expect(state.charCount).toBe(3);
    expect(state.isEmpty).toBe(false);
  });

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
    act(() => state.removeMedia(state.mediaItems[0].id));
    await act(async () => state.publishMoment());
    expect(api.update.mock.calls[0][0].body.images).toEqual([]);
    expect(api.upload).not.toHaveBeenCalled();
  });

  it("uploads selected images eagerly and reuses their file IDs on publish", async () => {
    api.update.mockReturnValue({ unwrap: () => Promise.resolve() });
    setup(original);
    const file = makeFile("extra.webp", "image/webp");
    await act(async () => {
      state.handleSelectFiles(asFileList([file]));
    });
    expect(api.upload).toHaveBeenCalledOnce();
    expect(state.mediaItems.at(-1)).toMatchObject({
      kind: "local",
      status: "complete",
      fileId: 91,
      altText: "extra",
    });

    await act(async () => state.publishMoment());
    expect(api.upload).toHaveBeenCalledOnce();
    expect(api.update.mock.calls[0][0].body.images).toEqual([
      { fileId: 90, altText: "A photo" },
      { fileId: 91, altText: "extra" },
    ]);
  });

  it("blocks publish while uploads are incomplete or alt text is missing", async () => {
    let resolveUpload: ((value: { id: number }) => void) | undefined;
    api.upload.mockImplementation(() => ({
      abort: vi.fn(),
      unwrap: () =>
        new Promise<{ id: number }>((resolve) => {
          resolveUpload = resolve;
        }),
    }));
    api.update.mockReturnValue({ unwrap: () => Promise.resolve() });
    setup(original);
    const file = makeFile("pending.webp", "image/webp");
    await act(async () => {
      state.handleSelectFiles(asFileList([file]));
    });
    expect(state.hasIncompleteUploads).toBe(true);
    await act(async () => state.publishMoment());
    expect(api.update).not.toHaveBeenCalled();

    await act(async () => {
      resolveUpload?.({ id: 91 });
    });
    expect(state.hasIncompleteUploads).toBe(false);

    act(() => state.updateMediaAlt(state.mediaItems.at(-1)!.id, "   "));
    expect(state.hasMissingAlt).toBe(true);
    await act(async () => state.publishMoment());
    expect(api.update).not.toHaveBeenCalled();

    act(() => state.updateMediaAlt(state.mediaItems.at(-1)!.id, "Pending shot"));
    await act(async () => state.publishMoment());
    expect(api.update).toHaveBeenCalledOnce();
  });

  it("rejects unsupported types, oversized files, and overflow beyond the image cap", () => {
    setup(original);
    const badType = makeFile("notes.txt", "text/plain");
    const tooBig = makeFile("huge.webp", "image/webp", 11 * 1024 * 1024);
    act(() => state.handleSelectFiles(asFileList([badType, tooBig])));
    expect(state.mediaItems).toHaveLength(1);
    expect(toast.danger).toHaveBeenCalled();

    const fillers = Array.from({ length: MOMENT_MAX_IMAGES }, (_, index) =>
      makeFile(`ok-${index}.png`, "image/png")
    );
    act(() => state.handleSelectFiles(asFileList(fillers)));
    expect(state.mediaItems.length).toBe(MOMENT_MAX_IMAGES);
    expect(toast.warning).toHaveBeenCalled();
  });

  it("retains the draft and keeps the dialog open on failure", async () => {
    api.update.mockReturnValue({ unwrap: () => Promise.reject(new Error("Unavailable")) });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const success = setup(original);
    await act(async () => state.publishMoment());
    expect(success).not.toHaveBeenCalled();
    expect(state.mediaItems).toHaveLength(1);
    expect(state.mediaItems[0]).toMatchObject({ kind: "existing", fileId: 90 });
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
