"use client";

import { Key } from "@heroui/react";
import type React from "react";

import {
  MagnifierIcon,
  SparklesIcon,
  ClockIcon,
  FileTextIcon,
  PersonsIcon,
  GearIcon,
  SunMaxFillIcon,
  MoonFillIcon,
  TargetIcon,
} from "@/components/icons";
import { selectThemeVariant, setThemeVariant, type ThemeVariant } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Command, EmptyState } from "@heroui-pro/react";
import { useHotkeys } from "react-hotkeys-hook";
import { Kbd, Chip, CloseButton } from "@heroui/react";

interface ThemeModeItem {
  id: "system-light-mode" | "system-dark-mode" | "system-theme-mode";
  label: string;
  keywords: readonly string[];
  value: "light" | "dark" | "system";
  icon: React.ElementType;
  defaultVisible?: boolean;
}

interface ThemeVariantItem {
  id:
    | "system-theme-default"
  | "system-theme-glass"
  | "system-theme-mouve"
  | "system-theme-brutalism";
  label: string;
  keywords: readonly string[];
  value: ThemeVariant;
  icon: React.ElementType;
  defaultVisible?: boolean;
}

const THEME_MODE_ITEMS: readonly ThemeModeItem[] = [
  {
    id: "system-light-mode",
    label: "Switch to Light Mode",
    keywords: ["light", "theme", "bright", "day mode", "appearance", "白天", "亮色", "浅色"],
    value: "light",
    icon: SunMaxFillIcon,
    defaultVisible: true,
  },
  {
    id: "system-dark-mode",
    label: "Switch to Dark Mode",
    keywords: ["dark", "theme", "night mode", "appearance", "深色", "暗黑", "夜间"],
    value: "dark",
    icon: MoonFillIcon,
    defaultVisible: true,
  },
  {
    id: "system-theme-mode",
    label: "Follow System Theme",
    keywords: ["system", "auto", "os", "device mode", "appearance", "自动", "系统", "跟随系统"],
    value: "system",
    icon: GearIcon,
    defaultVisible: true,
  },
];

const THEME_VARIANT_ITEMS: readonly ThemeVariantItem[] = [
  {
    id: "system-theme-default",
    label: "Apply Default Theme",
    keywords: ["default", "base", "standard", "reset", "variant", "skin", "默认", "基础", "重置"],
    value: "default",
    icon: GearIcon,
  },
  {
    id: "system-theme-glass",
    label: "Apply Glass Theme",
    keywords: ["glass", "frosted", "blur", "transparent", "variant", "skin", "玻璃", "毛玻璃", "透明"],
    value: "glass",
    icon: SparklesIcon,
  },
  {
    id: "system-theme-mouve",
    label: "Apply Mouve Theme",
    keywords: ["mouve", "mauve", "soft", "editorial", "variant", "skin", "莫兰迪", "紫灰"],
    value: "mouve",
    icon: GearIcon,
  },
  {
    id: "system-theme-brutalism",
    label: "Apply Brutalism Theme",
    keywords: ["brutalism", "bold", "graphic", "sharp", "variant", "skin", "野兽派", "粗野"],
    value: "brutalism",
    icon: TargetIcon,
  },
];

interface CommandItemConfig {
  id: string;
  group: string;
  groupOrder: number;
  label: string;
  keywords: readonly string[];
  icon: React.ElementType;
  defaultVisible?: boolean;
  isCurrent?: boolean;
  actionId?: CommandActionId;
}

type CommandActionId =
  | "set-theme-light"
  | "set-theme-dark"
  | "set-theme-system"
  | "set-theme-default"
  | "set-theme-glass"
  | "set-theme-mouve"
  | "set-theme-brutalism"
  | "open-workspace-settings";

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

const matchesSearchToken = (text: string, token: string) => {
  if (text.includes(token)) return true;

  let index = 0;

  for (const char of token) {
    index = text.indexOf(char, index);

    if (index === -1) {
      return false;
    }

    index += 1;
  }

  return true;
};

const commandFilter = (textValue: string, rawInputValue: string) => {
  const query = normalizeSearchText(rawInputValue);

  if (!query) return true;

  const normalizedText = normalizeSearchText(textValue);
  const tokens = query.split(" ");

  return tokens.every((token) => matchesSearchToken(normalizedText, token));
};

const buildSearchText = (label: string, keywords: readonly string[]) =>
  [label, ...keywords].join(" ");

