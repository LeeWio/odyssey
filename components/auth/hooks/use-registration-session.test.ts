import { act, createElement, StrictMode, useEffect, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The unit runner aliases @heroui/react to a null-component mock, so these tests
 * exercise the request lifetime and review state without rendering HeroUI controls.
 */
const register = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/features/auth", () => ({
  useRegisterMutation: () => [register, { isLoading: false }],
}));

import { useRegistrationSession } from "./use-registration-session";

let root: Root;
let container: HTMLDivElement;
let registrationSession: ReturnType<typeof useRegistrationSession>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function SignupHarness({ active }: { active: boolean }) {
  const session = useRegistrationSession(active, register);
  useEffect(() => {
    registrationSession = session;
  });
  return createElement("output", null, session.isPendingReview ? "review" : "form");
}

async function render(node: ReactNode) {
  await act(async () => {
    root.render(createElement(StrictMode, null, node));
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  register.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("registration review", () => {
  it("waits for administrator approval and does not sign the visitor in", async () => {
    register.mockReturnValue({ unwrap: () => Promise.resolve() });
    await render(createElement(SignupHarness, { active: true }));

    await act(async () => {
      await registrationSession.submit({
        username: "ada",
        email: "ada@example.com",
        password: "Secret123",
      });
    });

    expect(register).toHaveBeenCalledWith({
      username: "ada",
      email: "ada@example.com",
      password: "Secret123",
    });
    expect(registrationSession.isPendingReview).toBe(true);
    expect(container.textContent).toContain("review");
  });

  it("ignores a registration that resolves after the dialog closes", async () => {
    const pending = deferred<void>();
    register.mockReturnValue({ unwrap: () => pending.promise });

    function Host() {
      const [active, setActive] = useState(true);
      return createElement(
        "div",
        null,
        createElement("button", { type: "button", onClick: () => setActive(false) }, "close"),
        createElement(SignupHarness, { active })
      );
    }

    await render(createElement(Host));
    let submitted!: Promise<void>;
    await act(async () => {
      submitted = registrationSession.submit({
        username: "ada",
        email: "ada@example.com",
        password: "Secret123",
      });
    });
    await act(async () => {
      container.querySelector("button")?.click();
    });
    await act(async () => {
      pending.resolve();
      await submitted;
    });

    expect(registrationSession.isPendingReview).toBe(false);
    expect(container.textContent).toContain("form");
  });
});
