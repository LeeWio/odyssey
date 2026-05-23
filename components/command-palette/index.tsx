"use client";

import { Key, Kbd, Chip, CloseButton } from "@heroui/react";
import { Command, EmptyState } from "@heroui-pro/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";

import { MagnifierIcon } from "@/components/icons";
import { buildCommandSearchText, filterCommands } from "./command-model";
import { usePostSearchCommands } from "./search/use-post-search-commands";
import { STATIC_COMMANDS } from "./static-commands";
import { useThemeCommands } from "./theme/use-theme-commands";
import { CommandIntent, type CommandItem, type CommandSource } from "./types";

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

function getCommandKind(command: CommandItem) {
  if (command.id.startsWith("search-")) {
    const parts = command.id.split("-");
    if (parts.length >= 2) {
      const type = parts[1];
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }
  if (command.source === "theme") return "Theme";
  return null;
}

function shouldShowDescription(command: CommandItem) {
  return command.id.startsWith("search-");
}

export const CommandPalette = ({ isOpen, setIsOpen }: CommandPaletteProps) => {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [activeSource, setActiveSource] = useState<CommandSource | null>(null);

  const themeCommands = useThemeCommands();
  const searchState = usePostSearchCommands(inputValue);

  const baseCommands = useMemo(() => [...STATIC_COMMANDS, ...themeCommands], [themeCommands]);
  const isSearching = inputValue.trim().length > 0;

  const visibleGroups = useMemo<VisibleGroup[]>(() => {
    const scopedBaseCommands = filterBySource(baseCommands, activeSource);
    const filteredBaseCommands = filterCommands(scopedBaseCommands, inputValue);

    const aiCommands = filteredBaseCommands.filter((command) => command.source === "ai");
    const themeSystemCommands = filteredBaseCommands.filter(
      (command) => command.source === "theme" || command.source === "system"
    );

    const groups: VisibleGroup[] = [];

    if (activeSource === null || activeSource === "search") {
      if (searchState.dynamicGroups.length > 0) {
        groups.push(...searchState.dynamicGroups);
      }
    }

    if (activeSource === null || activeSource === "ai") {
      if (aiCommands.length > 0) {
        groups.push({
          id: "smart-prompts",
          heading: isSearching ? "AI Prompts" : "Prompt Ideas",
          commands: aiCommands,
        });
      }
    }

    if (activeSource === null || activeSource === "theme" || activeSource === "system") {
      if (themeSystemCommands.length > 0) {
        groups.push({
          id: "workspace-controls",
          heading: isSearching ? "Workspace" : "Workspace Controls",
          commands: themeSystemCommands,
        });
      }
    }

    return groups;
  }, [activeSource, baseCommands, inputValue, isSearching, searchState.dynamicGroups]);

  const handleAction = (key: Key) => {
    const allCommands = [
      ...baseCommands,
      ...searchState.allCommands,
    ];
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

  useHotkeys("mod+k", (event) => {
    event.preventDefault();
    setIsOpen(!isOpen);
  });

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
            <Command.Header className="flex flex-wrap items-center gap-2 px-3 pb-0 pt-3">
              {COMMAND_SCOPES.map((scope) => {
                const isActive = activeSource === scope.source;

                return (
                  <Chip
                    key={scope.label}
                    aria-pressed={isActive}
                    className="cursor-pointer transition-colors"
                    color={isActive ? "accent" : "default"}
                    onClick={() => {
                      setActiveSource((current) => (current === scope.source ? null : scope.source));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveSource((current) => (current === scope.source ? null : scope.source));
                      }
                    }}
                    role="button"
                    size="sm"
                    tabIndex={0}
                    variant={isActive ? "primary" : "soft"}
                  >
                    <Chip.Label>{scope.label}</Chip.Label>
                    {isActive ? (
                      <CloseButton
                        aria-label={`Clear ${scope.label} scope`}
                        className="-mr-px size-4 [&_svg]:size-3"
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveSource(null);
                        }}
                      />
                    ) : null}
                  </Chip>
                );
              })}
            </Command.Header>

            <Command.InputGroup>
              <Command.InputGroup.Prefix>
                <MagnifierIcon />
              </Command.InputGroup.Prefix>
              <Command.InputGroup.Input placeholder="Search posts, tags, categories, or actions..." />
              <Command.InputGroup.ClearButton />
              <Command.InputGroup.Suffix>
                <Kbd className="text-xs" variant="light">
                  <Kbd.Content>Esc</Kbd.Content>
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
                    <span className="flex w-full items-center justify-between">
                      <span>{group.heading}</span>
                      {group.badge ? (
                        <Chip color="default" size="sm" variant="soft">
                          <Chip.Label>{group.badge}</Chip.Label>
                        </Chip>
                      ) : null}
                    </span>
                  }
                >
                  {group.commands
                    .filter((command) => isSearching || command.defaultVisible)
                    .map((command) => {
                      const Icon = command.icon;
                      const kind = getCommandKind(command);
                      const showDescription = shouldShowDescription(command) && Boolean(command.description);

                      return (
                        <Command.Item
                          key={command.id}
                          className={showDescription ? "items-start gap-3" : "items-center gap-3"}
                          id={command.id}
                          textValue={buildCommandSearchText(command)}
                        >
                          <div
                            className={[
                              "bg-default flex size-8 shrink-0 items-center justify-center rounded-lg",
                              showDescription ? "mt-0.5" : "",
                            ].join(" ")}
                          >
                            <Icon />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">{command.title}</span>
                              {command.isActive ? (
                                <Chip color="success" size="sm" variant="soft">
                                  <Chip.Label>Current</Chip.Label>
                                </Chip>
                              ) : null}
                            </div>
                            {showDescription ? (
                              <div className="text-muted mt-0.5 line-clamp-2 text-xs">
                                {command.description}
                              </div>
                            ) : null}
                          </div>
                          <div className="ml-auto flex items-center gap-2 pl-3">
                            {kind ? (
                              <Chip color="default" size="sm" variant="soft">
                                <Chip.Label>{kind}</Chip.Label>
                              </Chip>
                            ) : null}
                            {command.intent === CommandIntent.NAVIGATE ? (
                              <Kbd className="text-xs" slot="keyboard" variant="light">
                                <Kbd.Content>↵</Kbd.Content>
                              </Kbd>
                            ) : null}
                          </div>
                        </Command.Item>
                      );
                    })}
                </Command.Group>
              ))}

              {isSearching && searchState.isLoading ? (
                <div className="text-muted px-3 py-2 text-sm">Searching across posts, categories, and tags...</div>
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
