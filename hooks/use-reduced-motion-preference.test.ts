import { act, createElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

import { useReducedMotionPreference } from "./use-reduced-motion-preference";

function Harness() {
  return createElement("span", null, useReducedMotionPreference() ? "still" : "animated");
}

afterEach(() => vi.unstubAllGlobals());

it.each([true, false])("hydrates without mismatches when reduced motion is %s", async (matches) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
  const container = document.createElement("div");
  container.innerHTML = renderToString(createElement(Harness));
  expect(container.textContent).toBe("still");
  const errors = vi.fn();
  let root!: Root;
  await act(async () => {
    root = hydrateRoot(container, createElement(Harness), { onRecoverableError: errors });
  });
  expect(container.textContent).toBe(matches ? "still" : "animated");
  expect(errors).not.toHaveBeenCalled();
  await act(async () => root.unmount());
});
