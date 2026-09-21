import { act, createElement, StrictMode, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useReadingSession } from "./use-reading-session";

const key = "odyssey-reading-session";
const savedSession = {
  articleId: 1,
  articleTitle: "First essay",
  elapsedSeconds: 10,
  isRunning: false,
  lastResumedAt: null,
  targetSeconds: 60,
  version: 1,
};
let root: Root;
let state: ReturnType<typeof useReadingSession>;

function Harness({ articleId }: { articleId: number }) {
  const value = useReadingSession({
    articleId,
    articleTitle: `Essay ${articleId}`,
    estimatedMinutes: 1,
  });
  useLayoutEffect(() => {
    state = value;
  });
  return null;
}

async function render(articleId = 1) {
  await act(async () => {
    root.render(createElement(StrictMode, null, createElement(Harness, { articleId })));
  });
}

async function advance(milliseconds: number) {
  await act(async () => {
    vi.advanceTimersByTime(milliseconds);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-21T12:00:00Z"));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  root = createRoot(document.createElement("div"));
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("starts, pauses, resumes, completes, and resets a reading session", async () => {
  await render();
  expect(state.isHydrated).toBe(true);
  expect(state.session).toBeNull();
  await act(async () => state.startSession());
  await advance(10000);
  expect(state.elapsedSeconds).toBe(10);
  await act(async () => state.toggleSession());
  expect(vi.getTimerCount()).toBe(0);
  await advance(20000);
  expect(state.elapsedSeconds).toBe(10);
  await act(async () => state.toggleSession());
  await advance(49000);
  expect(state.elapsedSeconds).toBe(59);
  await advance(1000);
  expect(state.isComplete).toBe(true);
  expect(state.progress).toBe(100);
  expect(state.session?.isRunning).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject({
    elapsedSeconds: 60,
    isRunning: false,
    lastResumedAt: null,
  });
  await act(async () => state.resetSession());
  expect(state.session).toBeNull();
  expect(localStorage.getItem(key)).toBeNull();
});

it("restores existing version 1 snapshots without migrating storage", async () => {
  localStorage.setItem(key, JSON.stringify(savedSession));
  await render();
  expect(state.elapsedSeconds).toBe(10);
  expect(state.session).toEqual(savedSession);
  expect(vi.getTimerCount()).toBe(0);
});

it("isolates articles and stops ticking when navigating away", async () => {
  await render();
  await act(async () => state.startSession());
  await advance(5000);
  await render(2);
  expect(state.session).toBeNull();
  expect(state.elapsedSeconds).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
  expect(JSON.parse(localStorage.getItem(key)!).articleId).toBe(1);
  await render(1);
  expect(state.elapsedSeconds).toBe(5);
  await act(async () => root.render(null));
  expect(vi.getTimerCount()).toBe(0);
});

it("uses actual elapsed time after timer throttling", async () => {
  await render();
  await act(async () => state.startSession());
  vi.setSystemTime(Date.now() + 90000);
  await advance(1000);
  expect(state.elapsedSeconds).toBe(60);
  expect(state.isComplete).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it("follows pause, article replacement, and reset events from another tab", async () => {
  await render();
  await act(async () => state.startSession());
  await advance(5000);

  async function syncFromAnotherTab(value: object | null) {
    const newValue = value === null ? null : JSON.stringify(value);
    if (newValue === null) localStorage.removeItem(key);
    else localStorage.setItem(key, newValue);
    // The test setup uses an in-memory Storage implementation.
    const event = new Event("storage");
    Object.assign(event, { key, newValue, storageArea: localStorage });
    await act(async () => {
      window.dispatchEvent(event);
    });
  }

  await syncFromAnotherTab(savedSession);
  expect(state.elapsedSeconds).toBe(10);
  expect(state.session?.isRunning).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  await syncFromAnotherTab({ ...savedSession, articleId: 2 });
  expect(state.session).toBeNull();
  await render(2);
  expect(state.elapsedSeconds).toBe(10);
  await syncFromAnotherTab(null);
  expect(state.session).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

it("does not show negative progress when the system clock moves backward", async () => {
  localStorage.setItem(
    key,
    JSON.stringify({ ...savedSession, isRunning: true, lastResumedAt: Date.now() + 60000 })
  );
  await render();
  expect(state.elapsedSeconds).toBe(10);
  await advance(1000);
  expect(state.elapsedSeconds).toBe(10);
});

it.each([
  "invalid json",
  "null",
  "[]",
  JSON.stringify({ ...savedSession, elapsedSeconds: -1 }),
  JSON.stringify({ ...savedSession, elapsedSeconds: 61 }),
  JSON.stringify({ ...savedSession, targetSeconds: 0 }),
  JSON.stringify({ ...savedSession, isRunning: true }),
  JSON.stringify({ ...savedSession, lastResumedAt: "yesterday" }),
])("ignores invalid saved sessions: %s", async (raw) => {
  localStorage.setItem(key, raw);
  await render();
  expect(state.session).toBeNull();
  expect(state.elapsedSeconds).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps controls usable when browser storage is blocked", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  await render();
  await act(async () => state.startSession());
  await advance(5000);
  await act(async () => state.toggleSession());
  expect(state.elapsedSeconds).toBe(5);
  expect(state.session?.isRunning).toBe(false);
  await act(async () => state.toggleSession());
  await advance(55000);
  expect(state.isComplete).toBe(true);
  await act(async () => state.resetSession());
  expect(state.session).toBeNull();
});
