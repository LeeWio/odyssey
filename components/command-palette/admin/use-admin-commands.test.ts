import { configureStore } from "@reduxjs/toolkit";
import { act, createElement, useLayoutEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Provider } from "react-redux";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { authSlice, setCredentials } from "@/lib/features/auth/auth-slice";
import { overlaySlice } from "@/lib/features/ui/overlay-slice";
import { CommandIntent, type ActionCommand } from "../types";
import { useAdminCommands } from "./use-admin-commands";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const createStore = () =>
  configureStore({
    reducer: {
      auth: authSlice.reducer,
      overlay: overlaySlice.reducer,
    },
  });

let store: ReturnType<typeof createStore>;
let root: Root;
let commands: ReturnType<typeof useAdminCommands>;

function Harness() {
  const value = useAdminCommands();
  useLayoutEffect(() => {
    commands = value;
  });
  return null;
}

async function render() {
  await act(async () => {
    root.render(createElement(Provider, { store, children: createElement(Harness) }));
  });
}

beforeEach(() => {
  store = createStore();
  commands = [];
  root = createRoot(document.createElement("div"));
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
});

it("opens a new article editor session from the command palette", async () => {
  store.dispatch(
    setCredentials({
      accessToken: "token",
      username: "admin",
      roles: ["ROLE_ADMIN"],
    })
  );

  await render();

  const editor = commands.find((command) => command.id === "admin-rich-text");
  expect(editor?.intent).toBe(CommandIntent.EXECUTE);

  await act(async () => {
    await (editor as ActionCommand).payload.action();
  });

  expect(store.getState().overlay.richText).toMatchObject({
    isOpen: true,
    activeId: "new",
    isReadOnly: false,
  });
});

it("mounts the article editor only after the palette command sets an active id", async () => {
  function EditorGate() {
    const [state, setState] = useState(store.getState().overlay.richText);
    useLayoutEffect(() => store.subscribe(() => setState(store.getState().overlay.richText)), []);
    return state.isOpen && state.activeId
      ? createElement("div", { role: "dialog", "aria-label": "Create article" })
      : null;
  }

  const container = document.createElement("div");
  document.body.append(container);
  const gate = createRoot(container);
  await act(async () => {
    gate.render(createElement(EditorGate));
  });
  expect(container.querySelector("[role='dialog']")).toBeNull();

  store.dispatch(
    setCredentials({
      accessToken: "token",
      username: "admin",
      roles: ["ROLE_ADMIN"],
    })
  );
  await render();
  const editor = commands.find((command) => command.id === "admin-rich-text") as ActionCommand;

  await act(async () => {
    await editor.payload.action();
  });

  expect(container.querySelector("[role='dialog']")?.getAttribute("aria-label")).toBe(
    "Create article"
  );

  act(() => {
    gate.unmount();
  });
  container.remove();
});
