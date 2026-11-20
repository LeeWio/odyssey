"use client";

import { Skeleton } from "@heroui/react";
import type { CommentGovernanceOverviewResponse } from "@/lib/features/comment";
import { useTranslations } from "next-intl";

interface OverviewCardsProps {
  overview?: CommentGovernanceOverviewResponse;
  isLoading: boolean;
}

const CARD_KEYS: Array<{
  key: keyof CommentGovernanceOverviewResponse;
}> = [
  { key: "totalComments" },
  { key: "pendingComments" },
  { key: "openReports" },
  { key: "reportsLast24Hours" },
  { key: "autoFlaggedLast24Hours" },
  { key: "spamComments" },
];

export function CommentOverviewCards({ overview, isLoading }: OverviewCardsProps) {
  const t = useTranslations("Dashboard");
  const labels = ["comments", "pending", "reports", "reports24h", "autoFlagged24h", "spam"];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {CARD_KEYS.map((card, index) => (
        <div
          key={card.key}
          className="bg-surface border-border rounded-2xl border px-4 py-3 shadow-sm"
        >
          <p className="text-muted text-xs font-medium tracking-wide uppercase">
            {t(`comments.${labels[index]}`)}
          </p>
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
