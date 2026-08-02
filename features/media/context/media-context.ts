"use client";

import { createContext } from "react";
import { MediaPlayerAPI, PlayerState } from "../types";

export interface MediaContextValue extends PlayerState, MediaPlayerAPI {}

export const MediaContext = createContext<MediaContextValue | undefined>(undefined);
