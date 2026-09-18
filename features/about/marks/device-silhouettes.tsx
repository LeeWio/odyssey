import { cn } from "@heroui/react";

interface MarkProps {
  className?: string;
}

export function MacSilhouette({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 72 56"
      className={cn("text-foreground", className)}
      aria-hidden="true"
      fill="currentColor"
    >
      <rect x="8" y="4" width="56" height="36" rx="4" opacity="0.9" />
      <rect x="12" y="8" width="48" height="28" rx="2" className="fill-background" />
      <rect x="28" y="42" width="16" height="4" rx="1" opacity="0.7" />
      <rect x="18" y="48" width="36" height="3" rx="1.5" opacity="0.45" />
    </svg>
  );
}

export function PhoneSilhouette({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 36 64"
      className={cn("text-foreground", className)}
      aria-hidden="true"
      fill="currentColor"
    >
      <rect x="4" y="2" width="28" height="60" rx="6" opacity="0.9" />
      <rect x="8" y="8" width="20" height="44" rx="2" className="fill-background" />
      <rect x="14" y="54" width="8" height="3" rx="1.5" opacity="0.5" />
    </svg>
  );
}

export function BudsSilhouette({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 56 40"
      className={cn("text-foreground", className)}
      aria-hidden="true"
      fill="currentColor"
    >
      <ellipse cx="16" cy="18" rx="10" ry="12" opacity="0.85" />
      <ellipse cx="40" cy="18" rx="10" ry="12" opacity="0.85" />
      <rect x="12" y="28" width="8" height="10" rx="3" opacity="0.55" />
      <rect x="36" y="28" width="8" height="10" rx="3" opacity="0.55" />
    </svg>
  );
}
