import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { JSONContent } from "@tiptap/react";
import type { RootState } from "../../store";

interface OverlayState {
  authDialogs: {
    authMode: "login" | "signup" | null;
    isLoginOpen: boolean;
    isSignUpOpen: boolean;
  };
  richText: {
    isOpen: boolean;
    activeId: string | null;
    initialValue: JSONContent | null;
    isReadOnly: boolean;
  };
  momentPublisher: { isOpen: boolean };
}

const initialState: OverlayState = {
  authDialogs: { authMode: null, isLoginOpen: false, isSignUpOpen: false },
  richText: { isOpen: false, activeId: null, initialValue: null, isReadOnly: false },
  momentPublisher: { isOpen: false },
};

export const overlaySlice = createSlice({
  name: "overlay",
  initialState,
  reducers: {
    setLoginOpen: (state, action: PayloadAction<boolean>) => {
      state.authDialogs.isLoginOpen = action.payload;
      if (action.payload) {
        state.authDialogs.authMode = "login";
        state.authDialogs.isSignUpOpen = false;
      } else if (state.authDialogs.authMode === "login") {
        state.authDialogs.authMode = null;
      }
    },
    setSignUpOpen: (state, action: PayloadAction<boolean>) => {
      state.authDialogs.isSignUpOpen = action.payload;
      if (action.payload) {
        state.authDialogs.authMode = "signup";
        state.authDialogs.isLoginOpen = false;
      } else if (state.authDialogs.authMode === "signup") {
        state.authDialogs.authMode = null;
      }
    },
    setAuthMode: (state, action: PayloadAction<"login" | "signup" | null>) => {
      state.authDialogs.authMode = action.payload;
      state.authDialogs.isLoginOpen = action.payload === "login";
      state.authDialogs.isSignUpOpen = action.payload === "signup";
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
    setMomentPublisherOpen: (state, action: PayloadAction<boolean>) => {
      state.momentPublisher.isOpen = action.payload;
    },
  },
});

export const {
  setLoginOpen,
  setSignUpOpen,
  setAuthMode,
  toggleRichText,
  setActiveId,
  openRichText,
  closeRichText,
  setMomentPublisherOpen,
} = overlaySlice.actions;

export const selectIsLoginOpen = (state: RootState) =>
  state.overlay?.authDialogs?.isLoginOpen ?? false;
export const selectIsSignUpOpen = (state: RootState) =>
  state.overlay?.authDialogs?.isSignUpOpen ?? false;
export const selectAuthMode = (state: RootState) => state.overlay?.authDialogs?.authMode ?? null;
export const selectIsRichTextOpen = (state: RootState) => state.overlay?.richText?.isOpen ?? false;
export const selectActiveId = (state: RootState) => state.overlay?.richText?.activeId ?? null;
export const selectRichTextState = (state: RootState) =>
  state.overlay?.richText ?? initialState.richText;
export const selectIsMomentPublisherOpen = (state: RootState) =>
  state.overlay?.momentPublisher?.isOpen ?? false;

export default overlaySlice.reducer;
