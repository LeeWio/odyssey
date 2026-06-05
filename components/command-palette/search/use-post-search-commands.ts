"use client";

import { useDeferredValue, useMemo } from "react";

import {
  FileTextIcon,
  MagnifierIcon,
  TargetIcon,
  ClockIcon,
  SearchIcon,
  ArrowRightFromSquareIcon,
  GearIcon,
  PersonsIcon,
  SparklesIcon,
} from "@/components/icons";
import { useUnifiedSearchQuery } from "@/lib/features/post/post-api";
import { createNavigationCommand } from "../command-model";
import { CommandIntent, type CommandItem } from "../types";

const ICON_MAP: Record<string, React.ElementType> = {
  clock: ClockIcon,
  home: SearchIcon,
  "book-text": FileTextIcon,
  magnifier: MagnifierIcon,
  target: TargetIcon,
  link: ArrowRightFromSquareIcon,
  gear: GearIcon,
  persons: PersonsIcon,
  sparkles: SparklesIcon,
};

export interface UnifiedSearchGroup {
  id: string;
  heading: string;
  commands: CommandItem[];
  badge?: string;
}

export interface PostSearchCommandState {
  dynamicGroups: UnifiedSearchGroup[];
  allCommands: CommandItem[];
  isLoading: boolean;
  hasRemoteQuery: boolean;
  total: number;
  isError: boolean;
}

export function usePostSearchCommands(query: string, isOpen: boolean): PostSearchCommandState {
  const deferredQuery = useDeferredValue(query.trim());
  const hasRemoteQuery = deferredQuery.length > 0;

  const { data, isFetching, isError } = useUnifiedSearchQuery(
    hasRemoteQuery ? { keyword: deferredQuery } : {},
    { skip: !isOpen }
  );

  const { dynamicGroups, allCommands, total } = useMemo(() => {
    if (!data?.groups) {
      return { dynamicGroups: [], allCommands: [], total: 0 };
    }

    let commandTotal = 0;
    const allCmds: CommandItem[] = [];
    const groups = data.groups.map((group, groupIndex) => {
      const items = group.items || [];
      const commands = items.map((item, itemIndex) => {
        commandTotal++;
        const Icon = item.icon ? (ICON_MAP[item.icon] ?? MagnifierIcon) : MagnifierIcon;
        const id = `search-${group.type.toLowerCase()}-${itemIndex}-${groupIndex}`;

        // Since url can be an action or navigation, we default to navigation.
        // If it's type ACTION, we could technically map to an action, but payload expects href.
        return createNavigationCommand({
          id,
          title: item.title,
          description: item.subtitle ?? undefined,
          icon: Icon,
          category: "Management",
          source: "search",
          order: group.priority ? group.priority * 1000 + itemIndex : itemIndex,
          keywords: item.shortcut ? [...item.shortcut, group.type] : [group.type, group.label],
          intent: CommandIntent.NAVIGATE,
          payload: { href: item.url },
          defaultVisible: !hasRemoteQuery, // Ensure empty state items are visible without search
        });
      });

      allCmds.push(...commands);

      return {
        id: `search-group-${group.type.toLowerCase()}-${groupIndex}`,
        heading: group.label,
        commands,
        badge: String(commands.length),
      };
    });

    // Sort groups by priority if available
    groups.sort((a, b) => {
      const gA = data.groups?.find(
        (g) => `search-group-${g.type.toLowerCase()}-${data.groups?.indexOf(g)}` === a.id
      );
      const gB = data.groups?.find(
        (g) => `search-group-${g.type.toLowerCase()}-${data.groups?.indexOf(g)}` === b.id
      );
      return (gA?.priority ?? 0) - (gB?.priority ?? 0);
    });

    return { dynamicGroups: groups, allCommands: allCmds, total: commandTotal };
  }, [data?.groups, hasRemoteQuery]);

  return {
    dynamicGroups,
    allCommands,
    isLoading: isFetching,
    hasRemoteQuery,
    total,
    isError,
  };
}
