import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { MomentFeedLayout } from "./feed-layout";

const animations = vi.hoisted(() => ({ reduced: true, animate: vi.fn() }));

vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  const subscribe = (onChange: () => void) => {
    window.addEventListener("test-search-params", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("test-search-params", onChange);
      window.removeEventListener("popstate", onChange);
    };
  };
  return {
    useSearchParams: () =>
      new URLSearchParams(
        useSyncExternalStore(
          subscribe,
          () => window.location.search,
          () => ""
        )
      ),
  };
});

vi.mock("./feed-motion", () => ({
  momentLayoutTransition: { duration: 0.4 },
  useMomentMotion: () => ({ enabled: true, reduced: animations.reduced }),
}));
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  const { useRef } = await import("react");
  return { ...actual, useAnimate: () => [useRef(null), animations.animate] };
});

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@iconify/react", () => ({ Icon: () => null }));
vi.mock("@heroui-pro/react", async () => {
  const { createContext, useContext, createElement } = await import("react");
  const Selection = createContext<(key: string) => void>(() => {});
  return {
    Segment: Object.assign(
      ({
        children,
        onSelectionChange,
      }: {
        children: React.ReactNode;
        onSelectionChange: (key: string) => void;
      }) => createElement(Selection.Provider, { value: onSelectionChange }, children),
      {
        Item: ({ id, children }: { id: string; children: React.ReactNode }) => {
          const onSelect = useContext(Selection);
          return createElement("button", { onClick: () => onSelect(id) }, children);
        },
      }
    ),
  };
});

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  window.history.replaceState(null, "", "/moments");
  const replaceState = window.history.replaceState.bind(window.history);
  vi.spyOn(window.history, "replaceState").mockImplementation((state, unused, url) => {
    replaceState(state, unused, url);
    // Mirror Next's native-history integration without mounting its router.
    window.dispatchEvent(new Event("test-search-params"));
  });
  vi.useFakeTimers();
  animations.reduced = true;
  animations.animate.mockReset();
  animations.animate.mockImplementation((node, values, options) => {
    const done = Promise.withResolvers<void>();
    const finish = () => {
      if (values.opacity !== undefined) {
        node.style.opacity = String(
          Array.isArray(values.opacity) ? values.opacity.at(-1) : values.opacity
        );
      }
      done.resolve();
    };
    const timer = setTimeout(finish, options.duration * 1000);
    if (options.duration === 0) finish();
    return Object.assign(done.promise, {
      stop: () => {
        clearTimeout(timer);
        done.resolve();
      },
    });
  });
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function choose(mode: "gridView" | "listView") {
  const button = Array.from(container.querySelectorAll("button")).find(
    (element) => element.textContent === mode
  );
  await act(async () => button!.click());
}