const BASE_COMMAND_ITEMS: readonly CommandItemConfig[] = [
  {
    group: "Smart Prompt Examples",
    groupOrder: 1,
    id: "smart-summarize-week",
    label: "Summarize this week's progress",
    keywords: ["weekly progress", "summary", "本周进展", "总结"],
    icon: SparklesIcon,
    defaultVisible: true,
  },
  {
    group: "Smart Prompt Examples",
    groupOrder: 1,
    id: "smart-create-task",
    label: "Create a task for the team",
    keywords: ["task", "todo", "assign", "团队任务"],
    icon: SparklesIcon,
    defaultVisible: true,
  },
  {
    group: "Smart Prompt Examples",
    groupOrder: 1,
    id: "smart-draft-brief",
    label: "Draft a project brief",
    keywords: ["brief", "spec", "outline", "项目简介"],
    icon: SparklesIcon,
    defaultVisible: true,
  },
  {
    group: "Smart Prompt Examples",
    groupOrder: 1,
    id: "smart-schedule-standup",
    label: "Schedule a standup meeting",
    keywords: ["meeting", "sync", "standup", "会议", "站会"],
    icon: SparklesIcon,
    defaultVisible: true,
  },
  {
    group: "Results (4)",
    groupOrder: 2,
    id: "result-view-activity",
    label: "View recent activity",
    keywords: ["activity", "history", "updates", "最近活动"],
    icon: ClockIcon,
    defaultVisible: true,
  },
  {
    group: "Results (4)",
    groupOrder: 2,
    id: "result-project-roadmap",
    label: "Open project roadmap",
    keywords: ["roadmap", "plan", "timeline", "路线图"],
    icon: FileTextIcon,
    defaultVisible: true,
  },
  {
    group: "Results (4)",
    groupOrder: 2,
    id: "result-team-directory",
    label: "Browse team directory",
    keywords: ["people", "members", "coworkers", "团队成员"],
    icon: PersonsIcon,
    defaultVisible: true,
  },
  {
    group: "Results (4)",
    groupOrder: 2,
    id: "result-workspace-settings",
    label: "Manage workspace settings",
    keywords: ["preferences", "config", "设置", "工作区"],
    icon: GearIcon,
    defaultVisible: true,
  },
  {
    group: "System Actions",
    groupOrder: 3,
    id: "system-light-mode",
    label: "Switch to Light Mode",
    keywords: THEME_MODE_ITEMS[0].keywords,
    icon: SunMaxFillIcon,
    defaultVisible: true,
    actionId: "set-theme-light",
  },
  {
    group: "System Actions",
    groupOrder: 3,
    id: "system-dark-mode",
    label: "Switch to Dark Mode",
    keywords: THEME_MODE_ITEMS[1].keywords,
    icon: MoonFillIcon,
    defaultVisible: true,
    actionId: "set-theme-dark",
  },
  {
    group: "System Actions",
    groupOrder: 3,
    id: "system-theme-mode",
    label: "Follow System Theme",
    keywords: THEME_MODE_ITEMS[2].keywords,
    icon: GearIcon,
    defaultVisible: true,
    actionId: "set-theme-system",
  },
  {
    group: "System Actions",
    groupOrder: 3,
    id: "system-theme-default",
    label: "Apply Default Theme",
    keywords: THEME_VARIANT_ITEMS[0].keywords,
    icon: GearIcon,
    actionId: "set-theme-default",
  },
  {
    group: "System Actions",
    groupOrder: 3,
    id: "system-theme-glass",
    label: "Apply Glass Theme",
    keywords: THEME_VARIANT_ITEMS[1].keywords,
    icon: SparklesIcon,
    actionId: "set-theme-glass",
  },
  {
    group: "System Actions",
    groupOrder: 3,
    id: "system-theme-mouve",
    label: "Apply Mouve Theme",
    keywords: THEME_VARIANT_ITEMS[2].keywords,
    icon: GearIcon,
    actionId: "set-theme-mouve",
  },
  {
    group: "System Actions",
    groupOrder: 3,
    id: "system-theme-brutalism",
    label: "Apply Brutalism Theme",
    keywords: THEME_VARIANT_ITEMS[3].keywords,
    icon: TargetIcon,
    actionId: "set-theme-brutalism",
  },
  {
    group: "System Actions",
    groupOrder: 3,
    id: "system-workspace-settings",
    label: "Open workspace settings",
    keywords: ["preferences", "config", "setup", "工作区设置", "偏好"],
    icon: GearIcon,
    defaultVisible: true,
    actionId: "open-workspace-settings",
  },
];

