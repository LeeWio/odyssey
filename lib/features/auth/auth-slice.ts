import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  accessToken: string | null;
  username: string | null;
  email: string | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  username: null,
  email: null,
  roles: [],
  permissions: [],
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        username: string;
        email?: string;
        roles: string[];
        permissions?: string[];
      }>
    ) => {
      const { accessToken, username, email, roles, permissions } = action.payload;
      state.accessToken = accessToken;
      state.username = username;
      if (email !== undefined) state.email = email;
      state.roles = roles;
      state.isAuthenticated = true;
      if (permissions) {
        state.permissions = permissions;
      }
    },
    setPermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
    },
    removeCredentials: (state) => {
      state.accessToken = null;
      state.username = null;
      state.email = null;
      state.roles = [];
      state.permissions = [];
      state.isAuthenticated = false;
    },
  },
  selectors: {
    selectCurrentToken: (state) => state.accessToken,
    selectCurrentUser: (state) => state.username,
    selectUserEmail: (state) => state.email,
    selectIsAuthenticated: (state) => state.isAuthenticated,
    selectUserRoles: (state) => state.roles,
    selectUserPermissions: (state) => state.permissions,
    selectIsAdmin: (state) => state.roles.includes("ROLE_ADMIN"),
  },
});

export const { setCredentials, setPermissions, removeCredentials } = authSlice.actions;
export const {
  selectCurrentToken,
  selectCurrentUser,
  selectUserEmail,
  selectIsAuthenticated,
  selectUserRoles,
  selectUserPermissions,
  selectIsAdmin,
} = authSlice.selectors;
