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
    toggleDashboard: (state) => {
      state.dashboard.isOpen = !state.dashboard.isOpen;
    },
  },
});

export const { toggleSheet, setThemeVariant, toggleDashboard } = uiSlice.actions;

export const selectIsSheetOpen = (state: RootState) => state.ui.sheet?.isOpen ?? false;
export const selectThemeVariant = (state: RootState) => state.ui.theme?.variant ?? "glass";
export const selectIsDashboardOpen = (state: RootState) => state.ui.dashboard?.isOpen ?? false;

export default uiSlice.reducer;
