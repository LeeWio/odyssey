"use client";

import { Surface, cn } from "@heroui/react";

interface BeatProps {
  compact?: boolean;
}

const nodes = [
  { id: "a", x: "18%", y: "30%" },
  { id: "b", x: "48%", y: "22%" },
  { id: "c", x: "72%", y: "38%" },
  { id: "d", x: "34%", y: "62%" },
  { id: "e", x: "60%", y: "68%" },
];

export function LandscapeBeat({ compact = false }: BeatProps) {
  return (
    <Surface
      variant="secondary"
      className={cn(
        "border-separator/50 relative overflow-hidden rounded-3xl border p-6 sm:p-8",
        compact ? "min-h-[220px]" : "min-h-[320px]"
      )}
    >
      <div className={cn("relative mx-auto max-w-xl", compact ? "h-40" : "h-56")}>
        <div className="absolute inset-0 grid grid-cols-3 gap-3 opacity-20">
          {Array.from({ length: 6 }).map((_, drawer) => (
            <div key={drawer} className="border-separator/70 bg-foreground/5 rounded-xl border" />
          ))}
        </div>

        <svg className="absolute inset-0 size-full" aria-hidden="true">
          {nodes.slice(0, -1).map((node, index) => {
            const next = nodes[index + 1];
            return (
              <line
                key={`${node.id}-${next.id}`}
                x1={node.x}
                y1={node.y}
                x2={next.x}
                y2={next.y}
                className="stroke-accent/50"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {nodes.map((node) => (
          <div
            key={node.id}
            className="bg-accent absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_6px_color-mix(in_oklab,var(--accent)_18%,transparent)]"
            style={{ left: node.x, top: node.y }}
          />
        ))}
      </div>
    </Surface>
  );
}
