import { Button, Dropdown, Label, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { useRichTextCommands } from "../hooks/use-rich-text-commands";
import type { useTextMenuStates } from "../hooks/use-text-menu-states";

const scripts = [
  { id: "subscript", label: "Subscript", icon: "subscript" },
  { id: "superscript", label: "Superscript", icon: "superscript" },
] as const;

const alignment = [
  { id: "alignLeft", label: "Align left", icon: "text-align-left" },
  { id: "alignCenter", label: "Center", icon: "text-align-center" },
  { id: "alignRight", label: "Align right", icon: "text-align-right" },
  { id: "alignJustify", label: "Justify", icon: "text-align-justify" },
] as const;

const indentation = [
  { id: "outdent", label: "Decrease indent", icon: "text-outdent", availability: "canOutdent" },
  { id: "indent", label: "Increase indent", icon: "text-indent", availability: "canIndent" },
] as const;

export function MoreFormattingMenu({
  states,
  commands,
}: {
  states: ReturnType<typeof useTextMenuStates>;
  commands: ReturnType<typeof useRichTextCommands>;
}) {
  const submenus = [
    { id: "script", label: "Subscript and superscript", icon: "superscript", items: scripts },
    { id: "alignment", label: "Alignment", icon: "text-align-left", items: alignment },
    { id: "indentation", label: "Indentation", icon: "text-indent", items: indentation },
  ] as const;

  return (
    <Dropdown>
      <Tooltip>
        <Button isIconOnly size="sm" variant="ghost" aria-label="More text formatting options">
          <Icon icon="gravity-ui:ellipsis" aria-hidden="true" />
        </Button>
        <Tooltip.Content>More formatting</Tooltip.Content>
      </Tooltip>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu aria-label="More formatting">
          {submenus.map(({ id, label, icon, items }) => (
            <Dropdown.SubmenuTrigger key={id}>
              <Dropdown.Item id={id} textValue={label}>
                <Icon icon={`gravity-ui:${icon}`} aria-hidden="true" />
                <Label>{label}</Label>
                <Dropdown.SubmenuIndicator />
              </Dropdown.Item>
              <Dropdown.Popover>
                <Dropdown.Menu aria-label={label}>
                  {items.map((item) => {
                    const { id, label, icon } = item;
                    const isDisabled = "availability" in item && !states[item.availability];
                    const isActive = !("availability" in item) && states[item.id];

                    return (
                      <Dropdown.Item
                        key={id}
                        id={id}
                        textValue={label}
                        isDisabled={isDisabled}
                        onAction={commands[id]}
                      >
                        <Icon icon={`gravity-ui:${icon}`} aria-hidden="true" />
                        <Label>{label}</Label>
                        {isActive && <Icon icon="gravity-ui:check" aria-label="Active" />}
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown.SubmenuTrigger>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
