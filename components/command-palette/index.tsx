"use client";

import { Chip, Kbd, toast, type Key } from "@heroui/react";
import { Command, EmptyState, Segment } from "@heroui-pro/react";
import { useOs } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { HighlightedText } from "@/components/highlighted-text";
import { MagnifierIcon, SparklesIcon } from "@/components/icons";
import { type IconSvgProps } from "@/types";
import { useAdminCommands } from "./admin/use-admin-commands";
import { buildCommandSearchText, filterCommands } from "./command-model";
import { usePostSearchCommands } from "./search/use-post-search-commands";
import { STATIC_COMMANDS } from "./static-commands";
import { useThemeCommands } from "./theme/use-theme-commands";
import { useMomentCommands } from "./moment/use-moment-commands";
import { useSystemCommands } from "./system/use-system-commands";
import {
  COMMAND_CATEGORY_ORDER,
  CommandIntent,
  type CommandItem,
  type CommandSource,
} from "./types";

const COMMAND_SCOPES: readonly {
  id: "all" | "search" | "ai" | "themes" | "system";
  source: CommandSource | null;
}[] = [
  { id: "all", source: null },
  { id: "search", source: "search" },
  { id: "ai", source: "ai" },
  { id: "themes", source: "theme" },
  { id: "system", source: "system" },
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

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;
const REVEAL_DURATION = 0.7;
const REVEAL_STAGGER = 0.105;

function revealFrom(index: number) {
  const fromRight = index % 2 === 1;
  return {
    opacity: 0,
    x: fromRight ? 12 : -12,
    y: fromRight ? 18 : 24,
    scale: 0.97,
    filter: "blur(6px)",
  };
}

function CommandReveal({
  index,
  replayKey,
  className,
  children,
}: {
  index: number;
  replayKey: string;
  className?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      key={replayKey}
      className={className}
      initial={revealFrom(index)}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{
        duration: REVEAL_DURATION,
        delay: index * REVEAL_STAGGER,
        ease: REVEAL_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

function filterBySource(commands: readonly CommandItem[], source: CommandSource | null) {
  return source ? commands.filter((command) => command.source === source) : [...commands];
}

function shouldShowDescription(command: CommandItem) {
  return command.id.startsWith("search-");
}

function isSafeInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

export const CommandPalette = ({ isOpen, setIsOpen }: CommandPaletteProps) => {
  const t = useTranslations("Search");
  const router = useRouter();
  const os = useOs();
  const [inputValue, setInputValue] = useState("");
  const [activeSource, setActiveSource] = useState<CommandSource | null>(null);

  // Clear input value and reset search scope when the command palette is closed (manually or programmatically)
  useEffect(() => {
    if (!isOpen) {
      const reset = setTimeout(() => {
        setInputValue("");
        setActiveSource(null);
      }, 0);
      return () => clearTimeout(reset);
    }
  }, [isOpen]);

  const themeCommands = useThemeCommands();
  const momentCommands = useMomentCommands();
  const systemCommands = useSystemCommands();
  const adminCommands = useAdminCommands();
  const searchState = usePostSearchCommands(
    inputValue,
    isOpen && (activeSource === null || activeSource === "search")
  );

  const baseCommands = useMemo(
    () => [
      ...STATIC_COMMANDS,
      ...momentCommands,
      ...themeCommands,
      ...systemCommands,
      ...adminCommands,
    ],
    [adminCommands, momentCommands, systemCommands, themeCommands]
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
        groups.push({
          id: `group-${category.toLowerCase()}`,
          heading: t(`categories.${category}`),
          commands,
        });
      }
    });

    // Add AI Suggestions as a special group at the top when searching
    if (isSearching && (activeSource === null || activeSource === "ai")) {
      groups.unshift({
        id: "group-ai-suggestions",
        heading: t("aiPredictions"),
        badge: t("experimental"),
        commands: [
          {
            id: "ai-suggest-1",
            title: t("draftArticle", { query: inputValue }),
            description: t("draftArticleHint"),
            icon: SparklesIcon,
            keywords: ["ai", "draft", "article", "generate"],
            category: "AI",
            source: "ai",
            intent: CommandIntent.EXECUTE,
            payload: {
              action: () => {
                toast.success(t("draftStarted"));
              },
              closeOnExecute: true,
            },
          },
        ],
      });
    }

    return groups;
  }, [activeSource, baseCommands, inputValue, isSearching, searchState.dynamicGroups, t]);

  const renderedGroups = useMemo(
    () =>
      visibleGroups
        .map((group) => ({
          ...group,
          commands: group.commands.filter((command) => isSearching || command.defaultVisible),
        }))
        .filter((group) => group.commands.length > 0),
    [isSearching, visibleGroups]
  );
  const revealKey = renderedGroups
    .map((group) => `${group.id}:${group.commands.map((command) => command.id).join(",")}`)
    .join("|");
  let revealIndex = 0;

  const closePalette = () => {
    setIsOpen(false);
    setInputValue("");
    setActiveSource(null);
  };

  const handleAction = (key: Key) => {
    // Include commands created for the current view (for example, the contextual
    // AI suggestion). These commands are intentionally ephemeral and therefore
    // do not live in either the static or remote command collections.
    const allCommands = [
      ...baseCommands,
      ...searchState.allCommands,
      ...visibleGroups.flatMap((group) => group.commands),
    ];
    const command = allCommands.find((item) => item.id === String(key));

    if (!command) return;

    if (command.intent === CommandIntent.NAVIGATE) {
      if (command.payload.external) {
        const url = new URL(command.payload.href, window.location.origin);
        if (url.protocol === "http:" || url.protocol === "https:") {
          window.open(url, "_blank", "noopener,noreferrer");
          closePalette();
        }
        return;
      }

      if (isSafeInternalHref(command.payload.href)) {
        router.push(command.payload.href);
        closePalette();
      }
      return;
    }

    const actionResult = command.payload.action();

    if (command.payload.closeOnExecute) {
      closePalette();
    }

    if (actionResult instanceof Promise) {
      void actionResult.catch(() => {
        toast.danger(t("actionFailed"));
      });
    }
  };

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
        <Command.Container className="w-[min(72rem,calc(100vw-2rem))]" size="lg">
          <Command.Dialog
            className="max-h-[min(44rem,calc(100vh-4rem))]"
            filter={() => true}
            inputValue={inputValue}
            onInputChange={setInputValue}
          >
            <Command.InputGroup>
              <Command.InputGroup.Prefix>
                <MagnifierIcon />
              </Command.InputGroup.Prefix>
              <Command.InputGroup.Input placeholder={t("placeholder")} />
              <Command.InputGroup.ClearButton />
              <Command.InputGroup.Suffix>
                <Kbd className="text-xs">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>K</Kbd.Content>
                </Kbd>
              </Command.InputGroup.Suffix>
            </Command.InputGroup>

            <div className="px-3 pt-2 [&_.segment]:backdrop-filter-none">
              <Segment
                aria-label={t("scope")}
                selectedKey={activeSource ?? "all"}
                size="sm"
                variant="ghost"
                onSelectionChange={(key) => {
                  setActiveSource(key === "all" ? null : (key as CommandSource));
                }}
              >
                {COMMAND_SCOPES.map((scope) => (
                  <Segment.Item key={scope.id} id={scope.id}>
                    {t(`scopes.${scope.id}`)}
                  </Segment.Item>
                ))}
              </Segment>
            </div>

            <Command.List
              onAction={handleAction}
              renderEmptyState={() =>
                searchState.isLoading || searchState.isError ? null : (
                  <EmptyState size="sm">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <MagnifierIcon />
                      </EmptyState.Media>
                      <EmptyState.Title>
                        {isSearching ? t("emptyTitle") : t("startTitle")}
                      </EmptyState.Title>
                      <EmptyState.Description>
                        {isSearching ? t("emptyHint") : t("startHint")}
                      </EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                )
              }
            >
              {renderedGroups.map((group) => {
                const headingIndex = revealIndex++;
                return (
                  <Command.Group
                    key={group.id}
                    heading={
                      <CommandReveal index={headingIndex} replayKey={`${revealKey}:${group.id}`}>
                        <span className="flex w-full items-center justify-between px-1">
                          <span className="text-default-500 font-medium">{group.heading}</span>
                          {group.badge ? (
                            <span className="text-default-400 text-xs">{group.badge}</span>
                          ) : null}
                        </span>
                      </CommandReveal>
                    }
                  >
                    {group.commands.map((command) => {
                      const Icon = command.icon as React.ElementType<IconSvgProps>;
                      const showDescription =
                        shouldShowDescription(command) && Boolean(command.description);
                      const itemIndex = revealIndex++;

                      return (
                        <Command.Item
                          key={command.id}
                          className={[
                            "gap-3 overflow-visible",
                            showDescription ? "items-start py-2" : "items-center",
                          ].join(" ")}
                          id={command.id}
                          textValue={buildCommandSearchText(command)}
                        >
                          <CommandReveal
                            index={itemIndex}
                            replayKey={`${revealKey}:${command.id}`}
                            className={[
                              "flex w-full min-w-0 gap-3",
                              showDescription ? "items-start" : "items-center",
                            ].join(" ")}
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
                                  <HighlightedText
                                    text={command.description || ""}
                                    query={inputValue}
                                  />
                                </div>
                              ) : null}
                            </div>
                            <div className="ml-auto flex items-center gap-2 pl-3">
                              {command.shortcut ? (
                                <Kbd className="text-xs" slot="keyboard" variant="light">
                                  {command.shortcut.map((key) =>
                                    key === "mod" ? (
                                      <Kbd.Abbr
                                        key={key}
                                        keyValue={os === "macos" ? "command" : "ctrl"}
                                      />
                                    ) : (
                                      <Kbd.Content key={key}>{key}</Kbd.Content>
                                    )
                                  )}
                                </Kbd>
                              ) : command.intent === CommandIntent.NAVIGATE ? (
                                <Kbd className="text-xs" slot="keyboard" variant="light">
                                  <Kbd.Abbr keyValue="enter" />
                                </Kbd>
                              ) : null}
                            </div>
                          </CommandReveal>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                );
              })}
            </Command.List>

            {isSearching && searchState.isLoading ? (
              <div
                role="status"
                className="text-muted-foreground flex items-center justify-center p-6"
              >
                <div className="mr-3 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="text-sm">Searching across your workspace...</span>
              </div>
            ) : null}

            {isSearching && searchState.isError ? (
              <div role="alert" className="text-danger px-3 py-2 text-sm">
                Search is temporarily unavailable. Please try again shortly.
              </div>
            ) : null}

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
