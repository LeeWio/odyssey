import { Link, Separator } from "@heroui/react";
import type { ReactNode } from "react";

export const AuthDivider = () => (
  <div className="flex items-center gap-3 py-1">
    <Separator className="flex-1" variant="secondary" />
    <p className="text-muted shrink-0 text-xs">OR</p>
    <Separator className="flex-1" variant="secondary" />
  </div>
);

interface AuthSwitchPromptProps {
  actionLabel: ReactNode;
  onAction?: () => void;
  text: ReactNode;
}

export const AuthSwitchPrompt = ({ actionLabel, onAction, text }: AuthSwitchPromptProps) => (
  <div className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm">
    <span>{text}</span>
    <Link onPress={onAction}>{actionLabel}</Link>
  </div>
);
