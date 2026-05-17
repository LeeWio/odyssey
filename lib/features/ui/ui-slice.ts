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
}

const initialState: UiState = {
  sheet: {
    isOpen: false,
  },
  theme: {
    variant: "glass",
  },
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Sheet actions
    setSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.sheet.isOpen = action.payload;
    },
    toggleSheet: (state) => {
      state.sheet.isOpen = !state.sheet.isOpen;
    },
    // Theme actions
    setThemeVariant: (state, action: PayloadAction<ThemeVariant>) => {
      state.theme.variant = action.payload;
    },
  },
});

export const { setSheetOpen, toggleSheet, setThemeVariant } = uiSlice.actions;

export const selectIsSheetOpen = (state: RootState) => state.ui.sheet.isOpen;
export const selectThemeVariant = (state: RootState) => state.ui.theme.variant;

export default uiSlice.reducer;
