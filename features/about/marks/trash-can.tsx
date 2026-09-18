import { cn } from "@heroui/react";

interface TrashCanProps {
  className?: string;
  showLid?: boolean;
}

export function TrashCan({ className, showLid = true }: TrashCanProps) {
  return (
    <svg
      viewBox="0 0 80 96"
      className={cn("text-foreground/80", className)}
      aria-hidden="true"
      fill="none"
    >
      {showLid ? (
        <g data-trash-lid>
          <rect x="18" y="10" width="44" height="8" rx="2" className="fill-current opacity-80" />
          <rect x="34" y="4" width="12" height="8" rx="2" className="fill-current opacity-55" />
        </g>
      ) : null}
      <g data-trash-body>
        <path
          d="M22 22h36l-3.5 58a6 6 0 0 1-6 5.5H31.5a6 6 0 0 1-6-5.5L22 22Z"
          className="fill-current stroke-current opacity-25"
          strokeWidth="2"
        />
        <path
          d="M32 34v36M40 34v36M48 34v36"
          className="stroke-current opacity-45"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
