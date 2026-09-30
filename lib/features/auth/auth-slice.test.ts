import { describe, expect, it } from "vitest";

import { authSlice, setCredentials } from "./auth-slice";

const credentials = (overrides: Partial<Parameters<typeof setCredentials>[0]> = {}) => ({
  accessToken: "new-access",
  refreshToken: "new-refresh",
  username: "new-user",
  email: "new@example.com",
  roles: ["ROLE_USER"],
  ...overrides,
});

describe("auth credentials", () => {
  it("replaces session-only values when switching accounts", () => {
    const state = authSlice.reducer(
      undefined,
      setCredentials({
        accessToken: "old-access",
        refreshToken: "old-refresh",
        username: "old-user",
        email: "old@example.com",
        roles: ["ROLE_ADMIN"],
        permissions: ["post:write"],
      })
    );

    const next = authSlice.reducer(
      state,
      setCredentials(credentials({ refreshToken: undefined, email: undefined }))
    );

    expect(next).toMatchObject({
      accessToken: "new-access",
      refreshToken: null,
      username: "new-user",
      email: null,
      permissions: [],
    });
  });

  it("preserves permissions and profile details during a same-user token refresh", () => {
    const state = authSlice.reducer(
      undefined,
      setCredentials({
        accessToken: "old-access",
        refreshToken: "old-refresh",
        username: "same-user",
        email: "same@example.com",
        roles: ["ROLE_ADMIN"],
        permissions: ["post:write"],
      })
    );

    const next = authSlice.reducer(
      state,
      setCredentials({
        accessToken: "new-access",
        refreshToken: "new-refresh",
        username: "same-user",
        roles: ["ROLE_ADMIN"],
      })
    );

    expect(next.email).toBe("same@example.com");
    expect(next.permissions).toEqual(["post:write"]);
    expect(next.refreshToken).toBe("new-refresh");
  });
});
