import { Display, Moon, Sun } from "@gravity-ui/icons";
import { Segment } from "@heroui-pro/react";
import { useTheme } from "next-themes";

export const useThemeSwitch = () => {
  const { theme, setTheme } = useTheme();

  const ModeSwitch = () => (
    <Segment
      selectedKey={theme ? theme : "system"}
      onSelectionChange={(key) => setTheme(String(key))}
      defaultSelectedKey="system"
      size="md"
    >
      <Segment.Item aria-label="Light" className="size-7 px-0" id="light">
        <Sun className="size-3.5" />
      </Segment.Item>
      <Segment.Item aria-label="Dark" className="size-7 px-0" id="dark">
        <Moon className="size-3.5" />
      </Segment.Item>
      <Segment.Item aria-label="System" className="size-7 px-0" id="system">
        <Display className="size-3.5" />
      </Segment.Item>
    </Segment>
  );

  const VariantSwitch = () => (
    <div className="text-sm text-default-500">Theme Variant Switcher Placeholder</div>
  );

  return { ModeSwitch, VariantSwitch };
};
