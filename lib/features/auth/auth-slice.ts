import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  email: string | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoginOpen: boolean;
  isSignUpOpen: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  username: null,
  email: null,
  roles: [],
  permissions: [],
  isAuthenticated: false,
  isLoginOpen: false,
  isSignUpOpen: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoginOpen: (state, action: PayloadAction<boolean>) => {
      state.isLoginOpen = action.payload;
    },
    setSignUpOpen: (state, action: PayloadAction<boolean>) => {
      state.isSignUpOpen = action.payload;
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken?: string;
        username: string;
        email?: string;
        roles: string[];
        permissions?: string[];
      }>
    ) => {
      const { accessToken, refreshToken, username, email, roles, permissions } = action.payload;
      state.accessToken = accessToken;
      if (refreshToken !== undefined) state.refreshToken = refreshToken;
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
      state.refreshToken = null;
      state.username = null;
      state.email = null;
      state.roles = [];
      state.permissions = [];
      state.isAuthenticated = false;
    },
  },
  selectors: {
    selectCurrentToken: (state) => state.accessToken,
    selectRefreshToken: (state) => state.refreshToken,
    selectCurrentUser: (state) => state.username,
    selectUserEmail: (state) => state.email,
    selectIsAuthenticated: (state) => state.isAuthenticated,
    selectUserRoles: (state) => state.roles,
    selectUserPermissions: (state) => state.permissions,
    selectIsAdmin: (state) => state.roles.includes("ROLE_ADMIN"),
    selectIsLoginOpen: (state) => state.isLoginOpen,
    selectIsSignUpOpen: (state) => state.isSignUpOpen,
  },
});

export const { setLoginOpen, setSignUpOpen, setCredentials, setPermissions, removeCredentials } =
  authSlice.actions;

export const {
  selectCurrentToken,
  selectRefreshToken,
  selectCurrentUser,
  selectUserEmail,
  selectIsAuthenticated,
  selectUserRoles,
  selectUserPermissions,
  selectIsAdmin,
  selectIsLoginOpen,
  selectIsSignUpOpen,
} = authSlice.selectors;
