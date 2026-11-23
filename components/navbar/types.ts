export type NavigationId = "chronicle" | "daily" | "more";

export type MegaPanelContentProps = {
  id: NavigationId;
  onNavigate: (href: string) => void;
  reduceMotion: boolean;
};
