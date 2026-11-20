"use client";

import { Chip } from "@heroui/react";
import type { CommentStatus } from "@/lib/features/comment";

const STATUS_COLOR: Record<CommentStatus, "success" | "warning" | "danger" | "default"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  SPAM: "default",
};

export function CommentStatusChip({ status }: { status?: CommentStatus | null }) {
  if (!status) return <span className="text-muted text-sm">—</span>;
  return (
    <Chip size="sm" variant="soft" color={STATUS_COLOR[status]}>
      {status}
    </Chip>
  );
}
