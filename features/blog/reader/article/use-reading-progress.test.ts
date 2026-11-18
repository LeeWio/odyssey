import { toast } from "@heroui/react";
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useReadingProgress } from "./use-reading-progress";

const recordProgress = vi.hoisted(() => vi.fn());

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/features/library/library-api", () => ({
  useRecordReadingProgressMutation: () => [recordProgress],
}));

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

function Harness({
  enabled = true,
  postId,
  progress,
}: {
  enabled?: boolean;
  postId: number;
  progress: number;
}) {
  useReadingProgress({ enabled, postId, progress });
  return null;
}

function Switcher() {
  const [postId, setPostId] = useState(7);
  return createElement(
    "div",
    null,
    createElement("button", { onClick: () => setPostId(8), type: "button" }, "switch"),
    createElement(Harness, { postId, progress: 40 })
  );
}

describe("useReadingProgress", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    sessionStorage.clear();
    recordProgress.mockReset();
    vi.spyOn(toast, "danger").mockClear();
    recordProgress.mockImplementation(() => ({ unwrap: () => Promise.resolve({}) }));
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  async function render(node: ReturnType<typeof createElement>) {
    await act(async () => {
      root.render(node);
    });
  }

  it("submits a stored checkpoint before the current scroll step", async () => {
    sessionStorage.setItem(
      "odyssey_reading_progress",
      JSON.stringify({ postId: 7, progressPercent: 20, positionAnchor: "saved" })
    );
    const pending = deferred<unknown>();
    recordProgress.mockImplementationOnce(() => ({ unwrap: () => pending.promise }));

    await render(createElement(Harness, { postId: 7, progress: 44 }));

    expect(recordProgress).toHaveBeenCalledTimes(1);
    expect(recordProgress).toHaveBeenCalledWith({
      postId: 7,
      body: { progressPercent: 20, positionAnchor: "saved" },
    });

    await act(async () => {
      pending.resolve({});
      await pending.promise;
    });

    expect(recordProgress).toHaveBeenLastCalledWith({
      postId: 7,
      body: { progressPercent: 40 },
    });
  });

  it("keeps a failed checkpoint and retries it from the toast", async () => {
    const pending = deferred<unknown>();
    recordProgress.mockImplementation(() => ({ unwrap: () => pending.promise }));

    await render(createElement(Harness, { postId: 7, progress: 40 }));
    await act(async () => {
      pending.reject(new Error("offline"));
      await pending.promise.catch(() => undefined);
      await Promise.resolve();
    });

    expect(sessionStorage.getItem("odyssey_reading_progress")).toEqual(
      expect.stringContaining('"progressPercent":40')
    );
    expect(toast.danger).toHaveBeenCalledWith(
      "progressSaveFailed",
      expect.objectContaining({
        actionProps: expect.objectContaining({ children: "tryAgain" }),
      })
    );

    recordProgress.mockImplementation(() => ({ unwrap: () => Promise.resolve({}) }));
    const action = vi.mocked(toast.danger).mock.calls[0]?.[1] as {
      actionProps: { onPress: () => void };
    };

    await act(async () => {
      action.actionProps.onPress();
    });

    expect(sessionStorage.getItem("odyssey_reading_progress")).toBeNull();
  });

  it("drops a late response after the article changes", async () => {
    const pending = deferred<unknown>();
    recordProgress.mockImplementationOnce(() => ({ unwrap: () => pending.promise }));

    await render(createElement(Switcher));
    await act(async () => {
      host.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      pending.resolve({});
    });

    const saved = sessionStorage.getItem("odyssey_reading_progress") ?? "";
    expect(saved === "" || saved.includes('"postId":8')).toBe(true);
    expect(saved.includes('"postId":7')).toBe(false);
  });

  it("does not call the library endpoint for a guest", async () => {
    await render(createElement(Harness, { enabled: false, postId: 7, progress: 40 }));
    expect(recordProgress).not.toHaveBeenCalled();
  });
});
