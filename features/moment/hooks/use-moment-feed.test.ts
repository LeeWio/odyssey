import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PageResult } from "@/lib/api";
import type { MomentResponse } from "@/lib/features/moment";
import { useMomentFeed } from "./use-moment-feed";

const mocks = vi.hoisted(() => ({
  loadPage: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/lib/features/moment", () => ({
  useGetPublicMomentsQuery: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: mocks.refetch,
  }),
  useLazyGetPublicMomentsQuery: () => [mocks.loadPage, { isFetching: false }],
}));

let root: Root;
let container: HTMLDivElement;
let feed: ReturnType<typeof useMomentFeed>;
let topic: string | undefined;
let period: { year: number; month: number } | undefined;
const moment = (id: number) => ({ id }) as MomentResponse;
const initial: PageResult<MomentResponse> = {
  list: [moment(3)],
  page: 0,
  size: 1,
  total: 3,
  totalPages: 3,
};

function Harness() {
  const value = useMomentFeed(1, initial, topic, period);
  useLayoutEffect(() => {
    feed = value;
  });
  return null;
}

async function render() {
  await act(async () => root.render(createElement(Harness)));
}

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.loadPage.mockReset();
  topic = undefined;
  period = undefined;
  container = document.createElement("div");
  root = createRoot(container);
  await render();
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

describe("moment pagination safety", () => {
  it("blocks duplicate calls before loading state renders and advances a page once", async () => {
    const response = Promise.withResolvers<PageResult<MomentResponse>>();
    mocks.loadPage.mockReturnValue({ unwrap: () => response.promise });
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    await act(async () => {
      first = feed.loadMore();
      second = feed.loadMore();
    });
    expect(mocks.loadPage).toHaveBeenCalledTimes(1);
    expect(await second).toBe(false);
    await act(async () => {
      response.resolve({ ...initial, page: 1, list: [moment(2)] });
      expect(await first).toBe(true);
    });
    expect(feed.moments.map(({ id }) => id)).toEqual([3, 2]);
    mocks.loadPage.mockReturnValue({
      unwrap: async () => ({ ...initial, page: 2, list: [moment(1)] }),
    });
    await act(async () => {
      await feed.loadMore();
    });
    expect(mocks.loadPage.mock.lastCall?.[0].page).toBe(2);
    expect(feed.hasMore).toBe(false);
  });

  it("returns failure without advancing so a retry requests the same page", async () => {
    mocks.loadPage.mockReturnValue({
      unwrap: async () => {
        throw new Error("Offline");
      },
    });
    await act(async () => {
      expect(await feed.loadMore()).toBe(false);
    });
    mocks.loadPage.mockReturnValue({
      unwrap: async () => ({ ...initial, page: 1, list: [moment(2)] }),
    });
    await act(async () => {
      expect(await feed.loadMore()).toBe(true);
    });
    expect(mocks.loadPage.mock.calls.map(([args]) => args.page)).toEqual([1, 1]);
  });

  it("ignores a page delivered after the topic has changed", async () => {
    const response = Promise.withResolvers<PageResult<MomentResponse>>();
    mocks.loadPage.mockReturnValue({ unwrap: () => response.promise });
    let pending!: Promise<boolean>;
    await act(async () => {
      pending = feed.loadMore();
    });
    topic = "design";
    await render();
    await act(async () => {
      response.resolve({ ...initial, page: 1, list: [moment(2)] });
      expect(await pending).toBe(false);
    });
    expect(feed.moments.map(({ id }) => id)).toEqual([3]);
  });

  it("resets pagination when a month filter changes", async () => {
    period = { year: 2026, month: 9 };
    await render();
    mocks.loadPage.mockReturnValue({
      unwrap: async () => ({ ...initial, page: 1, list: [moment(2)] }),
    });
    await act(async () => {
      await feed.loadMore();
    });
    period = { year: 2026, month: 10 };
    await render();
    await act(async () => {
      await feed.loadMore();
    });
    expect(mocks.loadPage.mock.calls.map(([args]) => [args.page, args.month])).toEqual([
      [1, 9],
      [1, 10],
    ]);
  });
});
