import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PageResult } from "@/lib/api";
import type { MomentResponse } from "@/lib/features/moment";
import { useMomentFeed } from "./use-moment-feed";

const mocks = vi.hoisted(() => ({
  loadPage: vi.fn(),
  refetch: vi.fn(),
  queryArgs: vi.fn(),
  query: {
    currentData: undefined as PageResult<MomentResponse> | undefined,
    isFetching: false,
    isError: false,
  },
}));

vi.mock("@/lib/features/moment", () => ({
  useGetPublicMomentsQuery: (...args: unknown[]) => {
    mocks.queryArgs(...args);
    return {
      ...mocks.query,
      isLoading: !mocks.query.currentData && mocks.query.isFetching,
      refetch: mocks.refetch,
    };
  },
  useLazyGetPublicMomentsQuery: () => [mocks.loadPage, { isFetching: false }],
}));

let root: Root;
let feed: ReturnType<typeof useMomentFeed>;
let requestedPage = 1;
let topic: string | undefined;
let initialPage: PageResult<MomentResponse> | null;
const moment = (id: number) =>
  ({ id, content: `Moment ${id}`, visibility: "public", topics: [] }) as unknown as MomentResponse;
const page = (currentPage: number, ids: number[]): PageResult<MomentResponse> => ({
  list: ids.map(moment),
  page: currentPage,
  size: 2,
  total: 4,
  totalPages: 2,
});
const initial = page(1, [4, 3]);

