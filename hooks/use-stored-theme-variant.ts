"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_THEME_VARIANT,
  getStoredThemeVariant,
  THEME_CHANGE_EVENT,
  type ThemeVariant,
} from "@/lib/theme";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

function getServerSnapshot(): ThemeVariant {
  return DEFAULT_THEME_VARIANT;
}

export function useStoredThemeVariant(): ThemeVariant {
  return useSyncExternalStore(subscribe, getStoredThemeVariant, getServerSnapshot);
}
