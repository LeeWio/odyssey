import { act, createElement, Fragment, type ComponentProps, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { ReactionButtonProps } from "@/components/ui/reaction-button";
import { CardFooter } from "./card-footer";

const mocks = vi.hoisted(() => ({
  reduced: false,
  enabled: true,
  reactions: [] as ReactionButtonProps[],
}));
vi.mock("../feed-motion", () => ({
  momentLayoutTransition: { duration: 0.4 },
  useMomentMotion: () => ({ enabled: mocks.enabled, reduced: mocks.reduced }),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@iconify/react", () => ({ Icon: () => null }));
vi.mock("@/components/ui/reaction-button", () => ({
  ReactionButton: (props: ReactionButtonProps) => {
    mocks.reactions.push(props);
    return createElement("button", {
      "aria-label": props.label,
      onClick: () => props.onSelectedChange(!props.selected),
    });
  },
}));
vi.mock("@heroui/react", () => ({
  Button: ({
    children,
    onPress,
    "aria-label": label,
  }: {
    children: ReactNode;
    onPress: () => void;
    "aria-label": string;
  }) => createElement("button", { onClick: onPress, "aria-label": label }, children),
  Tooltip: Object.assign(
    ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
    { Content: () => null }
  ),
}));

let root: Root;
let container: HTMLDivElement;
let props: ComponentProps<typeof CardFooter>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.reduced = false;
  mocks.enabled = true;
  mocks.reactions = [];
  container = document.createElement("div");
  root = createRoot(container);
  props = {
    isLiked: false,
    isLiking: false,
    likesCount: 0,
    onLikeToggle: vi.fn(() => true),
    onBookmarkToggle: vi.fn(() => true),
  };
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});
async function render(next: Partial<typeof props> = {}) {
  props = { ...props, ...next };
  mocks.reactions = [];
  await act(async () => root.render(createElement(CardFooter, props)));
}

it("configures a counted danger heart and an icon-only warning star", async () => {
  await render({ isLiked: true, likesCount: 12, isBookmarked: true });
  expect(mocks.reactions[0]).toMatchObject({
    selected: true,
    count: 12,
    size: "sm",
    icon: "heart",
    showCount: "positive",
    idleVariant: "ghost",
    idleColor: "inherit",
    selectedVariant: "danger-soft",
    selectedColor: "danger",
    label: "unlike",
  });
  expect(mocks.reactions[1]).toMatchObject({
    selected: true,
    size: "sm",
    icon: "star",
    showCount: false,
    idleVariant: "ghost",
    idleColor: "inherit",
    selectedVariant: "secondary",
    selectedColor: "warning",
    label: "unsaveMoment",
  });
});
it("delegates actions without owning business state", async () => {
  await render();
  await act(async () => {
    container.querySelector<HTMLButtonElement>('[aria-label="like"]')!.click();
    container.querySelector<HTMLButtonElement>('[aria-label="saveMoment"]')!.click();
  });
  expect(props.onLikeToggle).toHaveBeenCalledTimes(1);
  expect(props.onBookmarkToggle).toHaveBeenCalledTimes(1);
  expect(mocks.reactions[0].selected).toBe(false);
  expect(mocks.reactions[1].selected).toBe(false);
});
it("passes pending and motion preferences through", async () => {
  mocks.reduced = true;
  await render({ isLiking: true });
  expect(mocks.reactions[0].isPending).toBe(true);
  expect(mocks.reactions.every((props) => !props.animationEnabled)).toBe(true);
  mocks.reduced = false;
  mocks.enabled = false;
  await render();
  expect(mocks.reactions.every((props) => !props.animationEnabled)).toBe(true);
});
it("preserves comments and disables an unavailable bookmark action", async () => {
  const onCommentToggle = vi.fn();
  await render({ onBookmarkToggle: undefined, onCommentToggle, commentsCount: 2 });
  await act(async () =>
    container.querySelector<HTMLButtonElement>('[aria-label="openComments"]')!.click()
  );
  expect(onCommentToggle).toHaveBeenCalledTimes(1);
  expect(mocks.reactions[1].isDisabled).toBe(true);
  expect(mocks.reactions[1].onSelectedChange(true)).toBe(false);
});
