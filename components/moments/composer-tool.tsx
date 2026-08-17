import type { IconifyIcon } from "@iconify/types";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

type ComposerToolType = "image" | "video" | "poll" | "emoji" | "topic" | "location";

export interface ComposerToolProps {
  id: ComposerToolType;
  icon: string | IconifyIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function ComposerTool({ icon, label, onClick, disabled = false }: ComposerToolProps) {
  return (
    <Button
      isDisabled={disabled}
      variant="tertiary"
      onClick={onClick}
      className="flex h-18 w-18 min-w-18 flex-col items-center justify-center gap-1 rounded-2xl transition"
    >
      <span className="flex size-6 items-center justify-center">
        <Icon icon={icon} className="size-5" />
      </span>
      <span className="text-sm leading-none">{label}</span>
    </Button>
  );
}
