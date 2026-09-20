import { configureStore } from "@reduxjs/toolkit";
import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Provider, type ProviderProps } from "react-redux";
import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";

vi.hoisted(() => vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost"));
import { baseApi } from "@/lib/api/base-api";
import { authSlice } from "@/lib/features/auth/auth-slice";
import { usePostSearchCommands } from "./use-post-search-commands";

const createStore = () =>
  configureStore({
    reducer: { auth: authSlice.reducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) => defaults().concat(baseApi.middleware),
  });
let store: ReturnType<typeof createStore>;
let root: Root;
let state: ReturnType<typeof usePostSearchCommands>;
function Harness({ query, enabled }: { query: string; enabled: boolean }) {
  const value = usePostSearchCommands(query, enabled);
  useLayoutEffect(() => {
    state = value;
  });
  return null;
}
async function render(query: string, enabled = true) {
  await act(async () => {
    // React supplies children as the third argument to createElement.
    root.render(
      createElement(
        Provider,
        { store } as ProviderProps,
        createElement(Harness, { query, enabled })
      )
    );
  });
}
const response = (title: string) =>
  Response.json({
    code: 200,
    message: "OK",
    data: {
      groups: [{ type: "POST", label: "Articles", items: [{ title, url: "/blog" }] }],
    },
  });
const settle = async (assert: () => void) =>
  vi.waitFor(async () => {
    await act(async () => {});
    assert();
  });
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  store = createStore();
  root = createRoot(document.createElement("div"));
});
afterEach(async () => {
  await act(async () => root.unmount());
  store.dispatch(baseApi.util.resetApiState());
  vi.unstubAllGlobals();
});
afterAll(() => vi.unstubAllEnvs());

it("removes executable results immediately while typing and while a new query loads", async () => {
  const next = Promise.withResolvers<Response>();
  const fetch = vi.fn((request: Request) =>
    new URL(request.url).searchParams.get("keyword") === "alpha"
      ? Promise.resolve(response("Alpha article"))
      : next.promise
  );
  vi.stubGlobal("fetch", fetch);
  await render("alpha");
  await settle(() => expect(state.total).toBe(1));
  await render("beta");
  expect(state.allCommands).toEqual([]);
  expect(state.dynamicGroups).toEqual([]);
  expect(state.isLoading).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(1);
  await settle(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(state.allCommands).toEqual([]);
  await act(async () => {
    next.resolve(response("Beta article"));
  });
  await settle(() => expect(state.allCommands[0]?.title).toBe("Beta article"));
  await render(" ");
  expect(state.total).toBe(0);
  expect(state.allCommands).toEqual([]);
  expect(state.isLoading).toBe(false);
});

it("ignores a late response for an older keyword", async () => {
  const old = Promise.withResolvers<Response>();
  vi.stubGlobal(
    "fetch",
    vi.fn((request: Request) =>
      new URL(request.url).searchParams.get("keyword") === "alpha"
        ? old.promise
        : Promise.resolve(response("Beta article"))
    )
  );
  await render("alpha");
  await render("beta");
  await settle(() => expect(state.allCommands[0]?.title).toBe("Beta article"));
  await act(async () => {
    old.resolve(response("Alpha article"));
  });
  expect(state.allCommands.map((command) => command.title)).toEqual(["Beta article"]);
});

it("clears errors for new input and suppresses requests and results when disabled", async () => {
  const fetch = vi.fn(async () => Response.json({ message: "Unavailable" }, { status: 503 }));
  vi.stubGlobal("fetch", fetch);
  await render("alpha");
  await settle(() => expect(state.isError).toBe(true));
  await render("beta", false);
  expect(state.isError).toBe(false);
  expect(state.isLoading).toBe(false);
  expect(state.hasRemoteQuery).toBe(false);
  expect(state.allCommands).toEqual([]);
  await render("beta");
  expect(state.isError).toBe(false);
  expect(state.isLoading).toBe(true);
  await settle(() => expect(fetch).toHaveBeenCalledTimes(2));
});
