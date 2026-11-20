import { describe, expect, it } from "vitest";
import overlayReducer, {
  setAuthMode,
  setLoginOpen,
  setMomentPublisherOpen,
  setSignUpOpen,
} from "./overlay-slice";
import shellReducer, { openDashboardAtPath } from "./shell-slice";

describe("auth dialog compatibility", () => {
  it("keeps legacy entry points mutually exclusive", () => {
    const signup = overlayReducer(undefined, setSignUpOpen(true));
    const login = overlayReducer(signup, setLoginOpen(true));
    expect(login.authDialogs).toEqual({
      authMode: "login",
      isLoginOpen: true,
      isSignUpOpen: false,
    });
    expect(overlayReducer(login, setSignUpOpen(true)).authDialogs).toEqual({
      authMode: "signup",
      isLoginOpen: false,
      isSignUpOpen: true,
    });
  });

  it("ignores an old view's close action after switching", () => {
    const signup = overlayReducer(undefined, setAuthMode("signup"));
    expect(overlayReducer(signup, setLoginOpen(false)).authDialogs).toEqual(signup.authDialogs);
    const login = overlayReducer(signup, setAuthMode("login"));
    expect(overlayReducer(login, setSignUpOpen(false)).authDialogs).toEqual(login.authDialogs);
  });

  it("clears the active view through either close API", () => {
    const login = overlayReducer(undefined, setAuthMode("login"));
    const closed = { authMode: null, isLoginOpen: false, isSignUpOpen: false };
    expect(overlayReducer(login, setLoginOpen(false)).authDialogs).toEqual(closed);
    const signup = overlayReducer(login, setAuthMode("signup"));
    expect(overlayReducer(signup, setSignUpOpen(false)).authDialogs).toEqual(closed);
    expect(overlayReducer(signup, setAuthMode(null)).authDialogs).toEqual(closed);
  });
});

describe("moment publisher", () => {
  it("opens and closes the composer", () => {
    const opened = overlayReducer(undefined, setMomentPublisherOpen(true));
    expect(opened.momentPublisher).toEqual({ isOpen: true });
    expect(overlayReducer(opened, setMomentPublisherOpen(false)).momentPublisher).toEqual({
      isOpen: false,
    });
  });
});

describe("dashboard navigation", () => {
  it("opens the dashboard at a requested view", () => {
    expect(shellReducer(undefined, openDashboardAtPath("/comments")).dashboard).toEqual({
      isOpen: true,
      path: "/comments",
    });
  });
});
