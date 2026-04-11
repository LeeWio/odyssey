import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "./types";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

/**
 * Authentication slice responsible for managing global user identity and session state.
 *
 * This slice serves as a centralized data store for authenticated user information.
 * Asynchronous operations (loading, errors, etc.) should be handled by specialized
 * layers like RTK Query, while this slice focuses strictly on the identity persistence.
 */
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Updates the global state with provided user credentials.
     * Sets `isAuthenticated` to true and populates the `user` object.
     *
     * @param state - The current authentication state.
     * @param action - Payload containing the `User` object.
     */
    setCredentials: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    /**
     * Resets the authentication state to its initial unauthenticated form.
     * Clears user data and sets `isAuthenticated` to false.
     *
     * Useful for sign-out or session expiration flows.
     */
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;

export default authSlice.reducer;
