import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

interface ShellState {
  sheet: { isOpen: boolean };
  miniPlayer: { isOpen: boolean };
}

const initialState: ShellState = {
  sheet: { isOpen: false },
  miniPlayer: { isOpen: false },
};

export const shellSlice = createSlice({
  name: "shell",
  initialState,
  reducers: {
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
  },
});

export const { toggleSheet, setSheetOpen, toggleMiniPlayer, setMiniPlayerOpen } =
  shellSlice.actions;

export const selectIsSheetOpen = (state: RootState) => state.shell?.sheet?.isOpen ?? false;
export const selectIsMiniPlayerOpen = (state: RootState) =>
  state.shell?.miniPlayer?.isOpen ?? false;

export default shellSlice.reducer;
