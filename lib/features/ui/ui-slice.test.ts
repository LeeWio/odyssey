import { describe, expect, it } from "vitest";
import reducer, { setAuthMode, setLoginOpen, setSignUpOpen } from "./ui-slice";

describe("auth dialog compatibility", () => {
  it("keeps legacy entry points mutually exclusive", () => {
    const signup = reducer(undefined, setSignUpOpen(true));
    const login = reducer(signup, setLoginOpen(true));
    expect(login.authDialogs).toEqual({
      authMode: "login",
      isLoginOpen: true,
      isSignUpOpen: false,
    });
    expect(reducer(login, setSignUpOpen(true)).authDialogs).toEqual({
      authMode: "signup",
      isLoginOpen: false,
      isSignUpOpen: true,
    });
  });

  it("ignores an old view's close action after switching", () => {
    const signup = reducer(undefined, setAuthMode("signup"));
    expect(reducer(signup, setLoginOpen(false)).authDialogs).toEqual(signup.authDialogs);
    const login = reducer(signup, setAuthMode("login"));
    expect(reducer(login, setSignUpOpen(false)).authDialogs).toEqual(login.authDialogs);
  });

  it("clears the active view through either close API", () => {
    const login = reducer(undefined, setAuthMode("login"));
    const closed = { authMode: null, isLoginOpen: false, isSignUpOpen: false };
    expect(reducer(login, setLoginOpen(false)).authDialogs).toEqual(closed);
    const signup = reducer(login, setAuthMode("signup"));
    expect(reducer(signup, setSignUpOpen(false)).authDialogs).toEqual(closed);
    expect(reducer(signup, setAuthMode(null)).authDialogs).toEqual(closed);
  });
});
