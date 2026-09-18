import { cn } from "@heroui/react";

interface MarkProps {
  className?: string;
}

/** Geometric window panes — not an official trademark mark */
export function WindowsSilhouette({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={cn("text-sky-500", className)} aria-hidden="true" fill="currentColor">
      <rect x="8" y="10" width="22" height="20" rx="2" />
      <rect x="34" y="8" width="22" height="22" rx="2" opacity="0.85" />
      <rect x="8" y="34" width="22" height="22" rx="2" opacity="0.9" />
      <rect x="34" y="34" width="22" height="20" rx="2" opacity="0.75" />
    </svg>
  );
}
