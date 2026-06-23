import { PressEvent, ToggleButton, ToggleButtonVariants, Tooltip } from "@heroui/react";
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

interface ToggleButtonProps extends ToggleButtonVariants {
  children?: ReactNode;
  command: ToggleButtonCommand;
  tooltip?: ReactNode;
  onPress?: (e: PressEvent) => void;
}

export function ToggleButtonToolbar({
  command,
  onPress,
  children,
  tooltip,
  variant = "ghost",
  size = "sm",
  ...props
}: ToggleButtonProps) {
  const states = useTextMenuStates();
  const commands = useRichTextCommands();

  const isSelected = states[command];
  const onChange = commands[command];

  const button = (
    <ToggleButton
      onPress={onPress}
      isIconOnly
      isSelected={isSelected}
      onChange={onChange}
      variant={variant}
      size={size}
      aria-label={command}
      {...props}
    >
      {children}
    </ToggleButton>
  );

  if (tooltip) {
    return (
      <Tooltip delay={0}>
        {button}
        <Tooltip.Content>{tooltip}</Tooltip.Content>
      </Tooltip>
    );
  }
  return button;
}
