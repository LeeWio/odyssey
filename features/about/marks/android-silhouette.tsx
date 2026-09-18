import { cn } from "@heroui/react";

interface MarkProps {
  className?: string;
}

/** Geometric stand-in — not an official trademark mark */
export function AndroidSilhouette({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("text-emerald-500", className)}
      aria-hidden="true"
      fill="currentColor"
    >
      <circle cx="22" cy="18" r="2.5" />
      <circle cx="42" cy="18" r="2.5" />
      <path d="M20 14c0-6.6 5.4-12 12-12s12 5.4 12 12v2H20v-2Z" opacity="0.95" />
      <rect x="14" y="20" width="36" height="28" rx="10" />
      <rect x="8" y="24" width="6" height="16" rx="3" />
      <rect x="50" y="24" width="6" height="16" rx="3" />
      <rect x="22" y="48" width="6" height="10" rx="3" />
      <rect x="36" y="48" width="6" height="10" rx="3" />
    </svg>
  );
}
