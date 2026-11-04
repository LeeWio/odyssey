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
    page: 1,
    totalPages: 20,
    isLoading: false,
    isError: false,
    isFetchingPage: false,
    fetchPage: vi.fn(async () => null),
    onPageChange: vi.fn(),
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
    expect(options.fetchPage).not.toHaveBeenCalled();
  });

  it("waits for initial loading and avoids duplicate requests in StrictMode", async () => {
    const response = Promise.withResolvers<{ list: MomentResponse[] } | null>();
    const fetchPage = vi.fn(() => response.promise);
    await render({ isLoading: true, fetchPage });
    expect(fetchPage).not.toHaveBeenCalled();
    await render({ isLoading: false });
    await render();
    expect(fetchPage).toHaveBeenCalledTimes(1);
    await act(async () => response.resolve(null));
    expect(anchor.status).toBe("error");
  });

  it("stops fetching when a target arrives on the next page", async () => {
    const response = Promise.withResolvers<{ list: MomentResponse[] } | null>();
    const fetchPage = vi.fn(() => response.promise);
    await render({ moments: [moment(20)], fetchPage });
    await act(async () => response.resolve({ list: [moment(18)] }));
    expect(options.onPageChange).toHaveBeenCalledExactlyOnceWith(2);
    expect(document.getElementById("moment-20")).not.toBeNull();
    expect(document.getElementById("moment-18")).toBeNull();
    await render({ moments: [moment(18)], page: 2 });
    await flushFrames();
    expect(anchor.status).toBe("found");
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("does not scan for malformed hashes", async () => {
    await navigate("#moment-0");
    await render();
    expect(anchor.status).toBe("dismissed");
    expect(options.fetchPage).not.toHaveBeenCalled();
  });

  it("reports a missing target when the public feed ends", async () => {
    await render({ totalPages: 1 });
    await flushFrames();
    expect(anchor.status).toBe("missing");
    expect(options.fetchPage).not.toHaveBeenCalled();
  });

  it("stops on failure and retries only on explicit action", async () => {
    const fetchPage = vi.fn(async () => null);
    await render({ fetchPage });
    await render();
    expect(anchor.status).toBe("error");
    expect(fetchPage).toHaveBeenCalledTimes(1);
    await act(async () => anchor.retry());
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage.mock.calls).toEqual([[2], [2]]);
    expect(anchor.status).toBe("error");
  });

  it("bounds automatic pagination and lets the reader explicitly continue", async () => {
    const fetchPage = vi.fn(async () => ({ list: [] }));
    await render({ fetchPage });
    await flushFrames();
    expect(fetchPage).toHaveBeenCalledTimes(MOMENT_ANCHOR_PAGE_LIMIT);
    expect(anchor.status).toBe("paused");
    await act(async () => anchor.retry());
    await flushFrames();
    expect(fetchPage).toHaveBeenCalledTimes(MOMENT_ANCHOR_PAGE_LIMIT * 2);
    expect(anchor.status).toBe("paused");
  });

  it("respects cancellation while a page is in flight", async () => {
    const response = Promise.withResolvers<{ list: MomentResponse[] } | null>();
    const fetchPage = vi.fn(() => response.promise);
    await render({ fetchPage });
    await act(async () => anchor.dismiss());
    await act(async () => response.resolve({ list: [moment(18)] }));
    expect(anchor.status).toBe("dismissed");
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(options.onPageChange).not.toHaveBeenCalled();
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
