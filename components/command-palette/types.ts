import React from "react";

export const COMMAND_CATEGORIES = ["AI", "Management", "Analytics", "Developer", "System"] as const;

export type CommandCategory = (typeof COMMAND_CATEGORIES)[number];

export const COMMAND_CATEGORY_ORDER: readonly CommandCategory[] = COMMAND_CATEGORIES;

export const COMMAND_CATEGORY_METADATA: Record<CommandCategory, { label: string }> = {
  AI: { label: "Smart Prompt Examples" },
  Management: { label: "Results (4)" },
  System: { label: "System Actions" },
  Analytics: { label: "Analytics" },
  Developer: { label: "Developer" },
};

export type CommandSource = "navigation" | "theme" | "ai" | "system" | "search";

export enum CommandIntent {
  NAVIGATE = "NAVIGATE",
  EXECUTE = "EXECUTE",
}

export interface NavigationPayload {
  href: string;
  external?: boolean;
}

export interface ExecutionPayload {
  action: () => void | Promise<void>;
  closeOnExecute?: boolean;
}

export interface BaseCommand {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  keywords: readonly string[];
  category: CommandCategory;
  source: CommandSource;
  shortcut?: readonly string[];
  order?: number;
  defaultVisible?: boolean;
  isActive?: boolean;
}

export interface NavigationCommand extends BaseCommand {
  intent: CommandIntent.NAVIGATE;
  payload: NavigationPayload;
}

export interface ActionCommand extends BaseCommand {
  intent: CommandIntent.EXECUTE;
  payload: ExecutionPayload;
}

export type CommandItem = NavigationCommand | ActionCommand;

export interface CommandGroup {
  id: string;
  heading: CommandCategory;
  commands: CommandItem[];
}
