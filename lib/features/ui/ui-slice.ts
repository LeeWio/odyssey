import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";

export type ThemeVariant = "default" | "glass" | "mouve" | "brutalism";

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
}

const initialState: UiState = {
  sheet: {
    isOpen: false,
  },
  theme: {
    variant: "glass",
  },
  dashboard: {
    isOpen: false,
  },
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSheet: (state) => {
      state.sheet.isOpen = !state.sheet.isOpen;
    },
    // Theme actions
    setThemeVariant: (state, action: PayloadAction<ThemeVariant>) => {
      state.theme.variant = action.payload;
    },
    // Dashboard actions
    setDashboardOpen: (state, action: PayloadAction<boolean>) => {
      state.dashboard.isOpen = action.payload;
    },
  },
});

export const { toggleSheet, setThemeVariant, setDashboardOpen } = uiSlice.actions;

export const selectIsSheetOpen = (state: RootState) => state.ui.sheet.isOpen;
export const selectThemeVariant = (state: RootState) => state.ui.theme.variant;
export const selectIsDashboardOpen = (state: RootState) => state.ui.dashboard.isOpen;

export default uiSlice.reducer;
