import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { DEFAULT_THEME_VARIANT, type ThemeVariant } from "../../theme";
import { JSONContent } from "@tiptap/react";

export type { ThemeVariant } from "../../theme";

interface UiState {
  sheet: {
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
  sheet: {
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
    toggleSheet: (state) => {
      state.sheet.isOpen = !state.sheet.isOpen;
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
  toggleSheet,
  setThemeVariant,
  toggleDashboard,
  toggleRichText,
  setActiveId,
  openRichText,
  closeRichText,
} = uiSlice.actions;

export const selectIsSheetOpen = (state: RootState) => state.ui.sheet?.isOpen;
export const selectThemeVariant = (state: RootState) => state.ui.theme?.variant;
export const selectIsDashboardOpen = (state: RootState) => state.ui.dashboard?.isOpen;
export const selectIsRichTextOpen = (state: RootState) => state.ui.richText?.isOpen;
export const selectActiveId = (state: RootState) => state.ui.richText?.activeId;
export const selectRichTextState = (state: RootState) => state.ui.richText;

export default uiSlice.reducer;
