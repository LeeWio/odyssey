"use client";

import fuzzysort from "fuzzysort";

import {
  type ActionCommand,
  type BaseCommand,
  COMMAND_CATEGORY_ORDER,
  type CommandCategory,
  type CommandGroup,
  type CommandIntent,
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

/**
 * Professional fuzzy search using fuzzysort with multi-token support.
 * This implementation mimics the behavior of VS Code and Raycast by:
 * 1. Supporting subsequence matching (e.g., "dm" matches "Dark Mode").
 * 2. Using weighted scoring (Title > Keywords > Description).
 * 3. Requiring all tokens in the query to match (logical AND).
 */
export function filterCommands(
  commands: readonly CommandItem[],
  query: string,
  category?: CommandCategory | null
): CommandItem[] {
  // 1. Initial category filter
  const candidates = category ? commands.filter((cmd) => cmd.category === category) : [...commands];

  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return sortCommands(candidates); // Use default sort when no query
  }

  // 2. Tokenize the query for flexible multi-part matching (e.g., "t glass")
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return sortCommands(candidates);

  // 3. Score each candidate based on all tokens
  const scored = candidates
    .map((command) => {
      let totalScore = 0;

      // Every token must match at least one field
      for (const token of tokens) {
        // We check fields with different weights
        const titleResult = fuzzysort.single(token, command.title);
        const keywordsResult = fuzzysort.single(token, command.keywords.join(" "));
        const descResult = command.description
          ? fuzzysort.single(token, command.description)
          : null;

        if (!titleResult && !keywordsResult && !descResult) {
          return null; // Token didn't match anything, exclude this command
        }

        // Aggregate scores with weights
        // Fuzzysort scores are negative (higher is better, e.g., 0 is exact match)
        if (titleResult) totalScore += titleResult.score * 2; // Title has double weight
        if (keywordsResult) totalScore += keywordsResult.score * 1.5;
        if (descResult) totalScore += descResult.score;
      }

      return { command, score: totalScore };
    })
    .filter((item): item is { command: CommandItem; score: number } => item !== null);

  // 4. Sort primarily by score
  return scored
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.command.title.localeCompare(b.command.title);
    })
    .map((item) => item.command);
}

export function buildCommandSearchText(command: CommandItem): string {
  return [command.title, command.description ?? "", ...command.keywords].join(" ");
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

/**
 * Groups commands by category while preserving the order provided by the input.
 * If the input is already sorted by search score, the groups will maintain that ranking.
 */
export function groupCommands(commands: readonly CommandItem[]): CommandGroup[] {
  const grouped = new Map<CommandCategory, CommandItem[]>();

  // Use the provided order (e.g., from filterCommands)
  for (const command of commands) {
    const bucket = grouped.get(command.category);

    if (bucket) {
      bucket.push(command);
    } else {
      grouped.set(command.category, [command]);
    }
  }

  // Return groups in the order defined by COMMAND_CATEGORY_ORDER
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
  command: Pick<BaseCommand, "title" | "category"> & { keywords?: readonly string[] }
): string[] {
  return Array.from(
    new Set(
      [command.title, command.category, ...(command.keywords ?? [])]
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    )
  );
}
