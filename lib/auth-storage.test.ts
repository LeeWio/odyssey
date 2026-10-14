import { afterEach, describe, expect, it } from "vitest";

import {
  AUTH_PERSISTENCE_MS,
  clearAuthStorage,
  readAuthStorage,
  writeAuthStorage,
} from "./auth-storage";

const persisted = (persistedAt: number) =>
  JSON.stringify({
    accessToken: "access",
    persistedAt,
  });

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("auth storage", () => {
  it("keeps a login in localStorage across browser restarts", () => {
    sessionStorage.setItem("odyssey_auth", persisted(1));

    const value = persisted(Date.now());
    writeAuthStorage(value);

    expect(localStorage.getItem("odyssey_auth")).toBe(value);
    expect(sessionStorage.getItem("odyssey_auth")).toBeNull();
    expect(readAuthStorage()).toBe(value);
  });

  it("keeps a login for seven days", () => {
    const persistedAt = 1_000;
    const value = persisted(persistedAt);
    localStorage.setItem("odyssey_auth", value);

    expect(readAuthStorage(persistedAt + AUTH_PERSISTENCE_MS - 1)).toBe(value);
    expect(localStorage.getItem("odyssey_auth")).toBe(value);
  });

  it("drops a login once seven days have passed", () => {
    const persistedAt = 1_000;
    localStorage.setItem("odyssey_auth", persisted(persistedAt));

    expect(readAuthStorage(persistedAt + AUTH_PERSISTENCE_MS)).toBeNull();
    expect(localStorage.getItem("odyssey_auth")).toBeNull();
  });

  it("keeps a legacy login that has no timestamp", () => {
    const value = JSON.stringify({ accessToken: "access" });
    localStorage.setItem("odyssey_auth", value);

    expect(readAuthStorage()).toBe(value);
  });

  it("clears both stores on logout", () => {
    sessionStorage.setItem("odyssey_auth", persisted(Date.now()));
    localStorage.setItem("odyssey_auth", persisted(Date.now()));

    clearAuthStorage();

    expect(sessionStorage.getItem("odyssey_auth")).toBeNull();
    expect(localStorage.getItem("odyssey_auth")).toBeNull();
  });
});
