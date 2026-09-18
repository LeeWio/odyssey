"use client";

import { Skeleton } from "@heroui/react";
import type { CommentGovernanceOverviewResponse } from "@/lib/features/comment";

interface OverviewCardsProps {
  overview?: CommentGovernanceOverviewResponse;
  isLoading: boolean;
}

const CARDS: Array<{
  key: keyof CommentGovernanceOverviewResponse;
  label: string;
}> = [
  { key: "totalComments", label: "Total" },
  { key: "pendingComments", label: "Pending" },
  { key: "openReports", label: "Open reports" },
  { key: "reportsLast24Hours", label: "Reports 24h" },
  { key: "autoFlaggedLast24Hours", label: "Auto-flagged 24h" },
  { key: "spamComments", label: "Spam" },
];

export function CommentOverviewCards({ overview, isLoading }: OverviewCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="bg-surface border-border rounded-2xl border px-4 py-3 shadow-sm"
        >
          <p className="text-muted text-xs font-medium tracking-wide uppercase">{card.label}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-16 rounded-md" />
          ) : (
            <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
              {Number(overview?.[card.key] ?? 0)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
