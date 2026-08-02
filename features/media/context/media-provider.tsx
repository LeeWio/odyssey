"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MediaPlayer } from "../core/media-player";
import { MediaItem, PlayerState } from "../types";
import { MediaContext } from "./media-context";

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PlayerState>({
    queue: [],
    currentIndex: -1,
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    shuffle: false,
  });

  const playerRef = useRef<MediaPlayer | null>(null);

  useEffect(() => {
    const player = new MediaPlayer((newState) => {
      setState((prev) => ({ ...prev, ...newState }));
    });
    playerRef.current = player;

    return () => {
      player.destroy();
    };
  }, []);

  const play = useCallback((media: MediaItem) => {
    playerRef.current?.play(media);
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    playerRef.current?.resume();
  }, []);

  const toggle = useCallback(() => {
    playerRef.current?.toggle();
  }, []);

  const toggleShuffle = useCallback(() => {
    playerRef.current?.toggleShuffle();
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.stop();
  }, []);

  const next = useCallback(() => {
    playerRef.current?.next();
  }, []);

  const previous = useCallback(() => {
    playerRef.current?.previous();
  }, []);

  const seek = useCallback((seconds: number) => {
    playerRef.current?.seek(seconds);
  }, []);

  const setVolume = useCallback((volume: number) => {
    playerRef.current?.setVolume(volume);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      play,
      pause,
      resume,
      toggle,
      toggleShuffle,
      stop,
      next,
      previous,
      seek,
      setVolume,
    }),
    [state, play, pause, resume, toggle, toggleShuffle, stop, next, previous, seek, setVolume]
  );

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
};
