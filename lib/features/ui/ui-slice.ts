import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { DEFAULT_THEME_VARIANT, type ThemeVariant } from "../../theme";

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
    draftIdentifier: string | null;
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
    draftIdentifier: null,
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
    setDraftIdentifier: (state, action: PayloadAction<string | null>) => {
      state.richText.draftIdentifier = action.payload;
    },
  },
});

export const { toggleSheet, setThemeVariant, toggleDashboard, toggleRichText, setDraftIdentifier } =
  uiSlice.actions;

export const selectIsSheetOpen = (state: RootState) => state.ui.sheet?.isOpen;
export const selectThemeVariant = (state: RootState) => state.ui.theme?.variant;
export const selectIsDashboardOpen = (state: RootState) => state.ui.dashboard?.isOpen;
export const selectIsRichTextOpen = (state: RootState) => state.ui.richText?.isOpen;
export const selectDraftIdentifier = (state: RootState) => state.ui.richText?.draftIdentifier;

export default uiSlice.reducer;
