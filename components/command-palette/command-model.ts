"use client";

import {
  COMMAND_CATEGORY_ORDER,
  CommandIntent,
  type ActionCommand,
  type BaseCommand,
  type CommandCategory,
  type CommandGroup,
  type CommandItem,
  type ExecutionPayload,
  type NavigationCommand,
  type NavigationPayload,
} from "./types";

type CommandBaseInput = Omit<BaseCommand, "keywords" | "source"> & {
  keywords?: readonly string[];
  source: BaseCommand["source"];
};

type NavigationCommandInput = CommandBaseInput & {
  intent: CommandIntent.NAVIGATE;
  payload: NavigationPayload;
};

type ActionCommandInput = CommandBaseInput & {
  intent: CommandIntent.EXECUTE;
  payload: ExecutionPayload;
};

const DEFAULT_GROUP_ORDER = Number.MAX_SAFE_INTEGER;

export function createNavigationCommand(input: NavigationCommandInput): NavigationCommand {
  return {
    ...input,
    keywords: normalizeKeywords(input),
  };
}

export function createActionCommand(input: ActionCommandInput): ActionCommand {
  return {
    ...input,
    keywords: normalizeKeywords(input),
  };
}

export function buildCommandSearchText(command: CommandItem): string {
  return [command.title, command.description ?? "", ...command.keywords].join(" ").toLowerCase();
}

export function matchesCommandQuery(command: CommandItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return buildCommandSearchText(command).includes(normalizedQuery);
}

export function matchesCommandCategory(
  command: CommandItem,
  category?: CommandCategory | null
): boolean {
  return !category || command.category === category;
}

export function sortCommands(commands: readonly CommandItem[]): CommandItem[] {
  return [...commands].sort((left, right) => {
    const categoryOrder =
      COMMAND_CATEGORY_ORDER.indexOf(left.category) -
      COMMAND_CATEGORY_ORDER.indexOf(right.category);

    if (categoryOrder !== 0) {
      return categoryOrder;
    }

    const orderDelta = (left.order ?? DEFAULT_GROUP_ORDER) - (right.order ?? DEFAULT_GROUP_ORDER);

    if (orderDelta !== 0) {
      return orderDelta;
    }

    return left.title.localeCompare(right.title);
  });
}

export function groupCommands(commands: readonly CommandItem[]): CommandGroup[] {
  const grouped = new Map<CommandCategory, CommandItem[]>();

  for (const command of sortCommands(commands)) {
    const bucket = grouped.get(command.category);

    if (bucket) {
      bucket.push(command);
    } else {
      grouped.set(command.category, [command]);
    }
  }

  return COMMAND_CATEGORY_ORDER.flatMap((category) => {
    const categoryCommands = grouped.get(category);

    if (!categoryCommands?.length) {
      return [];
    }

    return [
      {
        id: `group-${category.toLowerCase()}`,
        heading: category,
        commands: categoryCommands,
      },
    ];
  });
}

function normalizeKeywords(
  command: Pick<BaseCommand, "title" | "keywords" | "category">
): string[] {
  return Array.from(
    new Set(
      [command.title, command.category, ...command.keywords]
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    )
  );
}