function Harness() {
  const value = useMomentFeed(
    2,
    initialPage,
    topic,
    undefined,
    { retainPreviousData: true },
    requestedPage
  );
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
  requestedPage = 1;
  topic = undefined;
  initialPage = initial;
  mocks.loadPage.mockReset();
  mocks.query.currentData = undefined;
  mocks.query.isFetching = false;
  mocks.query.isError = false;
  root = createRoot(document.createElement("div"));
  await render();
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

describe("moment pagination", () => {
  it("renders only the requested page and exposes its total page count", () => {
    expect(feed.moments.map(({ id }) => id)).toEqual([4, 3]);
    expect(feed.currentPage).toBe(1);
    expect(feed.totalPages).toBe(2);
  });

  it("requests a one-based page using the API's zero-based parameter", async () => {
    mocks.loadPage.mockReturnValue({ unwrap: async () => page(2, [2, 1]) });

    await act(async () => {
      expect(await feed.fetchPage(2)).toEqual(page(2, [2, 1]));
    });

    expect(mocks.loadPage).toHaveBeenCalledWith({ page: 1, size: 2 });
    expect(feed.moments.map(({ id }) => id)).toEqual([4, 3]);
  });

  it("blocks duplicate requests for the same page", async () => {
    const response = Promise.withResolvers<PageResult<MomentResponse>>();
    mocks.loadPage.mockReturnValue({ unwrap: () => response.promise });
    let first!: Promise<unknown>;
    let second!: Promise<unknown>;

    await act(async () => {
      first = feed.fetchPage(2);
      second = feed.fetchPage(2);
    });
    expect(mocks.loadPage).toHaveBeenCalledTimes(1);
    await act(async () => response.resolve(page(2, [2, 1])));
    expect(await first).toEqual(page(2, [2, 1]));
    expect(await second).toEqual(page(2, [2, 1]));
  });

  it("replaces the old page after the URL page changes", async () => {
    requestedPage = 2;
    mocks.query.isFetching = true;
    await render();
    expect(feed.moments.map(({ id }) => id)).toEqual([4, 3]);
    expect(feed.isRefreshing).toBe(true);
    expect(feed.displayedPage).toBe(1);
    expect(mocks.queryArgs.mock.lastCall?.[0]).toEqual({ page: 1, size: 2 });

    requestedPage = 2;
    mocks.query.currentData = page(2, [2, 1]);
    mocks.query.isFetching = false;
    await render();

    expect(feed.moments.map(({ id }) => id)).toEqual([2, 1]);
    expect(feed.moments).toHaveLength(2);
    expect(feed.currentPage).toBe(2);
  });

  it("keeps the previous page readable on failure and retries the requested page", async () => {
    requestedPage = 2;
    mocks.query.isError = true;
    await render();
    expect(feed.moments.map(({ id }) => id)).toEqual([4, 3]);
    expect(feed.isError).toBe(false);
    expect(feed.isRefreshError).toBe(true);
    feed.refetch();
    expect(mocks.refetch).toHaveBeenCalled();
    mocks.query.isError = false;
    mocks.query.currentData = page(2, [2, 1]);
    await render();
    expect(feed.moments.map(({ id }) => id)).toEqual([2, 1]);
    expect(feed.isRefreshError).toBe(false);
  });

  it("replaces rather than remounting the old page while a topic is pending", async () => {
    const displayKey = feed.displayKey;
    topic = "design";
    mocks.query.isFetching = true;
    await render();
    expect(feed.displayKey).toBe(displayKey);
    expect(feed.moments.map(({ id }) => id)).toEqual([4, 3]);
    expect(feed.isRefreshing).toBe(true);
    mocks.query.currentData = page(1, [10]);
    mocks.query.isFetching = false;
    await render();
    expect(feed.displayKey).not.toBe(displayKey);
    expect(feed.moments.map(({ id }) => id)).toEqual([10]);
  });

  it("ignores background lookup responses from an old topic", async () => {
    const response = Promise.withResolvers<PageResult<MomentResponse>>();
    mocks.loadPage.mockReturnValue({ unwrap: () => response.promise });
    let pending!: ReturnType<typeof feed.fetchPage>;
    await act(async () => {
      pending = feed.fetchPage(2);
    });
    topic = "design";
    await render();
    await act(async () => response.resolve(page(2, [2, 1])));
    expect(await pending).toBeNull();
    expect(feed.moments.map(({ id }) => id)).toEqual([4, 3]);
  });

  it("allows retrying SSR data without calling refetch on an unstarted query", async () => {
    expect(mocks.queryArgs.mock.lastCall?.[1]).toEqual({ skip: true });
    await act(async () => feed.refetch());
    expect(mocks.queryArgs.mock.lastCall?.[1]).toEqual({ skip: false });
  });

  it("uses the matching SSR page on a direct second-page visit", async () => {
    requestedPage = 2;
    initialPage = page(2, [2, 1]);
    await act(async () => root.render(createElement(Harness, { key: "second-page" })));
    expect(feed.moments.map(({ id }) => id)).toEqual([2, 1]);
    expect(feed.isLoading).toBe(false);
    expect(mocks.queryArgs.mock.lastCall?.[1]).toEqual({ skip: true });
  });

  it("keeps a deleted moment removed from the current page", async () => {
    act(() => feed.removeMoment(4));
    expect(feed.moments.map(({ id }) => id)).toEqual([3]);
  });

  it("applies a saved response to SSR content without changing the display key", async () => {
    const key = feed.displayKey;
    const saved = { ...moment(4), content: "Updated from server" };
    await act(async () => feed.updateMoment(saved));
    expect(feed.moments[0]).toEqual(saved);
    expect(feed.displayKey).toBe(key);
    expect(mocks.queryArgs.mock.lastCall?.[1]).toEqual({ skip: false });
    await render();
    expect(feed.moments[0].content).toBe("Updated from server");
  });

  it("removes a newly private SSR moment and corrects totals", async () => {
    await act(async () => feed.updateMoment({ ...moment(4), visibility: "private" }));
    expect(feed.moments.map(({ id }) => id)).toEqual([3]);
    expect(feed.total).toBe(3);
    expect(feed.totalPages).toBe(2);
  });

  it("keeps an active query's edit visible until authoritative revalidation arrives", async () => {
    mocks.query.currentData = initial;
    await render();
    await act(async () => feed.updateMoment({ ...moment(4), content: "Saved edit" }));
    expect(feed.moments[0].content).toBe("Saved edit");
    mocks.query.currentData = {
      ...initial,
      list: [{ ...moment(4), content: "Revalidated edit" }, moment(3)],
    };
    await render();
    expect(feed.moments[0].content).toBe("Revalidated edit");
  });

  it("removes edits that leave the active topic and normalizes an empty last page", async () => {
    topic = "design";
    requestedPage = 2;
    initialPage = {
      ...page(2, [2]),
      total: 3,
      list: [{ ...moment(2), topics: [{ id: 1, slug: "design" }] }],
    };
    await act(async () => root.render(createElement(Harness, { key: "topic-page" })));
    await act(async () => feed.updateMoment({ ...moment(2), topics: [] }));
    expect(feed.moments).toEqual([]);
    expect(feed.resolvedTotalPages).toBe(1);
    expect(feed.total).toBe(2);
  });
});
