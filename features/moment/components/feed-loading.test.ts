import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { MomentFeedLoading } from "./feed-loading";

vi.mock("./feed-motion", () => ({ useMomentMotion: () => ({ enabled: true, reduced: true }) }));
vi.mock("./card", () => ({
  MomentCardSkeleton: ({ animationType }: { animationType: string }) =>
    createElement("span", { "data-skeleton": animationType }),
}));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("waits 150ms before displaying static skeletons and announces one loading region", async () => {
  await act(async () =>
    root.render(createElement(MomentFeedLoading, { label: "Loading moments" }))
  );
  expect(container.querySelector('[role="status"]')?.getAttribute("aria-label")).toBe(
    "Loading moments"
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(149);
  });
  expect(container.querySelectorAll("[data-skeleton]")).toHaveLength(0);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(container.querySelectorAll('[data-skeleton="none"]')).toHaveLength(3);
});

it("cancels the delay if data arrives before the skeleton would appear", async () => {
  await act(async () =>
    root.render(createElement(MomentFeedLoading, { label: "Loading moments" }))
  );
  await act(async () => root.render(createElement("p", null, "Ready")));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(container.textContent).toBe("Ready");
  expect(container.querySelectorAll("[data-skeleton]")).toHaveLength(0);
});

it("does not ship hidden loading content or animated skeletons in server markup", () => {
  const html = renderToString(createElement(MomentFeedLoading, { label: "Loading moments" }));
  expect(html).toContain('aria-busy="true"');
  expect(html).not.toContain("opacity:0");
  expect(html).not.toContain("data-skeleton");
});
