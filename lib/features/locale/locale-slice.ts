import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface LocaleState {
  value: string;
}

const initialState: LocaleState = {
  value: "en",
};

export const localeSlice = createSlice({
  name: "locale",
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    },
  },
  selectors: {
    selectLocale: (state) => state.value,
  },
});

export const { setLocale } = localeSlice.actions;
export const { selectLocale } = localeSlice.selectors;
