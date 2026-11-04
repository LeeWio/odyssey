import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { CardFooter } from "./card-footer";

const mocks = vi.hoisted(() => ({
  reduced: false,
  controls: [] as Array<{
    start: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock("../feed-motion", () => ({
  momentLayoutTransition: { duration: 0.4 },
  useMomentMotion: () => ({ enabled: true, reduced: mocks.reduced }),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@iconify/react", () => ({ Icon: () => null }));
vi.mock("@heroui/react", () => ({
  Button: ({
    children,
    onPress,
    "aria-label": label,
  }: {
    children: React.ReactNode;
    onPress: () => void;
    "aria-label": string;
  }) => createElement("button", { onClick: onPress, "aria-label": label }, children),
}));
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  const { useMemo } = await import("react");
  return {
    ...actual,
    useAnimationControls: () =>
      useMemo(() => {
        const controls = {
          start: vi.fn(),
          set: vi.fn(),
          stop: vi.fn(),
          subscribe: vi.fn(() => () => {}),
        };
        mocks.controls.push(controls);
        return controls;
      }, []),
  };
});

let root: Root;
let container: HTMLDivElement;
let props: ComponentProps<typeof CardFooter>;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.reduced = false;
  mocks.controls = [];
  container = document.createElement("div");
  root = createRoot(container);
  props = {
    isLiked: false,
    isLiking: false,
    likesCount: 0,
    onLikeToggle: vi.fn(),
    onBookmarkToggle: vi.fn(),
  };
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

async function render(next: Partial<typeof props> = {}) {
  props = { ...props, ...next };
  await act(async () => root.render(createElement(CardFooter, props)));
}

async function press(label: string) {
  await act(async () =>
    container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!.click()
  );
}

it("does not celebrate hydrated reactions or bookmarks", async () => {
  await render();
  await render({ isLiked: true, isBookmarked: true });
  expect(mocks.controls[0].start).not.toHaveBeenCalled();
  expect(mocks.controls[1].start).not.toHaveBeenCalled();
});

it("pulses a user-triggered like once and does not pulse on rollback", async () => {
  await render();
  await press("like");
  expect(props.onLikeToggle).toHaveBeenCalledTimes(1);
  await render({ isLiked: true, likesCount: 1 });
  expect(mocks.controls[0].start).toHaveBeenCalledWith(
    expect.objectContaining({ scale: [1, 1.12, 1] })
  );
  await render({ isLiked: false, likesCount: 0 });
  expect(mocks.controls[0].start).toHaveBeenCalledTimes(1);
});

it("pulses only the bookmark icon after a user action", async () => {
  await render();
  await press("saveMoment");
  await render({ isBookmarked: true });
  expect(props.onBookmarkToggle).toHaveBeenCalledTimes(1);
  expect(mocks.controls[1].start).toHaveBeenCalledWith(
    expect.objectContaining({ scale: [1, 1.1, 1] })
  );
  expect(mocks.controls[0].start).not.toHaveBeenCalled();
});

it("settles icon feedback and skips new pulses with reduced motion", async () => {
  await render();
  mocks.reduced = true;
  await render();
  await press("like");
  await render({ isLiked: true });
  for (const controls of mocks.controls) {
    expect(controls.stop).toHaveBeenCalled();
    expect(controls.set).toHaveBeenCalledWith({ scale: 1 });
    expect(controls.start).not.toHaveBeenCalled();
  }
});
