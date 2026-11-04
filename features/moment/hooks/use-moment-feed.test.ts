import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PageResult } from "@/lib/api";
import type { MomentResponse } from "@/lib/features/moment";
import { useMomentFeed } from "./use-moment-feed";

const mocks = vi.hoisted(() => ({
  loadPage: vi.fn(),
  refetch: vi.fn(),
  query: {
    data: undefined as PageResult<MomentResponse> | undefined,
    currentData: undefined as PageResult<MomentResponse> | undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
  },
}));

vi.mock("@/lib/features/moment", () => ({
  useGetPublicMomentsQuery: () => ({
    ...mocks.query,
    refetch: mocks.refetch,
  }),
  useLazyGetPublicMomentsQuery: () => [mocks.loadPage, { isFetching: false }],
}));

let root: Root;
let container: HTMLDivElement;
let feed: ReturnType<typeof useMomentFeed>;
let topic: string | undefined;
let period: { year: number; month: number } | undefined;
let retainPreviousData = true;
const moment = (id: number) => ({ id }) as MomentResponse;
const initial: PageResult<MomentResponse> = {
  list: [moment(3)],
  page: 0,
  size: 1,
  total: 3,
  totalPages: 3,
};

function Harness() {
  const value = useMomentFeed(1, initial, topic, period, { retainPreviousData });
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
  Object.assign(mocks.query, {
    data: undefined,
    currentData: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
  });
  topic = undefined;
  period = undefined;
  retainPreviousData = true;
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
    mocks.query.currentData = initial;
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

  it("keeps the complete old feed while a different topic is loading", async () => {
    mocks.loadPage.mockReturnValue({
      unwrap: async () => ({ ...initial, page: 1, list: [moment(2)] }),
    });
    await act(async () => {
      await feed.loadMore();
    });
    const key = feed.displayKey;
    topic = "design";
    mocks.query.data = initial;
    mocks.query.isFetching = true;
    await render();
    expect(feed.moments.map(({ id }) => id)).toEqual([3, 2]);
    expect(feed.displayKey).toBe(key);
    expect(feed.isLoading).toBe(false);
    expect(feed.isRefreshing).toBe(true);
    expect(await feed.loadMore()).toBe(false);
    expect(mocks.loadPage).toHaveBeenCalledTimes(1);

    mocks.query.currentData = { ...initial, list: [moment(10)] };
    mocks.query.isFetching = false;
    await render();
    expect(feed.moments.map(({ id }) => id)).toEqual([10]);
    expect(feed.displayKey).not.toBe(key);
    expect(feed.isRefreshing).toBe(false);
    await act(async () => {
      await feed.loadMore();
    });
    expect(mocks.loadPage.mock.lastCall?.[0]).toMatchObject({ page: 1, topic: "design" });
  });

  it("retains readable content on a filter error and accepts an empty retry result", async () => {
    topic = "design";
    mocks.query.isError = true;
    await render();
    expect(feed.moments.map(({ id }) => id)).toEqual([3]);
    expect(feed.isError).toBe(false);
    expect(feed.isRefreshError).toBe(true);
    mocks.query.isError = false;
    mocks.query.currentData = { ...initial, list: [], total: 0, totalPages: 0 };
    await render();
    expect(feed.moments).toEqual([]);
    expect(feed.isRefreshError).toBe(false);
    expect(feed.hasMore).toBe(false);
  });

  it("does not fall back to unfiltered server data on a filtered first visit", async () => {
    topic = "design";
    mocks.query.data = initial;
    mocks.query.isFetching = true;
    mocks.query.isLoading = true;
    await act(async () => root.render(createElement(Harness, { key: "filtered-first-visit" })));
    expect(feed.moments).toEqual([]);
    expect(feed.isLoading).toBe(true);
  });

  it("returns to the server-provided unfiltered feed without another request", async () => {
    topic = "design";
    mocks.query.currentData = { ...initial, list: [moment(10)] };
    await render();
    expect(feed.moments.map(({ id }) => id)).toEqual([10]);
    topic = undefined;
    mocks.query.currentData = undefined;
    await render();
    expect(feed.moments.map(({ id }) => id)).toEqual([3]);
    expect(feed.isLoading).toBe(false);
    expect(feed.isRefreshing).toBe(false);
  });

  it("removes a successfully deleted entry even when the feed came from SSR", async () => {
    await act(async () => feed.removeMoment(3));
    expect(feed.moments).toEqual([]);
    await render();
    expect(feed.moments).toEqual([]);
    topic = "design";
    mocks.query.currentData = { ...initial, list: [moment(3), moment(10)] };
    await render();
    expect(feed.moments.map(({ id }) => id)).toEqual([10]);
  });

  it("keeps other hook consumers on the normal loading and error states", async () => {
    retainPreviousData = false;
    topic = "design";
    mocks.query.isFetching = true;
    await render();
    expect(feed.moments).toEqual([]);
    expect(feed.isLoading).toBe(true);
    mocks.query.isFetching = false;
    mocks.query.isError = true;
    await render();
    expect(feed.isError).toBe(true);
    expect(feed.isRefreshError).toBe(false);
  });
});
