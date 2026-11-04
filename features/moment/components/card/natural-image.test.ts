import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { NaturalImage } from "./natural-image";

const mocks = vi.hoisted(() => ({
  reduced: false,
  controls: { start: vi.fn(), set: vi.fn(), stop: vi.fn(), subscribe: vi.fn() },
}));

vi.mock("../feed-motion", () => ({
  momentLayoutTransition: { duration: 0.4 },
  useMomentMotion: () => ({ enabled: true, reduced: mocks.reduced }),
}));
vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useAnimationControls: () => mocks.controls,
}));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.reduced = false;
  Object.values(mocks.controls).forEach((mock) => mock.mockReset());
  mocks.controls.subscribe.mockReturnValue(() => {});
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function render(bounded = false) {
  await act(async () =>
    root.render(
      createElement(NaturalImage, { src: "/photo.jpg", alt: "Photo", interactive: true, bounded })
    )
  );
  return container.querySelector("img")!;
}

it("bounds single-image previews with CSS without assigning an aspect ratio or dimensions", async () => {
  const image = await render(true);
  expect(image.className).toContain("object-contain");
  expect(image.className).toContain("w-auto");
  expect(image.className).toContain("max-w-full");
  expect(image.className).toContain("max-h-[min(55svh,420px)]");
  expect(image.className).toContain("lg:max-h-[min(60svh,560px)]");
  expect(image.className).toContain("group-data-[view=grid]/moment-feed:max-h-[min(50svh,360px)]");
  expect(image.hasAttribute("width")).toBe(false);
  expect(image.hasAttribute("height")).toBe(false);
  expect(image.style.aspectRatio).toBe("");
});

it("leaves multi-image natural sizing unchanged", async () => {
  const image = await render();
  expect(image.className).toContain("w-full");
  expect(image.className).not.toContain("max-h-");
});

async function load(image: HTMLImageElement) {
  await act(async () => {
    image.dispatchEvent(new Event("load"));
  });
}

it("reveals an uncached image only once without assigning dimensions", async () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(false);
  const image = await render();
  expect(image.hasAttribute("width")).toBe(false);
  expect(image.hasAttribute("height")).toBe(false);
  expect(image.style.opacity).not.toBe("0");
  await load(image);
  expect(mocks.controls.set).toHaveBeenCalledWith({ opacity: 0 });
  expect(mocks.controls.start).toHaveBeenCalledTimes(1);
  await render();
  await load(image);
  expect(container.querySelector("img")).toBe(image);
  expect(mocks.controls.start).toHaveBeenCalledTimes(1);
});

it("does not replay a cached image's entrance", async () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(640);
  const image = await render();
  await load(image);
  expect(mocks.controls.start).not.toHaveBeenCalled();
});

it("settles image feedback when the reduced-motion preference changes", async () => {
  const image = await render();
  await load(image);
  mocks.reduced = true;
  await render();
  expect(mocks.controls.stop).toHaveBeenCalled();
  expect(mocks.controls.set).toHaveBeenLastCalledWith({ opacity: 1, scale: 1 });
});

it("does not defer an image entrance until reduced motion is turned off", async () => {
  mocks.reduced = true;
  const image = await render();
  await load(image);
  mocks.reduced = false;
  await render();
  await load(image);
  expect(mocks.controls.start).not.toHaveBeenCalled();
});
