import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ReactionButton, type ReactionButtonProps } from "./reaction-button";

const mocks = vi.hoisted(() => ({
  reduced: false,
  pointer: "mouse",
  animations: [] as Array<{
    onUpdate: (value: number) => void;
    onComplete: () => void;
    stop: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock("@/hooks/use-reduced-motion-preference", () => ({
  useReducedMotionPreference: () => mocks.reduced,
}));
vi.mock("@iconify/react", () => ({
  Icon: ({ icon }: { icon: string }) => createElement("svg", { "data-icon": icon }),
}));
vi.mock("motion/react", () => ({
  animate: (
    from: unknown,
    _to: unknown,
    options: { onUpdate: (value: number) => void; onComplete: () => void }
  ) => {
    const control = { ...options, stop: vi.fn() };
    if (typeof from === "number") mocks.animations.push(control);
    return control;
  },
}));
vi.mock("@heroui/react", () => ({
  Button: ({
    onPress,
    isDisabled,
    isPending,
    isIconOnly,
    variant,
    size,
    ...props
  }: ComponentProps<"button"> & {
    onPress: (event: { pointerType: string }) => void;
    isDisabled?: boolean;
    isPending?: boolean;
    isIconOnly?: boolean;
    variant: string;
    size: string;
  }) =>
    createElement("button", {
      ...props,
      disabled: isDisabled || isPending,
      "data-pending": isPending,
      "data-icon-only": isIconOnly,
      "data-variant": variant,
      "data-size": size,
      onClick: () => onPress({ pointerType: mocks.pointer }),
    }),
}));

let root: Root;
let container: HTMLDivElement;
let props: ReactionButtonProps;
const button = () => container.querySelector("button")!;
const latest = () => mocks.animations[mocks.animations.length - 1];
async function render(next: Partial<ReactionButtonProps> = {}) {
  props = { ...props, ...next };
  await act(async () => root.render(createElement(ReactionButton, props)));
}
async function press() {
  await act(async () => button().click());
}
async function progress(value: number) {
  await act(async () => latest().onUpdate(value));
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.reduced = false;
  mocks.pointer = "mouse";
  mocks.animations = [];
  container = document.createElement("div");
  root = createRoot(container);
  props = { selected: false, count: 8, label: "Like", onSelectedChange: vi.fn(() => true) };
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

it("synchronizes hydration and external count changes without celebration", async () => {
  await render();
  await render({ selected: true, count: 22 });
  expect(button().getAttribute("data-selected")).toBe("true");
  expect(button().getAttribute("aria-label")).toBe("Like, 22");
  await render({ count: 37 });
  expect(button().textContent).toBe("37");
  expect(mocks.animations).toHaveLength(0);
});

it("does not mutate controlled state or animate a rejected action", async () => {
  await render({ onSelectedChange: vi.fn(() => false) });
  await press();
  expect(props.onSelectedChange).toHaveBeenCalledExactlyOnceWith(true);
  expect(button().getAttribute("aria-pressed")).toBe("false");
  expect(button().textContent).toBe("8");
  await render({ selected: true, count: 9 });
  expect(mocks.animations).toHaveLength(0);
});

it("switches icon, native variant and authoritative count at the pulse midpoint", async () => {
  await render();
  await press();
  expect(button().textContent).toBe("8");
  await render({ selected: true, count: 15, isPending: true });
  expect(button().getAttribute("aria-pressed")).toBe("true");
  expect(button().getAttribute("data-selected")).toBe("false");
  expect(button().getAttribute("data-variant")).toBe("ghost");
  await progress(0.4);
  expect(button().getAttribute("data-selected")).toBe("true");
  expect(button().getAttribute("data-variant")).toBe("danger-soft");
  expect(button().getAttribute("aria-label")).toBe("Like, 15");
  expect(container.querySelector("svg")?.getAttribute("data-icon")).toBe("gravity-ui:heart-fill");
});

it("interrupts rollback and ignores state updates from the cancelled animation", async () => {
  await render();
  await press();
  await render({ selected: true, count: 9 });
  const animation = latest();
  await progress(0.4);
  await render({ selected: false, count: 8 });
  expect(animation.stop).toHaveBeenCalled();
  expect(button().hasAttribute("data-running")).toBe(false);
  expect(button().textContent).toBe("8");
  await act(async () => {
    animation.onUpdate(0.8);
    animation.onComplete();
  });
  expect(button().getAttribute("data-selected")).toBe("false");
  expect(button().textContent).toBe("8");
});

it("allows an accepted action before the previous pulse ends", async () => {
  await render();
  await press();
  await render({ selected: true, count: 9 });
  await progress(0.4);
  const first = latest();
  await press();
  await render({ selected: false, count: 8 });
  expect(props.onSelectedChange).toHaveBeenCalledTimes(2);
  expect(first.stop).toHaveBeenCalled();
  expect(mocks.animations).toHaveLength(2);
  await progress(1);
  await act(async () => latest().onComplete());
  expect(button().getAttribute("data-selected")).toBe("false");
  expect(button().getAttribute("aria-label")).toBe("Like, 8");
});

it.each(["isPending", "isDisabled"] as const)("blocks actions while %s", async (flag) => {
  await render({ [flag]: true });
  await press();
  expect(props.onSelectedChange).not.toHaveBeenCalled();
  expect(mocks.animations).toHaveLength(0);
});

it.each(["keyboard", "reduced", "disabled-motion"])("updates immediately for %s", async (mode) => {
  if (mode === "keyboard") mocks.pointer = "keyboard";
  if (mode === "reduced") mocks.reduced = true;
  await render({ animationEnabled: mode !== "disabled-motion" });
  await press();
  await render({ selected: true, count: 9 });
  expect(button().getAttribute("data-selected")).toBe("true");
  expect(button().textContent).toBe("9");
  expect(mocks.animations).toHaveLength(0);
});

it("settles an ongoing animation when reduced motion is enabled", async () => {
  await render();
  await press();
  await render({ selected: true, count: 9 });
  const animation = latest();
  mocks.reduced = true;
  await render();
  expect(animation.stop).toHaveBeenCalled();
  expect(button().getAttribute("data-selected")).toBe("true");
  expect(button().textContent).toBe("9");
});

it("hides zero counts and renders an icon-only star with native selected styling", async () => {
  await render({ count: 0, showCount: "positive" });
  expect(button().getAttribute("data-icon-only")).toBe("true");
  expect(button().getAttribute("aria-label")).toBe("Like");
  await render({
    selected: true,
    icon: "star",
    showCount: false,
    selectedVariant: "secondary",
    selectedColor: "warning",
  });
  expect(button().getAttribute("data-variant")).toBe("secondary");
  expect(button().getAttribute("data-icon-only")).toBe("true");
  expect(container.querySelector("svg")?.getAttribute("data-icon")).toBe("gravity-ui:star-fill");
});
