import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useNotificationActions } from "./use-notification-actions";

let root: Root;
let actions: ReturnType<typeof useNotificationActions>;
function Harness() {
  const value = useNotificationActions();
  useLayoutEffect(() => {
    actions = value;
  });
  return null;
}
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  root = createRoot(document.createElement("div"));
  await act(async () => root.render(createElement(Harness)));
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

it("blocks duplicate and conflicting actions before rendering", async () => {
  const response = Promise.withResolvers<void>();
  const conflicting = vi.fn(async () => {});
  let first!: Promise<boolean>;
  await act(async () => {
    first = actions.run(1, "save", () => response.promise);
    expect(await actions.run(1, "save", conflicting)).toBe(false);
    expect(await actions.run(1, "delete", conflicting)).toBe(false);
  });
  expect(conflicting).not.toHaveBeenCalled();
  expect(actions.pendingActions.get(1)).toBe("save");
  await act(async () => {
    response.resolve();
    expect(await first).toBe(true);
  });
  expect(actions.pendingActions.size).toBe(0);
});

it("finishing one row leaves other rows locked until their requests finish", async () => {
  const first = Promise.withResolvers<void>();
  const second = Promise.withResolvers<void>();
  let one!: Promise<boolean>;
  let two!: Promise<boolean>;
  await act(async () => {
    one = actions.run(1, "save", () => first.promise);
    two = actions.run(2, "read", () => second.promise);
  });
  expect([...actions.pendingActions]).toEqual([
    [1, "save"],
    [2, "read"],
  ]);
  await act(async () => {
    first.resolve();
    await one;
  });
  expect([...actions.pendingActions]).toEqual([[2, "read"]]);
  await act(async () => {
    second.resolve();
    await two;
  });
  expect(actions.pendingActions.size).toBe(0);
});

it("handles rejection and synchronous throws while allowing retry", async () => {
  await act(async () => {
    expect(await actions.run(1, "complete", () => Promise.reject(new Error("Offline")))).toBe(
      false
    );
    expect(
      await actions.run(1, "delete", () => {
        throw new Error("Could not start");
      })
    ).toBe(false);
    expect(await actions.run(1, "reopen", async () => {})).toBe(true);
  });
  expect(actions.pendingActions.size).toBe(0);
});

it("bulk actions synchronously block duplicate, conflicting bulk, and row requests", async () => {
  const response = Promise.withResolvers<void>();
  const conflicting = vi.fn(async () => {});
  let first!: Promise<boolean>;
  await act(async () => {
    first = actions.runBulk("clear-read", () => response.promise);
    expect(actions.isBulkRunning()).toBe(true);
    expect(await actions.runBulk("clear-read", conflicting)).toBe(false);
    expect(await actions.runBulk("read-all", conflicting)).toBe(false);
    expect(await actions.run(1, "save", conflicting)).toBe(false);
  });
  expect(conflicting).not.toHaveBeenCalled();
  expect(actions.pendingBulkAction).toBe("clear-read");
  await act(async () => {
    response.resolve();
    expect(await first).toBe(true);
    expect(actions.isBulkRunning()).toBe(false);
    expect(await actions.run(1, "save", conflicting)).toBe(true);
  });
  expect(actions.pendingBulkAction).toBeNull();
  expect(conflicting).toHaveBeenCalledTimes(1);
});

it("bulk actions wait until every active row is finished", async () => {
  const first = Promise.withResolvers<void>();
  const second = Promise.withResolvers<void>();
  const bulk = vi.fn(async () => {});
  let one!: Promise<boolean>;
  let two!: Promise<boolean>;
  await act(async () => {
    one = actions.run(1, "save", () => first.promise);
    two = actions.run(2, "read", () => second.promise);
    expect(await actions.runBulk("clear-read", bulk)).toBe(false);
    first.resolve();
    await one;
    expect(await actions.runBulk("read-all", bulk)).toBe(false);
  });
  expect(bulk).not.toHaveBeenCalled();
  expect(actions.pendingBulkAction).toBeNull();
  await act(async () => {
    second.resolve();
    await two;
    expect(await actions.runBulk("read-all", bulk)).toBe(true);
  });
  expect(bulk).toHaveBeenCalledTimes(1);
});

it("bulk rejection and synchronous throws release the lock for retry", async () => {
  await act(async () => {
    expect(await actions.runBulk("clear-read", () => Promise.reject(new Error("Offline")))).toBe(
      false
    );
    expect(actions.isBulkRunning()).toBe(false);
    expect(
      await actions.runBulk("read-all", () => {
        throw new Error("Could not start");
      })
    ).toBe(false);
    expect(actions.isBulkRunning()).toBe(false);
    expect(await actions.runBulk("clear-read", async () => {})).toBe(true);
  });
  expect(actions.pendingBulkAction).toBeNull();
});
