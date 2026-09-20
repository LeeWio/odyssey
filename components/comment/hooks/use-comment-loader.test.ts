import { toast } from "@heroui/react";
import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCommentLoader } from "./use-comment-loader";

let root: Root;
let container: HTMLDivElement;
let loader: ReturnType<typeof useCommentLoader>;

function Harness() {
  const value = useCommentLoader();
  useLayoutEffect(() => {
    loader = value;
  });
  return null;
}

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(toast, "danger");
  container = document.createElement("div");
  root = createRoot(container);
  await act(async () => root.render(createElement(Harness)));
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("comment loading", () => {
  it("blocks duplicate events before the loading state has rendered", async () => {
    const response = Promise.withResolvers<void>();
    const load = vi.fn(() => response.promise);
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    await act(async () => {
      first = loader.run("post:1:newest", load, "Failed");
      second = loader.run("post:1:newest", load, "Failed");
    });
    expect(load).toHaveBeenCalledTimes(1);
    expect(await second).toBe(false);
    expect(loader.pendingKeys.has("post:1:newest")).toBe(true);
    await act(async () => {
      response.resolve();
      await first;
    });
    expect(await first).toBe(true);
    expect(loader.pendingKeys.size).toBe(0);
  });

  it("keeps other threads and sorts independent while a request finishes", async () => {
    const firstResponse = Promise.withResolvers<void>();
    const secondResponse = Promise.withResolvers<void>();
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    await act(async () => {
      first = loader.run("post:1:newest", () => firstResponse.promise, "Failed");
      second = loader.run("post:1:oldest", () => secondResponse.promise, "Failed");
    });
    expect(loader.pendingKeys.size).toBe(2);
    await act(async () => {
      firstResponse.resolve();
      await first;
    });
    expect([...loader.pendingKeys]).toEqual(["post:1:oldest"]);
    await act(async () => {
      secondResponse.resolve();
      await second;
    });
    expect(loader.pendingKeys.size).toBe(0);
  });

  it("handles rejection and releases the request lock for a retry", async () => {
    let success!: boolean;
    await act(async () => {
      success = await loader.run(
        "guestbook",
        () => Promise.reject(new Error("Offline")),
        "Try again"
      );
    });
    expect(success).toBe(false);
    expect(toast.danger).toHaveBeenCalledExactlyOnceWith("Try again");
    expect(loader.pendingKeys.size).toBe(0);
    await act(async () => {
      success = await loader.run("guestbook", async () => {}, "Try again");
    });
    expect(success).toBe(true);
    expect(toast.danger).toHaveBeenCalledTimes(1);
  });

  it("also releases the lock when starting a request throws synchronously", async () => {
    await act(async () => {
      expect(
        await loader.run(
          "post:1:reply-2",
          () => {
            throw new Error("Failed to start");
          },
          "Try again"
        )
      ).toBe(false);
    });
    expect(loader.pendingKeys.size).toBe(0);
    expect(toast.danger).toHaveBeenCalledExactlyOnceWith("Try again");
  });
});
