import { ToggleButton } from "@heroui/react";
import { ButtonVariants } from "@heroui/styles";
import { ReactNode } from "react";
import { useTextMenuStates } from "../menus/text-menu/hooks/use-text-menu-states";
import { useRichTextCommands } from "../menus/text-menu/hooks/use-rich-text-commands";

export type ToggleButtonCommand =
  | "subscript"
  | "superscript"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "alignJustify";

interface ToggleButtonProps extends ButtonVariants {
  children?: ReactNode;
  command: ToggleButtonCommand;
  tooltip?: ReactNode;
}

export function ToggleButtonToolbar({ command }: ToggleButtonProps) {
  const states = useTextMenuStates();
  const commands = useRichTextCommands();

  return <ToggleButton onPress={() => {}}></ToggleButton>;
}
