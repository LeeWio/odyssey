"use client";

import { useContext } from "react";
import { MediaContext, MediaContextValue } from "../context/media-context";

export const useMediaPlayer = (): MediaContextValue => {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error("useMediaPlayer must be used within a MediaProvider");
  }
  return context;
};