export const CommandPalette = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentVariant = useAppSelector(selectThemeVariant);
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const isSearching = inputValue.trim().length > 0;
  const closePalette = () => setIsOpen(false);

  const commandItems: CommandItemConfig[] = BASE_COMMAND_ITEMS.map((item) => {
    if (item.id === "system-light-mode") return { ...item, isCurrent: theme === "light" };
    if (item.id === "system-dark-mode") return { ...item, isCurrent: theme === "dark" };
    if (item.id === "system-theme-mode") return { ...item, isCurrent: theme === "system" };
    if (item.id === "system-theme-default")
      return { ...item, isCurrent: currentVariant === "default" };
    if (item.id === "system-theme-glass")
      return { ...item, isCurrent: currentVariant === "glass" };
    if (item.id === "system-theme-mouve")
      return { ...item, isCurrent: currentVariant === "mouve" };
    if (item.id === "system-theme-brutalism")
      return { ...item, isCurrent: currentVariant === "brutalism" };

    return item;
  });

  const groupedCommandItems = commandItems.reduce<Record<string, CommandItemConfig[]>>(
    (groups, item) => {
      if (!groups[item.group]) {
        groups[item.group] = [];
      }

      groups[item.group].push(item);
      return groups;
    },
    {}
  );

  const orderedGroups = Object.entries(groupedCommandItems)
    .map(([group, items]) => ({
      group,
      groupOrder: items[0]?.groupOrder ?? 0,
      items,
    }))
    .sort((a, b) => a.groupOrder - b.groupOrder);

  const actionHandlers: Record<string, () => void> = {
    "set-theme-light": () => {
      setTheme("light");
      closePalette();
    },
    "set-theme-dark": () => {
      setTheme("dark");
      closePalette();
    },
    "set-theme-system": () => {
      setTheme("system");
      closePalette();
    },
    "set-theme-default": () => {
      dispatch(setThemeVariant("default"));
      closePalette();
    },
    "set-theme-glass": () => {
      dispatch(setThemeVariant("glass"));
      closePalette();
    },
    "set-theme-mouve": () => {
      dispatch(setThemeVariant("mouve"));
      closePalette();
    },
    "set-theme-brutalism": () => {
      dispatch(setThemeVariant("brutalism"));
      closePalette();
    },
    "open-workspace-settings": () => {
      router.push("/");
      closePalette();
    },
  };

  const handleAction = (key: Key) => {
    const actionId = commandItems.find((item) => item.id === String(key))?.actionId;

    if (actionId) {
      actionHandlers[actionId]?.();
    }
  };

  useHotkeys("mod+k", (e) => {
    e.preventDefault();
    setIsOpen((prev) => !prev);
  });

  return (
    <Command>
      <Command.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);

          if (!open) {
            setInputValue("");
          }
        }}
        variant="transparent"
      >
        <Command.Container size="lg">
          <Command.Dialog filter={commandFilter} inputValue={inputValue} onInputChange={setInputValue}>
            <Command.InputGroup>
              <Command.InputGroup.Prefix>
                <MagnifierIcon />
              </Command.InputGroup.Prefix>
              <Command.InputGroup.Input placeholder="Search or jump to" />
              <Command.InputGroup.ClearButton />
              <Command.InputGroup.Suffix>
                <Kbd className="text-xs">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>K</Kbd.Content>
                </Kbd>
              </Command.InputGroup.Suffix>
            </Command.InputGroup>
            <Command.Header className="flex flex-col items-start gap-2 px-4">
              <div className="flex flex-wrap gap-1.5">
                {["Projects", "Tasks", "People", "Documents", "Channels"].map((label) => (
                  <Chip key={label} color="default" size="sm" variant="soft">
                    <Chip.Label>{label}</Chip.Label>
                    <CloseButton
                      aria-label={`Remove ${label}`}
                      className="-mr-px size-4 [&_svg]:size-3"
                    />
                  </Chip>
                ))}
              </div>
            </Command.Header>
            <Command.List
              onAction={handleAction}
              renderEmptyState={() => (
                <EmptyState size="sm">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <MagnifierIcon />
                    </EmptyState.Media>
                    <EmptyState.Title>No results found</EmptyState.Title>
                    <EmptyState.Description>Try a different search term.</EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              )}
            >
              {orderedGroups.map(({ group: groupName, items }) => (
                <Command.Group
                  key={groupName}
                  heading={
                    groupName === "Results (4)" ? (
                      <span className="flex w-full items-center justify-between">
                        <span>{groupName}</span>
                        <button className="text-accent text-xs font-medium" type="button">
                          See All
                        </button>
                      </span>
                    ) : (
                      groupName
                    )
                  }
                >
                    {items
                      .filter((item) => isSearching || item.defaultVisible)
                      .map((item) => {
                        const Icon = item.icon;

                        return (
                          <Command.Item
                            key={item.id}
                            id={item.id}
                            textValue={buildSearchText(item.label, item.keywords)}
                          >
                            <Icon />
                            <span>{item.label}</span>
                            {item.isCurrent ? (
                              <Chip className="ms-auto" color="default" size="sm" variant="soft">
                                <Chip.Label>Current</Chip.Label>
                              </Chip>
                            ) : null}
                            {item.id === "system-workspace-settings" ? (
                              <Kbd className="ms-auto text-xs" slot="keyboard">
                                <Kbd.Content>↵</Kbd.Content>
                              </Kbd>
                            ) : null}
                          </Command.Item>
                        );
                      })}
                </Command.Group>
              ))}
            </Command.List>
            <Command.Footer className="h-10 justify-between [&_kbd]:h-5 [&_kbd]:text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <Kbd className="text-xs">
                      <Kbd.Abbr keyValue="up" />
                    </Kbd>
                    <Kbd className="text-xs">
                      <Kbd.Abbr keyValue="down" />
                    </Kbd>
                  </div>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Kbd>
                    <Kbd.Abbr keyValue="enter" />
                  </Kbd>
                  <span>Select</span>
                </div>
              </div>
              <span className="text-muted text-xs">
                Not what you&apos;re looking for? Try the{" "}
                <button className="text-accent font-medium" type="button">
                  Help Center
                </button>
              </span>
            </Command.Footer>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
};
