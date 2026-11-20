import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

interface ShellState {
  sheet: { isOpen: boolean };
  miniPlayer: { isOpen: boolean };
  dashboard: { isOpen: boolean; path: string };
}

const initialState: ShellState = {
  sheet: { isOpen: false },
  miniPlayer: { isOpen: false },
  dashboard: { isOpen: false, path: "/" },
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
    toggleDashboard: (state) => {
      state.dashboard.isOpen = !state.dashboard.isOpen;
    },
    setDashboardOpen: (state, action: PayloadAction<boolean>) => {
      state.dashboard.isOpen = action.payload;
    },
    setDashboardPath: (state, action: PayloadAction<string>) => {
      state.dashboard.path = action.payload;
    },
    openDashboardAtPath: (state, action: PayloadAction<string>) => {
      state.dashboard.isOpen = true;
      state.dashboard.path = action.payload;
    },
  },
});

export const {
  toggleSheet,
  setSheetOpen,
  toggleMiniPlayer,
  setMiniPlayerOpen,
  toggleDashboard,
  setDashboardOpen,
  setDashboardPath,
  openDashboardAtPath,
} = shellSlice.actions;

export const selectIsSheetOpen = (state: RootState) => state.shell?.sheet?.isOpen ?? false;
export const selectIsMiniPlayerOpen = (state: RootState) =>
  state.shell?.miniPlayer?.isOpen ?? false;
export const selectIsDashboardOpen = (state: RootState) => state.shell?.dashboard?.isOpen ?? false;
export const selectDashboardPath = (state: RootState) => state.shell?.dashboard?.path ?? "/";

export default shellSlice.reducer;
