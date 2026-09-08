import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { JSONContent } from "@tiptap/react";
import type { RootState } from "../../store";
import { DEFAULT_THEME_VARIANT, type ThemeVariant } from "../../theme";

export type { ThemeVariant } from "../../theme";

interface UiState {
  authDialogs: {
    authMode: "login" | "signup" | null;
    isLoginOpen: boolean;
    isSignUpOpen: boolean;
  };
  sheet: {
    isOpen: boolean;
  };
  miniPlayer: {
    isOpen: boolean;
  };
  theme: {
    variant: ThemeVariant;
  };
  dashboard: {
    isOpen: boolean;
  };
  richText: {
    isOpen: boolean;
    activeId: string | null;
    initialValue: JSONContent | null;
    isReadOnly: boolean;
  };
}

const initialState: UiState = {
  authDialogs: {
    authMode: null,
    isLoginOpen: false,
    isSignUpOpen: false,
  },
  sheet: {
    isOpen: false,
  },
  miniPlayer: {
    isOpen: false,
  },
  theme: {
    variant: DEFAULT_THEME_VARIANT,
  },
  dashboard: {
    isOpen: false,
  },
  richText: {
    isOpen: false,
    activeId: null,
    initialValue: null,
    isReadOnly: false,
  },
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLoginOpen: (state, action: PayloadAction<boolean>) => {
      state.authDialogs ??= { authMode: null, isLoginOpen: false, isSignUpOpen: false };
      state.authDialogs.isLoginOpen = action.payload;
      if (action.payload) {
        state.authDialogs.authMode = "login";
        state.authDialogs.isSignUpOpen = false;
      } else if (state.authDialogs.authMode === "login") {
        state.authDialogs.authMode = null;
      }
    },
    setSignUpOpen: (state, action: PayloadAction<boolean>) => {
      state.authDialogs ??= { authMode: null, isLoginOpen: false, isSignUpOpen: false };
      state.authDialogs.isSignUpOpen = action.payload;
      if (action.payload) {
        state.authDialogs.authMode = "signup";
        state.authDialogs.isLoginOpen = false;
      } else if (state.authDialogs.authMode === "signup") {
        state.authDialogs.authMode = null;
      }
    },
    setAuthMode: (state, action: PayloadAction<"login" | "signup" | null>) => {
      state.authDialogs ??= { authMode: null, isLoginOpen: false, isSignUpOpen: false };
      state.authDialogs.authMode = action.payload;
      state.authDialogs.isLoginOpen = action.payload === "login";
      state.authDialogs.isSignUpOpen = action.payload === "signup";
    },
    toggleSheet: (state) => {
      state.sheet.isOpen = !state.sheet.isOpen;
    },
    setSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.sheet.isOpen = action.payload;
    },
    toggleMiniPlayer: (state) => {
      state.miniPlayer.isOpen = !state.miniPlayer.isOpen;
    },
    setMiniPlayerOpen: (state, action: PayloadAction<boolean>) => {
      state.miniPlayer.isOpen = action.payload;
    },
    setThemeVariant: (state, action: PayloadAction<ThemeVariant>) => {
      state.theme.variant = action.payload;
    },
    toggleDashboard: (state) => {
      state.dashboard.isOpen = !state.dashboard.isOpen;
    },
    toggleRichText: (state) => {
      state.richText.isOpen = !state.richText.isOpen;
    },
    setActiveId: (state, action: PayloadAction<string | null>) => {
      state.richText.activeId = action.payload;
    },
    openRichText: (
      state,
      action: PayloadAction<{
        activeId: string;
        initialValue?: JSONContent | null;
        isReadOnly?: boolean;
      }>
    ) => {
      state.richText.isOpen = true;
      state.richText.activeId = action.payload.activeId;
      state.richText.initialValue = action.payload.initialValue ?? null;
      state.richText.isReadOnly = action.payload.isReadOnly ?? false;
    },
    closeRichText: (state) => {
      state.richText.isOpen = false;
    },
  },
});

export const {
  setLoginOpen,
  setSignUpOpen,
  setAuthMode,
  toggleSheet,
  setSheetOpen,
  toggleMiniPlayer,
  setMiniPlayerOpen,
  setThemeVariant,
  toggleDashboard,
  toggleRichText,
  setActiveId,
  openRichText,
  closeRichText,
} = uiSlice.actions;

export const selectIsLoginOpen = (state: RootState) => state.ui.authDialogs?.isLoginOpen ?? false;
export const selectIsSignUpOpen = (state: RootState) => state.ui.authDialogs?.isSignUpOpen ?? false;
export const selectAuthMode = (state: RootState) => state.ui.authDialogs?.authMode ?? null;
export const selectIsSheetOpen = (state: RootState) => state.ui.sheet?.isOpen;
export const selectIsMiniPlayerOpen = (state: RootState) => state.ui.miniPlayer?.isOpen ?? false;
export const selectThemeVariant = (state: RootState) => state.ui.theme?.variant;
export const selectIsDashboardOpen = (state: RootState) => state.ui.dashboard?.isOpen;
export const selectIsRichTextOpen = (state: RootState) => state.ui.richText?.isOpen;
export const selectActiveId = (state: RootState) => state.ui.richText?.activeId;
export const selectRichTextState = (state: RootState) => state.ui.richText;

export default uiSlice.reducer;
