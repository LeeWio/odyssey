"use client";

import { Key, Kbd, Chip } from "@heroui/react";
import { Command, EmptyState } from "@heroui-pro/react";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys } from "@mantine/hooks";

import { MagnifierIcon } from "@/components/icons";
import { buildCommandSearchText, filterCommands } from "./command-model";
import { HighlightedText } from "@/components/highlighted-text";
import { usePostSearchCommands } from "./search/use-post-search-commands";
import { STATIC_COMMANDS } from "./static-commands";
import { useThemeCommands } from "./theme/use-theme-commands";
import { useAdminCommands } from "./admin/use-admin-commands";
import {
  CommandIntent,
  type CommandItem,
  type CommandSource,
  COMMAND_CATEGORY_ORDER,
} from "./types";

const COMMAND_SCOPES: readonly { label: string; source: CommandSource | null }[] = [
  { label: "All", source: null },
  { label: "Search", source: "search" },
  { label: "AI", source: "ai" },
  { label: "Themes", source: "theme" },
  { label: "System", source: "system" },
];

export interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface VisibleGroup {
  id: string;
  heading: string;
  commands: CommandItem[];
  badge?: string;
}

function filterBySource(commands: readonly CommandItem[], source: CommandSource | null) {
  return source ? commands.filter((command) => command.source === source) : [...commands];
}

function shouldShowDescription(command: CommandItem) {
  return command.id.startsWith("search-");
}

