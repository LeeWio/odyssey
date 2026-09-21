import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useRealTime } from "./use-real-time";

let root: Root;
let container: HTMLDivElement;

function Harness() {
  return createElement("output", null, JSON.stringify(useRealTime()));
}

async function render() {
  await act(async () => {
    root.render(createElement(StrictMode, null, createElement(Harness)));
  });
}

async function advance(milliseconds: number) {
  await act(async () => {
    vi.advanceTimersByTime(milliseconds);
  });
}

function displayedTime() {
  return JSON.parse(container.textContent!) as ReturnType<typeof useRealTime>;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 21, 23, 59, 45));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("aligns updates to the minute and rolls the local date over at midnight", async () => {
  await render();
  expect(displayedTime()).toEqual({
    formattedDate: "Mon, 9/21",
    day: "21",
    weekdayName: "Mon",
    hours: "23",
    minutes: "59",
  });
  await advance(14999);
  expect(displayedTime().minutes).toBe("59");
  await advance(1);
  expect(displayedTime()).toEqual({
    formattedDate: "Tue, 9/22",
    day: "22",
    weekdayName: "Tue",
    hours: "00",
    minutes: "00",
  });
  await advance(60000);
  expect(displayedTime().minutes).toBe("01");
  await advance(60000);
  expect(displayedTime().minutes).toBe("02");
});

it("keeps minute alignment across unrelated rerenders", async () => {
  await render();
  await advance(10000);
  await render();
  await advance(5000);
  expect(displayedTime().minutes).toBe("00");
  await advance(30000);
  await render();
  await advance(30000);
  expect(displayedTime().minutes).toBe("01");
});

it.each([0, 15000, 75000])("clears timers when unmounted after %i ms", async (elapsed) => {
  await render();
  if (elapsed > 0) await advance(15000);
  if (elapsed > 15000) await advance(elapsed - 15000);
  expect(vi.getTimerCount()).toBe(1);
  await act(async () => root.render(null));
  expect(vi.getTimerCount()).toBe(0);
});
