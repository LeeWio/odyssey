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
    <Button size="sm" isDisabled={disabled} variant="tertiary" onClick={onClick}>
      <Icon icon={icon} className="size-5" aria-label={label} />
      {label}
    </Button>
  );
}