export const CommandPalette = ({ isOpen, setIsOpen }: CommandPaletteProps) => {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [activeSource, setActiveSource] = useState<CommandSource | null>(null);

  // Clear input value and reset search scope when the command palette is closed (manually or programmatically)
  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
      setActiveSource(null);
    }
  }, [isOpen]);

  const themeCommands = useThemeCommands();
  const adminCommands = useAdminCommands();
  const searchState = usePostSearchCommands(inputValue, isOpen);

  const baseCommands = useMemo(
    () => [...STATIC_COMMANDS, ...themeCommands, ...adminCommands],
    [themeCommands, adminCommands]
  );
  const isSearching = inputValue.trim().length > 0;

  const visibleGroups = useMemo<VisibleGroup[]>(() => {
    const scopedBaseCommands = filterBySource(baseCommands, activeSource);
    const filteredBaseCommands = filterCommands(scopedBaseCommands, inputValue);

    const groups: VisibleGroup[] = [];

    if (activeSource === null || activeSource === "search") {
      if (searchState.dynamicGroups.length > 0) {
        groups.push(...searchState.dynamicGroups);
      }
    }

    // Group the remaining base commands by category
    const baseGroupsMap = new Map<string, CommandItem[]>();
    filteredBaseCommands.forEach((cmd) => {
      if (cmd.source === "search") return;

      const category = cmd.category;
      if (!baseGroupsMap.has(category)) {
        baseGroupsMap.set(category, []);
      }
      baseGroupsMap.get(category)?.push(cmd);
    });

    COMMAND_CATEGORY_ORDER.forEach((category) => {
      const commands = baseGroupsMap.get(category);
      if (commands && commands.length > 0) {
        // Check if the current source filter allows this category
        const isAI = category === "AI";
        const isTheme = commands.some((c) => c.source === "theme");
        const isSystem = commands.some((c) => c.source === "system");

        const isVisibleBySource =
          activeSource === null ||
          (activeSource === "ai" && isAI) ||
          (activeSource === "theme" && isTheme) ||
          (activeSource === "system" && isSystem) ||
          (activeSource === "search" && false); // Search source handled separately

        if (isVisibleBySource) {
          groups.push({
            id: `group-${category.toLowerCase()}`,
            heading: category === "AI" ? (isSearching ? "AI Prompts" : "Prompt Ideas") : category,
            commands,
          });
        }
      }
    });

    return groups;
  }, [activeSource, baseCommands, inputValue, isSearching, searchState.dynamicGroups]);

  const handleAction = (key: Key) => {
    const allCommands = [...baseCommands, ...searchState.allCommands];
    const command = allCommands.find((item) => item.id === String(key));

    if (!command) return;

    if (command.intent === CommandIntent.NAVIGATE) {
      router.push(command.payload.href);
      setIsOpen(false);
      return;
    }

    command.payload.action();

    if (command.payload.closeOnExecute) {
      setIsOpen(false);
    }
  };

  useHotkeys(
    [
      [
        "mod+k",
        () => {
          setIsOpen(!isOpen);
        },
      ],
    ],
    []
  );

  return (
    <Command>
      <Command.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);

          if (!open) {
            setInputValue("");
            setActiveSource(null);
          }
        }}
        variant="blur"
      >
        <Command.Container size="lg">
          <Command.Dialog filter={() => true} inputValue={inputValue} onInputChange={setInputValue}>
            <Command.Header className="flex items-start gap-2 px-4">
              {COMMAND_SCOPES.map((scope) => {
                const isActive = activeSource === scope.source;

                return (
                  <Chip
                    key={scope.label}
                    aria-pressed={isActive}
                    color={isActive ? "accent" : "default"}
                    onClick={() => {
                      setActiveSource((current) =>
                        current === scope.source ? null : scope.source
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveSource((current) =>
                          current === scope.source ? null : scope.source
                        );
                      }
                    }}
                    role="button"
                    size="sm"
                    tabIndex={0}
                    variant={isActive ? "primary" : "soft"}
                  >
                    <Chip.Label>{scope.label}</Chip.Label>
                  </Chip>
                );
              })}
            </Command.Header>

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

            <Command.List
              onAction={handleAction}
              renderEmptyState={() => (
                <EmptyState size="sm">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <MagnifierIcon />
                    </EmptyState.Media>
                    <EmptyState.Title>
                      {isSearching ? "No matching results" : "Start with a shortcut or search term"}
                    </EmptyState.Title>
                    <EmptyState.Description>
                      {isSearching
                        ? "Try a broader keyword or switch scope."
                        : "Search posts, categories, tags, themes, and workspace actions in one place."}
                    </EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              )}
            >
              {visibleGroups.map((group) => (
                <Command.Group
                  key={group.id}
                  heading={
                    <span className="flex w-full items-center justify-between px-1">
                      <span className="text-default-500 font-medium">{group.heading}</span>
                      {group.badge ? (
                        <span className="text-default-400 text-xs">{group.badge}</span>
                      ) : null}
                    </span>
                  }
                >
                  {group.commands
                    .filter((command) => isSearching || command.defaultVisible)
                    .map((command) => {
                      const Icon = command.icon;
                      const showDescription =
                        shouldShowDescription(command) && Boolean(command.description);

                      return (
                        <Command.Item
                          key={command.id}
                          className={[
                            "gap-3",
                            showDescription ? "items-start py-2" : "items-center",
                          ].join(" ")}
                          id={command.id}
                          textValue={buildCommandSearchText(command)}
                        >
                          <div
                            className={[
                              "bg-default/40 text-default-500 flex size-7 shrink-0 items-center justify-center rounded-md",
                              showDescription ? "mt-0.5" : "",
                            ].join(" ")}
                          >
                            <Icon width={16} height={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                <HighlightedText text={command.title} query={inputValue} />
                              </span>
                              {command.isActive ? (
                                <Chip color="success" size="sm" variant="soft">
                                  Current
                                </Chip>
                              ) : null}
                            </div>
                            {showDescription ? (
                              <div className="text-muted mt-0.5 line-clamp-1 text-xs">
                                <HighlightedText text={command.description || ""} query={inputValue} />
                              </div>
                            ) : null}
                          </div>
                          <div className="ml-auto flex items-center gap-2 pl-3">
                            {command.intent === CommandIntent.NAVIGATE ? (
                              <Kbd
                                className="text-muted-foreground border-none bg-transparent text-xs shadow-none"
                                slot="keyboard"
                                variant="light"
                              >
                                <Kbd.Abbr keyValue="enter" />
                              </Kbd>
                            ) : null}
                          </div>
                        </Command.Item>
                      );
                    })}
                </Command.Group>
              ))}

              {isSearching && searchState.isLoading ? (
                <div className="text-muted-foreground flex items-center justify-center p-6">
                  <div className="mr-3 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="text-sm">Searching across your workspace...</span>
                </div>
              ) : null}

              {isSearching && searchState.isError ? (
                <div className="text-danger px-3 py-2 text-sm">
                  Search is temporarily unavailable. Check the quick search API response.
                </div>
              ) : null}
            </Command.List>

            <Command.Footer className="justify-between [&_kbd]:h-5 [&_kbd]:text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <Kbd className="text-xs" variant="light">
                      <Kbd.Abbr keyValue="up" />
                    </Kbd>
                    <Kbd className="text-xs" variant="light">
                      <Kbd.Abbr keyValue="down" />
                    </Kbd>
                  </div>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Kbd variant="light">
                    <Kbd.Abbr keyValue="enter" />
                  </Kbd>
                  <span>Open</span>
                </div>
              </div>
              <span className="text-xs">
                {activeSource ? `Scoped to ${activeSource}` : "Searching everything"}
              </span>
            </Command.Footer>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
};
