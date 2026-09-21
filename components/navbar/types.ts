"use client";

export type NavigationId = "chronicle" | "daily" | "travelogue" | "more";

export type MegaPanelContentProps = {
  id: NavigationId;
  onNavigate: (href: string) => void;
  reduceMotion: boolean;
};
