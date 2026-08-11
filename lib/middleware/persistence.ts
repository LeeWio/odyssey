"use client";

import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { removeCredentials, setCredentials, setPermissions } from "../features/auth/auth-slice";
import { setLocale } from "../features/locale/locale-slice";
import { setActiveId, setThemeVariant, type ThemeVariant } from "../features/ui";
import type { RootState } from "../store";
import {
  coerceThemeVariant,
  DEFAULT_THEME_VARIANT,
  LEGACY_THEME_STORAGE_KEY,
  THEME_COOKIE_OPTIONS,
  THEME_VARIANT_STORAGE_KEY,
} from "../theme";

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
        // Persist session data only. Dialog visibility belongs to the UI slice and must reset on load.
        localStorage.setItem(
          "odyssey_auth",
          JSON.stringify({
            accessToken: auth.accessToken,
            refreshToken: auth.refreshToken,
            username: auth.username,
            email: auth.email,
            roles: auth.roles,
            permissions: auth.permissions,
            isAuthenticated: auth.isAuthenticated,
          })
        );
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
      const variant = coerceThemeVariant(action.payload);

      localStorage.setItem(THEME_VARIANT_STORAGE_KEY, variant);
      localStorage.setItem(LEGACY_THEME_STORAGE_KEY, variant);
      document.cookie = `${THEME_VARIANT_STORAGE_KEY}=${encodeURIComponent(
        variant
      )}; ${THEME_COOKIE_OPTIONS}`;
      document.cookie = `${LEGACY_THEME_STORAGE_KEY}=${encodeURIComponent(
        variant
      )}; ${THEME_COOKIE_OPTIONS}`;
    }
  },
});

// Start listening for Draft Identifier changes
persistenceMiddleware.startListening({
  actionCreator: setActiveId,
  effect: (action) => {
    if (typeof window !== "undefined") {
      if (action.payload) {
        localStorage.setItem("odyssey_draft_id", action.payload);
      } else {
        localStorage.removeItem("odyssey_draft_id");
      }
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
    const theme =
      localStorage.getItem(THEME_VARIANT_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    const locale = localStorage.getItem("odyssey_locale");
    const draftId = localStorage.getItem("odyssey_draft_id");

    const preloadedState: Record<string, unknown> = {};

    if (auth) {
      const persistedAuth = JSON.parse(auth) as Record<string, unknown>;
      // Reconstruct the durable shape explicitly so legacy UI fields are ignored.
      preloadedState.auth = {
        accessToken:
          typeof persistedAuth.accessToken === "string" ? persistedAuth.accessToken : null,
        refreshToken:
          typeof persistedAuth.refreshToken === "string" ? persistedAuth.refreshToken : null,
        username: typeof persistedAuth.username === "string" ? persistedAuth.username : null,
        email: typeof persistedAuth.email === "string" ? persistedAuth.email : null,
        roles: Array.isArray(persistedAuth.roles)
          ? persistedAuth.roles.filter((role): role is string => typeof role === "string")
          : [],
        permissions: Array.isArray(persistedAuth.permissions)
          ? persistedAuth.permissions.filter(
              (permission): permission is string => typeof permission === "string"
            )
          : [],
        isAuthenticated:
          persistedAuth.isAuthenticated === true &&
          typeof persistedAuth.accessToken === "string" &&
          persistedAuth.accessToken.length > 0,
      };
    }
    if (theme || draftId) {
      const variant = theme ? coerceThemeVariant(theme) : DEFAULT_THEME_VARIANT;

      preloadedState.ui = {
        authDialogs: { isLoginOpen: false, isSignUpOpen: false },
        theme: { variant: variant as ThemeVariant },
        sheet: { isOpen: false },
        dashboard: { isOpen: false },
        richText: { isOpen: false, activeId: draftId || null },
      };

      // Self-heal/sync localStorage configuration to Cookie on client load
      if (theme) {
        const match = document.cookie.match(
          new RegExp(`(?:^|; )${THEME_VARIANT_STORAGE_KEY}=([^;]*)`)
        );
        if (!match || decodeURIComponent(match[1]) !== variant) {
          document.cookie = `${THEME_VARIANT_STORAGE_KEY}=${encodeURIComponent(
            variant
          )}; ${THEME_COOKIE_OPTIONS}`;
          document.cookie = `${LEGACY_THEME_STORAGE_KEY}=${encodeURIComponent(
            variant
          )}; ${THEME_COOKIE_OPTIONS}`;
        }
      }
    }
    if (locale) preloadedState.locale = { value: locale };

    return preloadedState;
  } catch (e) {
    console.error("Failed to load persisted state", e);
    return undefined;
  }
};
