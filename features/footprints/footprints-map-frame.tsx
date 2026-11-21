import type { ReactNode } from "react";

export function FootprintsMapFrame({
  compact,
  children,
}: {
  compact: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-testid="footprints-map-frame"
      className={`relative w-full overflow-hidden ${compact ? "h-[clamp(28rem,60svh,44rem)]" : "h-[72vh] min-h-[32rem] rounded-3xl"}`}
    >
      {children}
    </div>
  );
}
