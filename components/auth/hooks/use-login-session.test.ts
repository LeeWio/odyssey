import { act, createElement, StrictMode, useEffect, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The unit runner aliases @heroui/react to a null-component mock, so these tests
 * exercise the request lifetime and review state without rendering HeroUI controls.
 */
const sendOtp = vi.fn();
const loginWithOtp = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/features/auth", () => ({
  useSendOtpMutation: () => [sendOtp, { isLoading: false }],
  useLoginWithOtpMutation: () => [loginWithOtp, { isLoading: false }],
}));

import { useLoginSession } from "./use-login-session";

const loginMutations = {
  sendOtp: (...args: Parameters<typeof sendOtp>) => sendOtp(...args),
  loginWithOtp: (...args: Parameters<typeof loginWithOtp>) => loginWithOtp(...args),
};

let root: Root;
let container: HTMLDivElement;
let loginSession: ReturnType<typeof useLoginSession>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function render(node: ReactNode) {
  await act(async () => {
    root.render(createElement(StrictMode, null, node));
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  sendOtp.mockReset();
  loginWithOtp.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function LoginHarness({ active }: { active: boolean }) {
  const session = useLoginSession(active, loginMutations);
  useEffect(() => {
    loginSession = session;
  });
  return createElement("output", null, `${session.step}:${session.email}:${session.isActive}`);
}

describe("login request lifetime", () => {
  it("drops a verification-code response that arrives after the dialog closes", async () => {
    const pending = deferred<void>();
    sendOtp.mockReturnValue({ unwrap: () => pending.promise });

    function Host() {
      const [active, setActive] = useState(true);
      return createElement(
        "div",
        null,
        createElement("button", { type: "button", onClick: () => setActive(false) }, "close"),
        createElement(LoginHarness, { active })
      );
    }

    await render(createElement(Host));
    await act(async () => {
      loginSession.setEmail("ada@example.com");
    });
    let submitted!: Promise<void>;
    await act(async () => {
      submitted = loginSession.submitEmail();
    });
    expect(sendOtp).toHaveBeenCalledWith({ email: "ada@example.com" });

    await act(async () => {
      container.querySelector("button")?.click();
    });
    await act(async () => {
      pending.resolve();
      await submitted;
    });

    expect(loginSession.step).toBe(1);
    expect(container.textContent).toContain("1:");
  });

  it("starts a reopened login at the email step", async () => {
    sendOtp.mockReturnValue({ unwrap: () => Promise.resolve() });

    function Host() {
      const [active, setActive] = useState(true);
      return createElement(
        "div",
        null,
        createElement(
          "button",
          { type: "button", onClick: () => setActive((current) => !current) },
          "toggle"
        ),
        createElement(LoginHarness, { active })
      );
    }

    await render(createElement(Host));
    await act(async () => {
      loginSession.setEmail("ada@example.com");
    });
    await act(async () => {
      await loginSession.submitEmail();
    });
    expect(loginSession.step).toBe(2);

    const toggle = container.querySelector("button");
    await act(async () => {
      toggle?.click();
    });
    await act(async () => {
      toggle?.click();
    });

    expect(loginSession.step).toBe(1);
    expect(loginSession.email).toBe("");
  });

  it("does not close the dialog when login resolves after dismissal", async () => {
    const pending = deferred<void>();
    const onSuccess = vi.fn();
    loginWithOtp.mockReturnValue({ unwrap: () => pending.promise });

    function Host() {
      const [active, setActive] = useState(true);
      return createElement(
        "div",
        null,
        createElement("button", { type: "button", onClick: () => setActive(false) }, "close"),
        createElement(LoginHarness, { active })
      );
    }

    await render(createElement(Host));
    let completed!: Promise<void>;
    await act(async () => {
      completed = loginSession.completeOtp("123456", onSuccess);
    });
    await act(async () => {
      container.querySelector("button")?.click();
    });
    await act(async () => {
      pending.resolve();
      await completed;
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