async function advance(milliseconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

it.each([
  ["", "list"],
  ["?view=list", "list"],
  ["?view=grid", "grid"],
  ["?view=unknown", "list"],
])("restores %s from the URL as %s", async (query, mode) => {
  window.history.replaceState(null, "", `/moments${query}`);
  await act(async () => root.render(createElement(MomentFeedLayout)));
  expect(container.querySelector("[data-view]")?.getAttribute("data-view")).toBe(mode);
});

it("updates only the view parameter without losing filters or the current anchor", async () => {
  window.history.replaceState(null, "", "/moments?topic=daily&other=kept#moment-3");
  await act(async () => root.render(createElement(MomentFeedLayout)));
  const historyLength = window.history.length;
  await choose("gridView");
  expect(window.location.search).toBe("?topic=daily&other=kept&view=grid");
  expect(window.location.hash).toBe("#moment-3");
  expect(window.history.length).toBe(historyLength);
  await choose("listView");
  expect(window.location.search).toBe("?topic=daily&other=kept&view=list");
  expect(window.location.hash).toBe("#moment-3");
});

it("tracks restored history entries without replacing the card subtree", async () => {
  await act(async () => root.render(createElement(MomentFeedLayout, null, createElement("input"))));
  const input = container.querySelector("input");
  await act(async () => {
    window.history.pushState(null, "", "/moments?view=grid");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(container.querySelector("[data-view]")?.getAttribute("data-view")).toBe("grid");
  expect(container.querySelector("input")).toBe(input);
});

it("changes layout immediately without fading or replacing children", async () => {
  animations.reduced = false;
  await act(async () => root.render(createElement(MomentFeedLayout, null, createElement("input"))));
  await advance(300);
  const input = container.querySelector("input");
  const animationCount = animations.animate.mock.calls.length;
  await choose("gridView");
  expect(container.querySelector("[data-view]")?.getAttribute("data-view")).toBe("grid");
  expect(container.querySelector("input")).toBe(input);
  expect(animations.animate).toHaveBeenCalledTimes(animationCount);
  await advance(400);
  expect(
    (container.querySelector('[data-slot="moment-feed-body"]') as HTMLElement).style.opacity
  ).toBe("1");
});

it("keeps the last selected layout during rapid changes without queuing fades", async () => {
  animations.reduced = false;
  await act(async () => root.render(createElement(MomentFeedLayout)));
  await advance(300);
  await choose("gridView");
  await advance(30);
  await choose("listView");
  await advance(300);
  expect(container.querySelector("[data-view]")?.getAttribute("data-view")).toBe("list");
  await choose("gridView");
  await advance(70);
  await choose("listView");
  await advance(20);
  await choose("gridView");
  await advance(300);
  expect(container.querySelector("[data-view]")?.getAttribute("data-view")).toBe("grid");
  expect(
    (container.querySelector('[data-slot="moment-feed-body"]') as HTMLElement).style.opacity
  ).toBe("1");
});

it("immediately settles an interrupted switch when reduced motion is enabled", async () => {
  animations.reduced = false;
  await act(async () => root.render(createElement(MomentFeedLayout)));
  await advance(300);
  await choose("gridView");
  await advance(20);
  animations.reduced = true;
  await act(async () => root.render(createElement(MomentFeedLayout)));
  expect(container.querySelector("[data-view]")?.getAttribute("data-view")).toBe("grid");
  expect(
    (container.querySelector('[data-slot="moment-feed-body"]') as HTMLElement).style.opacity
  ).toBe("1");
  await advance(500);
  expect(container.querySelector("[data-view]")?.getAttribute("data-view")).toBe("grid");
});

it("preserves children during pending and completed topic transitions", async () => {
  animations.reduced = false;
  const child = createElement("input", { defaultValue: "retained" });
  await act(async () => root.render(createElement(MomentFeedLayout, null, child)));
  await advance(300);
  const input = container.querySelector("input");
  await act(async () => root.render(createElement(MomentFeedLayout, { busy: true }, child)));
  await advance(120);
  expect(container.querySelector("input")).toBe(input);
  expect(
    (container.querySelector('[data-slot="moment-feed-body"]') as HTMLElement).style.opacity
  ).toBe("0.72");
  await act(async () => root.render(createElement(MomentFeedLayout, null, child)));
  await advance(180);
  expect(container.querySelector("input")).toBe(input);
  expect(
    (container.querySelector('[data-slot="moment-feed-body"]') as HTMLElement).style.opacity
  ).toBe("1");
});

it("only changes layout state without rerendering the page, sidebar or cards", async () => {
  const pageRender = vi.fn();
  const sidebarRender = vi.fn();
  const cardRender = vi.fn();
  const cardMount = vi.fn();
  const cardUnmount = vi.fn();

  function Sidebar() {
    sidebarRender();
    return createElement("aside", null, "Topics");
  }

  function Card() {
    cardRender();
    useEffect(() => {
      cardMount();
      return cardUnmount;
    }, []);
    return createElement("input", { defaultValue: "Kept state" });
  }

  function Page() {
    pageRender();
    return createElement(
      "main",
      null,
      createElement(Sidebar),
      createElement(MomentFeedLayout, null, createElement(Card))
    );
  }

  await act(async () => root.render(createElement(Page)));
  const card = container.querySelector("input");
  const layout = container.querySelector("[data-view]");
  expect(layout?.getAttribute("data-view")).toBe("list");
  expect(card).not.toBeNull();
  card!.value = "Still here";

  for (const mode of ["gridView", "listView", "gridView"]) {
    const button = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent === mode
    );
    await act(async () => button!.click());
    expect(layout?.getAttribute("data-view")).toBe(mode === "gridView" ? "grid" : "list");
    expect(container.querySelector("input")).toBe(card);
    expect(card!.value).toBe("Still here");
  }

  expect(pageRender).toHaveBeenCalledTimes(1);
  expect(sidebarRender).toHaveBeenCalledTimes(1);
  expect(cardRender).toHaveBeenCalledTimes(1);
  expect(cardMount).toHaveBeenCalledTimes(1);
  expect(cardUnmount).not.toHaveBeenCalled();
});
