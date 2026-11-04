import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { MomentResponse } from "@/lib/features/moment";
import { MomentFeedList } from "./feed-list";

const preference = vi.hoisted(() => ({ reduced: true, enteredMomentIds: new Set<number>() }));
const animationStarts = vi.hoisted(() => [] as ReturnType<typeof vi.fn>[]);
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  const { useRef } = await import("react");
  return {
    ...actual,
    useAnimationControls: () => {
      const controls = actual.useAnimationControls();
      const tracked = useRef(false);
      if (!tracked.current) {
        tracked.current = true;
        const start = controls.start.bind(controls);
        animationStarts.push(
          vi.spyOn(controls, "start").mockImplementation((definition, options) => {
            if (typeof definition === "object" && "y" in definition && definition.y === 0) {
              return Promise.resolve();
            }
            return start(definition, options);
          })
        );
      }
      return controls;
    },
  };
});
vi.mock("./feed-motion", () => ({
  momentLayoutTransition: { duration: 0.4 },
  useMomentMotion: () => ({ enabled: true, ...preference }),
}));
vi.mock("./card", () => ({
  MomentCard: () => createElement("input", { defaultValue: "retained" }),
}));

let root: Root;
let container: HTMLDivElement;
const moments = (ids: number[]) => ids.map((id) => ({ id }) as MomentResponse);

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  preference.reduced = true;
  preference.enteredMomentIds.clear();
  animationStarts.length = 0;
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion") && preference.reduced,
  }));
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

it.each([true, false])(
  "keeps initial server-rendered cards readable with reduced motion %s",
  (reduced) => {
    preference.reduced = reduced;
    const html = renderToString(createElement(MomentFeedList, { moments: moments([3, 2]) }));
    expect(html).not.toContain("opacity:0");
    expect(html).not.toContain("translateY(16px)");
    expect(html).toContain('id="moment-3"');
  }
);

it("schedules initial cards at 160ms intervals with 400ms entrances", async () => {
  preference.reduced = false;
  await act(async () =>
    root.render(createElement(MomentFeedList, { moments: moments([3, 2, 1]) }))
  );
  expect(animationStarts).toHaveLength(3);
  for (const [index, start] of animationStarts.entries()) {
    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({
        opacity: 1,
        y: 0,
        transition: expect.objectContaining({ duration: 0.4, delay: index * 0.16 }),
      })
    );
  }
  expect(container.querySelector("li")?.style.opacity).toBe("0");
  expect(container.querySelector("li")?.style.transform).toBe("translateY(16px)");
});

it("only schedules genuinely new IDs after refresh and across feed remounts", async () => {
  preference.reduced = false;
  const render = (ids: number[], key = "same") =>
    root.render(createElement(MomentFeedList, { key, moments: moments(ids) }));
  await act(async () => render([3, 2]));
  await act(async () => render([3, 2]));
  expect(animationStarts[0]).toHaveBeenCalledTimes(1);
  expect(animationStarts[1]).toHaveBeenCalledTimes(1);
  await act(async () => render([3, 2, 1, 0]));
  expect(animationStarts[2]).toHaveBeenCalledWith(
    expect.objectContaining({
      transition: expect.objectContaining({ delay: 0 }),
    })
  );
  expect(animationStarts[3]).toHaveBeenCalledWith(
    expect.objectContaining({
      transition: expect.objectContaining({ delay: 0.16 }),
    })
  );
  await act(async () => render([3, 2, 1, 0], "remount"));
  expect(animationStarts.slice(4).every((start) => start.mock.calls.length === 0)).toBe(true);
});

it("skips entrance delays with reduced motion and reveals pending cards when focused", async () => {
  await act(async () => root.render(createElement(MomentFeedList, { moments: moments([3, 2]) })));
  expect(animationStarts.every((start) => start.mock.calls.length === 0)).toBe(true);
  expect(container.querySelector("li")?.style.opacity).toBe("1");
  preference.reduced = false;
  await act(async () =>
    root.render(createElement(MomentFeedList, { moments: moments([3, 2, 1]) }))
  );
  const last = container.querySelector<HTMLLIElement>("#moment-1")!;
  expect(last.style.opacity).toBe("0");
  await act(async () => last.dispatchEvent(new FocusEvent("focusin", { bubbles: true })));
  await vi.waitFor(() => {
    expect(last.style.opacity).toBe("1");
    expect(last.style.transform).toBe("none");
  });
});

it("appends new entries without replacing existing card state", async () => {
  await act(async () => root.render(createElement(MomentFeedList, { moments: moments([3, 2]) })));
  const first = container.querySelector("input")!;
  first.value = "Still here";
  await act(async () =>
    root.render(createElement(MomentFeedList, { moments: moments([3, 2, 1]) }))
  );
  expect(container.querySelectorAll("li")).toHaveLength(3);
  expect(container.querySelector("input")).toBe(first);
  expect(first.value).toBe("Still here");
});

it("makes exiting cards inert rather than leaving invisible controls interactive", async () => {
  await act(async () => root.render(createElement(MomentFeedList, { moments: moments([3, 2]) })));
  preference.reduced = false;
  await act(async () => root.render(createElement(MomentFeedList, { moments: moments([2]) })));
  const exiting = container.querySelector("#moment-3");
  expect(exiting).not.toBeNull();
  expect(exiting?.hasAttribute("inert")).toBe(true);
  expect(exiting?.getAttribute("aria-hidden")).toBe("true");
  expect(container.querySelector("#moment-2")?.hasAttribute("inert")).toBe(false);
});
