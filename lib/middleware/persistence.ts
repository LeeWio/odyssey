"use client";

import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { setCredentials, setPermissions, removeCredentials } from "../features/auth/auth-slice";
import { setThemeVariant } from "../features/ui";
import { setLocale } from "../features/locale/locale-slice";
import type { RootState } from "../store";

/**
 * RTK Listener Middleware for Persistence
 * This handles "Saving" state to localStorage on every relevant action.
 */
export const persistenceMiddleware = createListenerMiddleware();

// Start listening for Auth changes
persistenceMiddleware.startListening({
  matcher: isAnyOf(setCredentials, setPermissions, removeCredentials),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const auth = state.auth;

    if (typeof window !== "undefined") {
      if (auth.isAuthenticated) {
        localStorage.setItem("odyssey_auth", JSON.stringify(auth));
      } else {
        localStorage.removeItem("odyssey_auth");
      }
    }
  },
});

// Start listening for Theme changes
persistenceMiddleware.startListening({
  actionCreator: setThemeVariant,
  effect: (action) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("odyssey_theme", action.payload);
    }
  },
});

// Start listening for Locale changes
persistenceMiddleware.startListening({
  actionCreator: setLocale,
  effect: (action) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("odyssey_locale", action.payload);
    }
  },
});

/**
 * Helper to load state for preloading the store.
 * Safe for SSR (returns undefined on server).
 */
export const loadPersistedState = (): Partial<RootState> | undefined => {
  if (typeof window === "undefined") return undefined;

  try {
    const auth = localStorage.getItem("odyssey_auth");
    const theme = localStorage.getItem("odyssey_theme");
    const locale = localStorage.getItem("odyssey_locale");

    const preloadedState: Record<string, unknown> = {};

    if (auth) preloadedState.auth = JSON.parse(auth);
    if (theme) preloadedState.ui = { theme: { variant: theme }, sheet: { isOpen: false } };
    if (locale) preloadedState.locale = { value: locale };

    return preloadedState;
  } catch (e) {
    console.error("Failed to load persisted state", e);
    return undefined;
  }
};
