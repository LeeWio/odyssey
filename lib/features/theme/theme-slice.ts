import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeVariant = "default" | "glass" | "mouve" | "brutalism";

export interface ThemeState {
  variant: ThemeVariant;
}

const initialState: ThemeState = {
  variant: "brutalism",
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeVariant: (state, action: PayloadAction<ThemeVariant>) => {
      state.variant = action.payload;
    },
  },
  selectors: {
    selectThemeVariant: (state) => state.variant,
  },
});

export const { setThemeVariant } = themeSlice.actions;
export const { selectThemeVariant } = themeSlice.selectors;
