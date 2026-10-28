import { act, createElement, StrictMode, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MomentResponse } from "@/lib/features/moment";
import { getMomentAnchorId, MOMENT_ANCHOR_PAGE_LIMIT, useMomentAnchor } from "./use-moment-anchor";

type Options = Parameters<typeof useMomentAnchor>[0];
let root: Root;
let container: HTMLDivElement;
let options: Options;
let anchor: ReturnType<typeof useMomentAnchor>;
let frames: Map<number, FrameRequestCallback>;
let frameId: number;
const moment = (id: number) => ({ id }) as MomentResponse;

function Harness() {
  const value = useMomentAnchor(options);
  useLayoutEffect(() => {
    anchor = value;
  });
  return createElement(
    "div",
    null,
    ...options.moments.map(({ id }) =>
      createElement("div", { key: id, id: `moment-${id}`, tabIndex: -1 })
    )
  );
}

async function render(next: Partial<Options> = {}) {
  options = { ...options, ...next };
  await act(async () => root.render(createElement(StrictMode, null, createElement(Harness))));
}

async function flushFrames() {
  await act(async () => {
    const queued = [...frames.values()];
    frames.clear();
    queued.forEach((callback) => callback(0));
  });
}

async function navigate(hash: string) {
  await act(async () => {
    window.history.replaceState(null, "", `/moments${hash}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  frames = new Map();
  frameId = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.spyOn(Element.prototype, "scrollIntoView")
    .mockClear()
    .mockImplementation(() => {});
  window.history.replaceState(null, "", "/moments#moment-18");
  options = {
    moments: [],
    hasMore: true,
    isLoading: false,
    isError: false,
    isFetchingMore: false,
    loadMore: vi.fn(async () => false),
  };
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("moment anchor parsing", () => {
  it("accepts only positive, safe integer moment IDs", () => {
    expect(getMomentAnchorId("#moment-18")).toBe(18);
    for (const hash of [
      "",
      "#comment-18",
      "#moment-0",
      "#moment--1",
      "#moment-01",
      "#moment-1.5",
      "#moment-9007199254740992",
      "#moment-18extra",
    ]) {
      expect(getMomentAnchorId(hash)).toBeNull();
    }
  });
});

describe("moment anchor navigation", () => {
  it("focuses an existing target once and does not pull readers back on feed updates", async () => {
    await render({ moments: [moment(18)] });
    await flushFrames();
    expect(anchor.status).toBe("found");
    expect(document.activeElement?.id).toBe("moment-18");
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledExactlyOnceWith({
      behavior: "instant",
      block: "start",
    });
    await render({ moments: [moment(18), moment(17)] });
    await flushFrames();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(options.loadMore).not.toHaveBeenCalled();
  });

  it("waits for initial loading and avoids duplicate requests in StrictMode", async () => {
    const response = Promise.withResolvers<boolean>();
    const loadMore = vi.fn(() => response.promise);
    await render({ isLoading: true, loadMore });
    expect(loadMore).not.toHaveBeenCalled();
    await render({ isLoading: false });
    await render();
    expect(loadMore).toHaveBeenCalledTimes(1);
    await act(async () => response.resolve(false));
    expect(anchor.status).toBe("error");
  });

  it("stops fetching when a target arrives on the next page", async () => {
    const response = Promise.withResolvers<boolean>();
    const loadMore = vi.fn(() => response.promise);
    await render({ moments: [moment(20)], loadMore });
    await render({ moments: [moment(20), moment(18)] });
    await act(async () => response.resolve(true));
    await flushFrames();
    expect(anchor.status).toBe("found");
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("does not scan for malformed hashes", async () => {
    await navigate("#moment-0");
    await render();
    expect(anchor.status).toBe("dismissed");
    expect(options.loadMore).not.toHaveBeenCalled();
  });

  it("reports a missing target when the public feed ends", async () => {
    await render({ hasMore: false });
    await flushFrames();
    expect(anchor.status).toBe("missing");
    expect(options.loadMore).not.toHaveBeenCalled();
  });

  it("stops on failure and retries only on explicit action", async () => {
    const loadMore = vi.fn(async () => false);
    await render({ loadMore });
    await render();
    expect(anchor.status).toBe("error");
    expect(loadMore).toHaveBeenCalledTimes(1);
    await act(async () => anchor.retry());
    expect(loadMore).toHaveBeenCalledTimes(2);
    expect(anchor.status).toBe("error");
  });

  it("bounds automatic pagination and lets the reader explicitly continue", async () => {
    const loadMore = vi.fn(async () => true);
    await render({ loadMore });
    await flushFrames();
    expect(loadMore).toHaveBeenCalledTimes(MOMENT_ANCHOR_PAGE_LIMIT);
    expect(anchor.status).toBe("paused");
    await act(async () => anchor.retry());
    await flushFrames();
    expect(loadMore).toHaveBeenCalledTimes(MOMENT_ANCHOR_PAGE_LIMIT * 2);
    expect(anchor.status).toBe("paused");
  });

  it("respects cancellation while a page is in flight", async () => {
    const response = Promise.withResolvers<boolean>();
    const loadMore = vi.fn(() => response.promise);
    await render({ loadMore });
    await act(async () => anchor.dismiss());
    await act(async () => response.resolve(true));
    expect(anchor.status).toBe("dismissed");
    expect(loadMore).toHaveBeenCalledTimes(1);
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("responds to hash changes and revisiting the same target", async () => {
    await render({ moments: [moment(18), moment(19)] });
    await flushFrames();
    await navigate("#moment-19");
    await flushFrames();
    expect(document.activeElement?.id).toBe("moment-19");
    await navigate("");
    expect(anchor.status).toBe("dismissed");
    await navigate("#moment-19");
    await flushFrames();
    expect(anchor.status).toBe("found");
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(3);
  });

  it("cancels scheduled focus when navigating away before the next frame", async () => {
    await render({ moments: [moment(18)] });
    await navigate("");
    await flushFrames();
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
