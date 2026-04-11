import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";

// Base auth state
export const selectAuth = (state: RootState) => state.auth;

// Specific selectors
export const selectUser = createSelector(selectAuth, (auth) => auth.user);

export const selectIsAuthenticated = createSelector(
  selectAuth,
  (auth) => auth.isAuthenticated
);
