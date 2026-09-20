import { act, createElement, StrictMode, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCommentDraft } from "./use-comment-draft";

const storageKey = (thread = "post:1", replyId: number | null = null) =>
  `odyssey:comment-draft:${thread}:${replyId === null ? "root" : `reply-${replyId}`}`;

let root: Root;
let container: HTMLDivElement;
let draft: ReturnType<typeof useCommentDraft>;

function Harness({ thread, replyId }: { thread: string; replyId: number | null }) {
  const value = useCommentDraft(thread, replyId);
  useLayoutEffect(() => {
    draft = value;
  });
  return createElement("output", null, value[0]);
}

async function render(thread = "post:1", replyId: number | null = null) {
  await act(async () => {
    root.render(createElement(StrictMode, null, createElement(Harness, { thread, replyId })));
  });
}

async function hydrate() {
  await act(async () => {
    vi.runOnlyPendingTimers();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("comment drafts", () => {
  it("restores saved content after hydration", async () => {
    localStorage.setItem(storageKey(), "Saved comment");
    await render();
    expect(draft[0]).toBe("");
    expect(draft[3]).toBe(false);
    await hydrate();
    expect(draft[0]).toBe("Saved comment");
    expect(draft[3]).toBe(true);
  });

  it("isolates post, moment, guestbook, and reply drafts while switching context", async () => {
    const targets = [
      ["post:1", null],
      ["post:2", null],
      ["moment:1", null],
      ["guestbook", null],
      ["post:1", 42],
      ["post:1", 43],
    ] as const;
    for (const [thread, replyId] of targets) {
      const value = `${thread}/${replyId}`;
      localStorage.setItem(storageKey(thread, replyId), value);
      await render(thread, replyId);
      expect(draft[0]).toBe("");
      expect(draft[3]).toBe(false);
      await hydrate();
      expect(draft[0]).toBe(value);
      await act(async () => draft[1](`Edited ${value}`));
    }
    for (const [thread, replyId] of targets) {
      await render(thread, replyId);
      await hydrate();
      expect(draft[0]).toBe(`Edited ${thread}/${replyId}`);
      expect(localStorage.getItem(storageKey(thread, replyId))).toBe(draft[0]);
    }
  });

  it("does not overwrite typing that happens before hydration", async () => {
    localStorage.setItem(storageKey(), "Stale saved text");
    await render();
    await act(async () => draft[1]("New typing"));
    await hydrate();
    expect(draft[0]).toBe("New typing");
    expect(localStorage.getItem(storageKey())).toBe("New typing");
  });

  it("does not resurrect a draft cleared before hydration", async () => {
    localStorage.setItem(storageKey(), "Stale saved text");
    await render();
    await act(async () => {
      draft[2]();
    });
    await hydrate();
    expect(draft[0]).toBe("");
    expect(localStorage.getItem(storageKey())).toBeNull();
  });

  it("ignores hydration scheduled for a previous thread", async () => {
    localStorage.setItem(storageKey(), "First thread");
    localStorage.setItem(storageKey("post:2"), "Second thread");
    await render();
    await render("post:2");
    await hydrate();
    expect(draft[0]).toBe("Second thread");
  });

  it("keeps editing available when storage access is blocked", async () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    await render();
    await hydrate();
    expect(draft[3]).toBe(true);
    await act(async () => draft[1]("Unsaved but editable"));
    expect(draft[0]).toBe("Unsaved but editable");
    await render("post:2");
    await hydrate();
    await render();
    expect(draft[0]).toBe("Unsaved but editable");
    await act(async () => {
      draft[2]();
    });
    expect(draft[0]).toBe("");
  });

  it("preserves in-memory edits when the storage quota is exhausted", async () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    await render();
    await hydrate();
    await act(async () => draft[1]("Keep this text"));
    expect(draft[0]).toBe("Keep this text");
  });

  it("clears the visible draft even if removing its stored copy fails", async () => {
    await render();
    await hydrate();
    await act(async () => draft[1]("Submitted"));
    vi.spyOn(localStorage, "removeItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    await act(async () => {
      expect(draft[2]("Submitted")).toBe(true);
    });
    expect(draft[0]).toBe("");
  });

  it("only clears submitted text if the user has not edited it since sending", async () => {
    await render();
    await hydrate();
    await act(async () => draft[1]("First comment"));
    const clearSubmittedDraft = draft[2];
    await act(async () => draft[1]("Next comment"));
    await act(async () => {
      expect(clearSubmittedDraft("First comment")).toBe(false);
    });
    expect(draft[0]).toBe("Next comment");
    expect(localStorage.getItem(storageKey())).toBe("Next comment");
    await act(async () => {
      expect(clearSubmittedDraft("Next comment")).toBe(true);
    });
    expect(draft[0]).toBe("");
    expect(localStorage.getItem(storageKey())).toBeNull();
  });

  it("clears a completed submission in its original thread without changing the active draft", async () => {
    await render();
    await hydrate();
    await act(async () => draft[1]("First comment"));
    const clearFirst = draft[2];
    await render("post:2");
    await hydrate();
    await act(async () => draft[1]("Second comment"));
    await act(async () => {
      expect(clearFirst("First comment")).toBe(true);
    });
    expect(draft[0]).toBe("Second comment");
    expect(localStorage.getItem(storageKey())).toBeNull();
    expect(localStorage.getItem(storageKey("post:2"))).toBe("Second comment");
  });

  it("keeps whitespace while editing but removes empty drafts from storage", async () => {
    await render();
    await hydrate();
    await act(async () => draft[1]("  Text\n"));
    expect(localStorage.getItem(storageKey())).toBe("  Text\n");
    await act(async () => draft[1](" \n"));
    expect(draft[0]).toBe(" \n");
    expect(localStorage.getItem(storageKey())).toBeNull();
  });
});
