"use client";

import { Key } from "@heroui/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, EmptyState } from "@heroui-pro/react";
import { useHotkeys } from "react-hotkeys-hook";
import { Kbd, Chip, CloseButton } from "@heroui/react";

import { MagnifierIcon } from "@/components/icons";
import { groupCommands, filterCommands, buildCommandSearchText } from "./command-model";
import { usePostSearchCommands } from "./search/use-post-search-commands";
import { STATIC_COMMANDS } from "./static-commands";
import { useThemeCommands } from "./theme/use-theme-commands";
import {
  COMMAND_CATEGORY_METADATA,
  COMMAND_CATEGORY_ORDER,
  CommandIntent,
  type CommandSource,
} from "./types";

const DEFAULT_RESULTS_LIMIT = 6;
const EXPANDED_RESULTS_LIMIT = 24;
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

export const CommandPalette = ({ isOpen, setIsOpen }: CommandPaletteProps) => {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [activeSource, setActiveSource] = useState<CommandSource | null>(null);
  const [resultLimit, setResultLimit] = useState(DEFAULT_RESULTS_LIMIT);

  const themeCommands = useThemeCommands();
  const postSearch = usePostSearchCommands(inputValue, resultLimit);

  const allCommands = useMemo(
    () => [...STATIC_COMMANDS, ...themeCommands, ...postSearch.commands],
    [postSearch.commands, themeCommands]
  );

  const isSearching = inputValue.trim().length > 0;

  const filteredGroups = useMemo(() => {
    const scopedCommands = activeSource
      ? allCommands.filter((command) => command.source === activeSource)
      : allCommands;
    const filtered = filterCommands(scopedCommands, inputValue);
    const grouped = groupCommands(filtered);

    if (
      postSearch.hasRemoteQuery &&
      !grouped.some((group) => group.heading === "Management")
    ) {
      const managementOrder = COMMAND_CATEGORY_ORDER.indexOf("Management");
      const insertionIndex = grouped.findIndex(
        (group) => COMMAND_CATEGORY_ORDER.indexOf(group.heading) > managementOrder
      );

      grouped.splice(insertionIndex === -1 ? grouped.length : insertionIndex, 0, {
        id: "group-management",
        heading: "Management",
        commands: [],
      });
    }

    return grouped;
  }, [activeSource, allCommands, inputValue, postSearch.hasRemoteQuery]);

  const handleAction = (key: Key) => {
    const command = allCommands.find((cmd) => cmd.id === String(key));

    if (!command) return;

    if (command.intent === CommandIntent.NAVIGATE) {
      router.push(command.payload.href);
      setIsOpen(false);
    } else if (command.intent === CommandIntent.EXECUTE) {
      command.payload.action();

      if (command.payload.closeOnExecute) {
        setIsOpen(false);
      }
    }
  };

  useHotkeys("mod+k", (e) => {
    e.preventDefault();
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
            setResultLimit(DEFAULT_RESULTS_LIMIT);
          }
        }}
        variant="transparent"
      >
        <Command.Container size="lg">
          <Command.Dialog filter={() => true} inputValue={inputValue} onInputChange={setInputValue}>
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
                {COMMAND_SCOPES.map((scope) => {
                  const isActive = activeSource === scope.source;

                  return (
                  <Chip
                    key={scope.label}
                    aria-pressed={isActive}
                    className="cursor-pointer"
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
                    variant="soft"
                  >
                    <Chip.Label>{scope.label}</Chip.Label>
                    <CloseButton
                      aria-label={isActive ? `Clear ${scope.label} scope` : `Enable ${scope.label} scope`}
                      className="-mr-px size-4 [&_svg]:size-3"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveSource((current) => (current === scope.source ? null : scope.source));
                      }}
                    />
                  </Chip>
                  );
                })}
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
              {filteredGroups.map((group) => {
                const metadata = COMMAND_CATEGORY_METADATA[group.heading];
                const isResultsGroup = group.heading === "Management";
                const resultsLabel = postSearch.hasRemoteQuery
                  ? `Results (${postSearch.total})`
                  : metadata.label;
                const heading = isResultsGroup ? resultsLabel : metadata.label;
                const canExpandResults =
                  isResultsGroup && postSearch.hasRemoteQuery && postSearch.total > postSearch.pageSize;
                const isExpandedResults =
                  isResultsGroup &&
                  postSearch.hasRemoteQuery &&
                  postSearch.pageSize > DEFAULT_RESULTS_LIMIT;
                const resultsActionDisabled =
                  isResultsGroup &&
                  (!postSearch.hasRemoteQuery || (!canExpandResults && !isExpandedResults));

                return (
                  <Command.Group
                    key={group.id}
                    heading={
                      isResultsGroup ? (
                        <span className="flex w-full items-center justify-between">
                          <span>{heading}</span>
                          <button
                            className="text-accent text-xs font-medium"
                            disabled={resultsActionDisabled}
                            onClick={() => {
                              if (!isResultsGroup || !postSearch.hasRemoteQuery) return;

                              setResultLimit((current) =>
                                current > DEFAULT_RESULTS_LIMIT
                                  ? DEFAULT_RESULTS_LIMIT
                                  : EXPANDED_RESULTS_LIMIT
                              );
                            }}
                            type="button"
                          >
                            {canExpandResults
                              ? "See All"
                              : isExpandedResults
                                ? "Show Less"
                                : "See All"}
                          </button>
                        </span>
                      ) : (
                        heading
                      )
                    }
                  >
                    {group.commands
                      .filter((cmd) => isSearching || cmd.defaultVisible)
                      .map((cmd) => {
                        const Icon = cmd.icon;

                        return (
                          <Command.Item
                            key={cmd.id}
                            id={cmd.id}
                            textValue={buildCommandSearchText(cmd)}
                          >
                            <Icon />
                            <span>{cmd.title}</span>
                            {cmd.isActive ? (
                              <Chip className="ms-auto" color="default" size="sm" variant="soft">
                                <Chip.Label>Current</Chip.Label>
                              </Chip>
                            ) : null}
                            {cmd.intent === CommandIntent.NAVIGATE ? (
                              <Kbd className="ms-auto text-xs" slot="keyboard">
                                <Kbd.Content>↵</Kbd.Content>
                              </Kbd>
                            ) : null}
                          </Command.Item>
                        );
                      })}
                    {isResultsGroup && postSearch.isLoading ? (
                      <div className="text-muted px-3 py-2 text-sm">Searching articles...</div>
                    ) : null}
                    {isResultsGroup && postSearch.isError ? (
                      <div className="text-danger px-3 py-2 text-sm">Search is temporarily unavailable.</div>
                    ) : null}
                    {isResultsGroup &&
                    postSearch.hasRemoteQuery &&
                    !postSearch.isLoading &&
                    !postSearch.isError &&
                    group.commands.length === 0 ? (
                      <div className="text-muted px-3 py-2 text-sm">No search results found for this query.</div>
                    ) : null}
                  </Command.Group>
                );
              })}
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
